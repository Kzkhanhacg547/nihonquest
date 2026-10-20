import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimited } from "@/lib/rateLimit";

const schema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = rateLimit(`password-change:${userId}`, 5, 15 * 60_000);
  if (!limit.ok) return rateLimited(limit.retryAfterSeconds);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu mật khẩu không hợp lệ." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) return NextResponse.json({ error: "Tài khoản này đăng nhập qua OAuth, không dùng mật khẩu." }, { status: 400 });
  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Mật khẩu hiện tại không chính xác." }, { status: 400 });
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
  });
  return NextResponse.json({ ok: true });
}
