"use client";

import { useState, useEffect, useMemo } from "react";

export interface CatalogDocumentItem {
  id: string;
  slug: string;
  title: string;
  fileName: string;
  relativePath: string;
  ext: string;
  sizeBytes: number;
  level: string;
  category: string;
  importStatus: string;
  accessPolicy: "DOWNLOADABLE" | "VIEW_ONLY" | "AUDIO_STREAM" | "METADATA_ONLY" | string;
  isDuplicate: boolean;
  duplicateOf: string | null;
  copyrightNote: string | null;
  description: string | null;
  canPreviewPdf: boolean;
  canStreamAudio: boolean;
  canDownload: boolean;
  fileUrl: string;
}

interface DocumentVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLevel?: string;
}

const LEVEL_TABS = [
  { key: "ALL", label: "Tất cả cấp độ" },
  { key: "FPT", label: "🎓 Giáo trình FPT (JPD)" },
  { key: "N5", label: "🌸 JLPT N5" },
  { key: "N4", label: "⛩️ JLPT N4" },
  { key: "N3", label: "🗼 JLPT N3" },
];

const CATEGORY_TABS = [
  { key: "ALL", label: "Tất cả loại" },
  { key: "TEXTBOOK", label: "📘 Giáo trình" },
  { key: "EXAM", label: "📝 Đề thi" },
  { key: "ANSWER_KEY", label: "✅ Đáp án & Script" },
  { key: "AUDIO", label: "🎧 Audio nghe" },
  { key: "REFERENCE", label: "🗂️ Tài liệu ôn tập" },
];

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function getAccessBadge(policy: string) {
  switch (policy) {
    case "DOWNLOADABLE":
      return {
        label: "Cho phép xem & tải xuống",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      };
    case "VIEW_ONLY":
      return {
        label: "Chỉ xem trực tuyến",
        className:
          "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
      };
    case "AUDIO_STREAM":
      return {
        label: "Nghe trực tuyến (MP3)",
        className:
          "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
      };
    default:
      return {
        label: "Chỉ tra cứu metadata",
        className:
          "bg-slate-100 text-slate-600 border-slate-200 dark:bg-sumi-800 dark:text-slate-400 dark:border-slate-700",
      };
  }
}

