import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const UNITCUMENTS_ROOT = path.resolve(process.cwd(), "unitcuments");

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
};

/**
 * Safely resolves a relative path inside `unitcuments/`, handling both NFC and NFD
 * directory/file names on Windows/macOS/Linux while strictly preventing path traversal.
 */
export function resolveSafeUnitcumentsPath(relativePath: string): string | null {
  if (!relativePath || relativePath.includes("..") || relativePath.includes("\0")) {
    return null;
  }

  const cleanRel = relativePath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^unitcuments\/+/i, "");
  if (!cleanRel) return null;
  const directCandidate = path.resolve(UNITCUMENTS_ROOT, cleanRel);
  if (!directCandidate.startsWith(UNITCUMENTS_ROOT + path.sep)) {
    return null;
  }
  if (fs.existsSync(directCandidate) && fs.statSync(directCandidate).isFile()) {
    return directCandidate;
  }

  // Try NFD / NFC segment-by-segment resolution from UNITCUMENTS_ROOT
  const segments = cleanRel.split("/").filter(Boolean);
  let currentDir = UNITCUMENTS_ROOT;
  let matchedAll = true;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segNfc = seg.normalize("NFC");
    const segNfd = seg.normalize("NFD");
    if (!fs.existsSync(currentDir) || !fs.statSync(currentDir).isDirectory()) {
      matchedAll = false;
      break;
    }
    const entries = fs.readdirSync(currentDir);
    const match = entries.find(
      (e) => e === seg || e.normalize("NFC") === segNfc || e.normalize("NFD") === segNfd
    );
    if (!match) {
      matchedAll = false;
      break;
    }
    currentDir = path.resolve(currentDir, match);
    if (!currentDir.startsWith(UNITCUMENTS_ROOT + path.sep)) {
      return null;
    }
  }

  if (matchedAll && fs.existsSync(currentDir) && fs.statSync(currentDir).isFile()) {
    return currentDir;
  }

  // Fallback: safely search within UNITCUMENTS_ROOT for a matching NFC/NFD relative suffix
  const targetSuffixNfc = "/" + cleanRel.normalize("NFC");
  const stack: string[] = [UNITCUMENTS_ROOT];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.resolve(dir, entry.name);
      if (!full.startsWith(UNITCUMENTS_ROOT + path.sep)) continue;
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        const relFromRoot = full
          .slice(UNITCUMENTS_ROOT.length)
          .replace(/\\/g, "/")
          .normalize("NFC");
        if (relFromRoot === targetSuffixNfc || relFromRoot.endsWith(targetSuffixNfc)) {
          return full;
        }
      }
    }
  }

  return null;
}

export function serveCatalogedFile(
  req: Request,
  doc: {
    fileName: string;
    relativePath: string;
    ext: string;
    accessPolicy: string;
  }
): Response {
  if (doc.accessPolicy === "METADATA_ONLY") {
    return NextResponse.json(
      {
        error:
          "Tài liệu này có dung lượng lớn hoặc thuộc diện chỉ tra cứu thông tin (METADATA_ONLY), không hỗ trợ tải trực tiếp.",
      },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const wantsDownload = url.searchParams.get("download") === "1";

  if (wantsDownload && doc.accessPolicy !== "DOWNLOADABLE") {
    return NextResponse.json(
      {
        error:
          "Tài liệu này thuộc diện bảo lưu bản quyền (Chỉ xem trực tuyến / Nghe trực tuyến), không cho phép tải xuống tệp gốc.",
      },
      { status: 403 }
    );
  }

  const fullPath = resolveSafeUnitcumentsPath(doc.relativePath);
  if (!fullPath) {
    return NextResponse.json(
      { error: "Không tìm thấy tệp vật lý hợp lệ hoặc đường dẫn đã thay đổi." },
      { status: 404 }
    );
  }

  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const ext = doc.ext.toLowerCase();
  const contentType = MIME_BY_EXT[ext] || "application/octet-stream";
  const encodedName = encodeURIComponent(doc.fileName);
  const dispositionType = wantsDownload ? "attachment" : "inline";

  const rangeHeader = req.headers.get("range");
  if (rangeHeader && (ext === ".mp3" || ext === ".pdf")) {
    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? Math.min(parseInt(match[2], 10), fileSize - 1) : fileSize - 1;
      if (start >= 0 && start <= end && end < fileSize) {
        const chunkLength = end - start + 1;
        const fd = fs.openSync(fullPath, "r");
        const buffer = Buffer.alloc(chunkLength);
        fs.readSync(fd, buffer, 0, chunkLength, start);
        fs.closeSync(fd);

        return new Response(buffer, {
          status: 206,
          headers: {
            "Content-Type": contentType,
            "Content-Length": String(chunkLength),
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Disposition": `${dispositionType}; filename*=UTF-8''${encodedName}`,
            "Cache-Control": "private, max-age=3600",
          },
        });
      }
    }
  }

  const buffer = fs.readFileSync(fullPath);
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileSize),
      "Accept-Ranges": "bytes",
      "Content-Disposition": `${dispositionType}; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

