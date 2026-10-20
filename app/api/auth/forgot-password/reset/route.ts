import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyAndConsumeOtp } from "@/lib/otp";
import { enforceRateLimitAsync } from "@/lib/rateLimit";

const schema = z.object({
  email: z.string().email("Địa chỉ email không hợp lệ."),
  otpCode: z.string().min(6, "Mã OTP gồm 6 chữ số."),
  newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự.").max(128),
});

export async function POST(req: Request) {
  const limited = await enforceRateLimitAsync(req, "forgot-password-reset", 5, 15 * 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dữ liệu yêu cầu không hợp lệ." },
      { status: 400 }
    );
  }

  const { email, otpCode, newPassword } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  // Verify OTP first and use a uniform error message to prevent account enumeration
  const otpCheck = await verifyAndConsumeOtp(normalizedEmail, "RESET_PASSWORD", otpCode);
  if (!otpCheck.valid) {
    return NextResponse.json({ error: otpCheck.error || "Mã OTP không hợp lệ." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Mã xác thực OTP không đúng hoặc đã hết hạn." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return NextResponse.json({
    success: true,
    message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.",
  });
}