export function DocumentVaultModal({
  isOpen,
  onClose,
}: DocumentVaultModalProps) {
  const [documents, setDocuments] = useState<CatalogDocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activePreview, setActivePreview] = useState<CatalogDocumentItem | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/documents")
      .then(async (res) => {
        if (!res.ok) throw new Error("Không thể tải danh mục tài liệu");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setDocuments(data.documents || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Lỗi kết nối máy chủ");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return documents.filter((d) => {
      if (levelFilter !== "ALL" && d.level !== levelFilter) return false;
      if (categoryFilter !== "ALL" && d.category !== categoryFilter) return false;
      if (q) {
        const hay = `${d.title} ${d.fileName} ${d.description || ""} ${d.level}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [documents, levelFilter, categoryFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-sumi-900">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-sumi-950/60 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <h2
                id="vault-modal-title"
                className="text-base font-black text-slate-900 dark:text-white sm:text-lg"
              >
                Kho Tài Liệu & Đề Thi Chuẩn Hóa (FPT JPD & JLPT N5–N3)
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Danh mục {documents.length} tài liệu đã kiểm định chống trùng SHA-256 · Xem trước PDF, nghe Audio MP3 hoặc tải tài liệu được cấp phép.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-sumi-800 dark:text-slate-300"
            aria-label="Đóng kho tài liệu"
          >
            ✕
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="space-y-3 border-b border-slate-200/80 px-5 py-3.5 dark:border-slate-800 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Level filters */}
            <div className="flex flex-wrap gap-1.5">
              {LEVEL_TABS.map((tab) => {
                const active = levelFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setLevelFilter(tab.key)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      active
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-sumi-800 dark:text-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search box */}
            <div className="relative w-full sm:w-64">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên đề thi, JPD113, Shinkanzen..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-sumi-850 dark:text-white"
              />
            </div>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_TABS.map((cat) => {
                const active = categoryFilter === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategoryFilter(cat.key)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      active
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 dark:bg-sumi-800/70 dark:text-slate-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Hiển thị <b>{filteredDocs.length}</b> tài liệu hợp lệ
            </span>
          </div>
        </div>

        {/* BODY: LIST + OPTIONAL PREVIEW PANE */}
        <div className="grid flex-1 overflow-hidden lg:grid-cols-12">
          <div
            className={`overflow-y-auto p-4 sm:p-6 ${
              activePreview ? "lg:col-span-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800" : "lg:col-span-12"
            }`}
          >
            {loading && (
              <div className="py-12 text-center text-sm font-semibold text-slate-500">
                ⏳ Đang tải danh mục Kho tài liệu từ cơ sở dữ liệu...
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                ⚠️ {error}
              </div>
            )}

            {!loading && !error && filteredDocs.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">
                Không tìm thấy tài liệu nào khớp với bộ lọc hiện tại.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {filteredDocs.map((doc) => {
                const accessBadge = getAccessBadge(doc.accessPolicy);
                const isSelected = activePreview?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-red-500 bg-red-50/40 ring-2 ring-red-500/20 dark:border-red-500 dark:bg-red-950/20"
                        : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-sumi-850"
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                            {doc.level}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-700 dark:bg-sumi-800 dark:text-slate-300">
                            {doc.ext.replace(".", "")}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {formatFileSize(doc.sizeBytes)}
                          </span>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${accessBadge.className}`}
                        >
                          {accessBadge.label}
                        </span>
                      </div>

                      <h3 className="mt-2.5 line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                        {doc.fileName}
                      </h3>
                      {doc.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {doc.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {doc.canPreviewPdf && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewError(null);
                              setActivePreview(doc);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                          >
                            👁️ Xem trước PDF
                          </button>
                        )}
                        {doc.canStreamAudio && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewError(null);
                              setActivePreview(doc);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-indigo-700"
                          >
                            ▶️ Nghe Audio
                          </button>
                        )}
                        {doc.canDownload ? (
                          <a
                            href={`${doc.fileUrl}?download=1`}
                            download={doc.fileName}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                          >
                            ⬇️ Tải xuống
                          </a>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            🔒 Không tải tệp gốc
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PREVIEW PANE */}
          {activePreview && (
            <div className="flex flex-col bg-slate-50 p-4 dark:bg-sumi-950 lg:col-span-6 sm:p-6">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400">
                    {activePreview.canPreviewPdf ? "📄 Xem trước tài liệu PDF" : "🎧 Trình phát Audio luyện thi"}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {activePreview.fileName}
                  </h3>
                  {activePreview.copyrightNote && (
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {activePreview.copyrightNote}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActivePreview(null)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-sumi-800 dark:text-slate-300"
                >
                  Đóng xem trước
                </button>
              </div>

              {previewError && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  {previewError}
                </div>
              )}

              {activePreview.canStreamAudio && (
                <div className="my-auto flex flex-col items-center justify-center rounded-2xl border border-indigo-200 bg-white p-6 text-center shadow-sm dark:border-indigo-900/50 dark:bg-sumi-900">
                  <div className="mb-3 text-4xl">🎧</div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {activePreview.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Định dạng: MP3 · Dung lượng: {formatFileSize(activePreview.sizeBytes)}
                  </p>
                  <audio
                    key={activePreview.id}
                    controls
                    preload="metadata"
                    src={activePreview.fileUrl}
                    onError={() =>
                      setPreviewError("Không thể phát tệp âm thanh này. Vui lòng kiểm tra lại kết nối.")
                    }
                    className="mt-4 w-full max-w-md"
                  />
                </div>
              )}

              {activePreview.canPreviewPdf && (
                <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner dark:border-slate-800 dark:bg-sumi-900">
                  <iframe
                    key={activePreview.id}
                    src={activePreview.fileUrl}
                    title={activePreview.fileName}
                    className="h-[52vh] w-full flex-1 border-0"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-sumi-950">
                    <span>Nếu trình duyệt di động không hiển thị khung PDF trực tiếp:</span>
                    <a
                      href={activePreview.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-red-600 underline hover:text-red-700 dark:text-red-400"
                    >
                      Mở xem trong tab mới ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

