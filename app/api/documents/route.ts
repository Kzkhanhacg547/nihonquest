import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = enforceRateLimit(req, "documents-list", 60, 60_000);
  if (limited) return limited;

  try {
    const { searchParams } = new URL(req.url);
    const level = (searchParams.get("level") || "ALL").toUpperCase();
    const category = (searchParams.get("category") || "ALL").toUpperCase();
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const includeDuplicates = searchParams.get("includeDuplicates") === "true";

    const where: Record<string, any> = {};
    if (level !== "ALL") {
      where.level = level;
    }
    if (category !== "ALL") {
      where.category = category;
    }
    if (!includeDuplicates) {
      where.isDuplicate = false;
    }

    const docs = await prisma.documentResource.findMany({
      where,
      orderBy: [{ level: "asc" }, { category: "asc" }, { fileName: "asc" }],
    });

    const filtered = query
      ? docs.filter(
          (d) =>
            d.title.toLowerCase().includes(query) ||
            d.fileName.toLowerCase().includes(query) ||
            (d.description || "").toLowerCase().includes(query) ||
            d.relativePath.toLowerCase().includes(query)
        )
      : docs;

    return NextResponse.json({
      documents: filtered.map((d) => ({
        id: d.id,
        slug: d.slug,
        title: d.title,
        fileName: d.fileName,
        relativePath: d.relativePath,
        ext: d.ext,
        sizeBytes: d.sizeBytes,
        level: d.level,
        category: d.category,
        importStatus: d.importStatus,
        accessPolicy: d.accessPolicy,
        isDuplicate: d.isDuplicate,
        duplicateOf: d.duplicateOf,
        copyrightNote: d.copyrightNote,
        description: d.description,
        canPreviewPdf: d.ext === ".pdf" && d.accessPolicy !== "METADATA_ONLY",
        canStreamAudio: d.ext === ".mp3" && d.accessPolicy !== "METADATA_ONLY",
        canDownload: d.accessPolicy === "DOWNLOADABLE",
        fileUrl: `/api/documents/${encodeURIComponent(d.id)}/file`,
      })),
      total: filtered.length,
    });
  } catch (error) {
    console.error("Error in GET /api/documents:", error);
    return NextResponse.json(
      { error: "Không thể tải danh mục Kho tài liệu" },
      { status: 500 }
    );
  }
}
