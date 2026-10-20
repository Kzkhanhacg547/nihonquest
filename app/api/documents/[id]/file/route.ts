import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serveCatalogedFile } from "@/lib/document-file-server";
import { enforceRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = enforceRateLimit(req, "documents-file", 60, 60_000);
  if (limited) return limited;

  try {
    const idOrSlug = decodeURIComponent(params.id || "");
    if (!idOrSlug) {
      return NextResponse.json({ error: "Thiếu mã tài liệu." }, { status: 400 });
    }

    const doc = await prisma.documentResource.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Tài liệu không tồn tại trong danh mục Kho tài liệu." },
        { status: 404 }
      );
    }

    return serveCatalogedFile(req, doc);
  } catch (error) {
    console.error("Error in GET /api/documents/[id]/file:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi truy xuất tài liệu." },
      { status: 500 }
    );
  }
}
