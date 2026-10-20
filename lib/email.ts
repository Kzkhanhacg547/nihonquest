import nodemailer from "nodemailer";

export interface SendOtpEmailParams {
  to: string;
  code: string;
  type: "REGISTER" | "RESET_PASSWORD";
}

export async function sendOtpEmail({ to, code, type }: SendOtpEmailParams): Promise<{ success: boolean; devPreview?: boolean; error?: string }> {
  const isRegister = type === "REGISTER";
  const title = isRegister ? "Xác nhận tạo tài khoản Nihon Quest 🌸" : "Mã xác nhận khôi phục mật khẩu 🔑";
  const actionText = isRegister ? "xác thực email để tạo tài khoản Nihon Quest" : "khôi phục mật khẩu tài khoản Nihon Quest của bạn";

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fdf2f8; margin: 0; padding: 24px; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #fbcfe8; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(244, 63, 94, 0.1); }
        .header { background: linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #f59e0b 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .logo { font-size: 32px; font-weight: 900; margin-bottom: 8px; }
        .subtitle { font-size: 14px; opacity: 0.9; margin: 0; }
        .content { padding: 32px 28px; color: #334155; line-height: 1.6; }
        .greeting { font-size: 16px; font-weight: bold; margin-bottom: 12px; }
        .otp-box { background: #fff1f2; border: 2px dashed #f43f5e; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #e11d48; margin: 0; }
        .expiry { font-size: 12px; color: #881337; margin-top: 8px; font-weight: bold; }
        .note { font-size: 13px; color: #64748b; margin-top: 20px; }
        .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">🌸 Nihon Quest</div>
          <p class="subtitle">Học Tiếng Nhật Thông Minh & Thú Vị</p>
        </div>
        <div class="content">
          <div class="greeting">Konnichiwa! (Xin chào) 👋</div>
          <p>Bạn nhận được email này vì đã gửi yêu cầu <strong>${actionText}</strong>.</p>
          <div class="otp-box">
            <p style="margin: 0 0 6px 0; font-size: 12px; color: #9f1239; font-weight: bold; text-transform: uppercase;">Mã xác thực OTP của bạn</p>
            <div class="otp-code">${code}</div>
            <div class="expiry">⏱️ Mã có hiệu lực trong vòng 10 phút</div>
          </div>
          <p class="note">⚠️ Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc đổi mật khẩu để bảo vệ an toàn cho tài khoản.</p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Nihon Quest. Chúc bạn học tập thật tốt trên hành trình chinh phục tiếng Nhật！🇯🇵
        </div>
      </div>
    </body>
    </html>
  `;

  const service = process.env.SMTP_SERVICE;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || (user ? `"Nihon Quest 🌸" <${user}>` : `"Nihon Quest" <noreply@nihonquest.local>`);

  // In test environment, skip real sending
  if (process.env.NODE_ENV === "test") {
    return { success: true, devPreview: true };
  }

  // Missing SMTP credentials used to return success:true and print the OTP to
  // stdout, so the user saw "OTP sent" and never received it. In production
  // this must fail loudly; only a real dev server may simulate delivery.
  if (!user || !pass) {
    if (process.env.NODE_ENV === "production") {
      console.error("[EMAIL] SMTP_USER/SMTP_PASS are not configured; refusing to simulate delivery.");
      return {
        success: false,
        error: "Máy chủ chưa cấu hình dịch vụ gửi email. Vui lòng thử lại sau.",
      };
    }
    console.log(`\n================== [DEV EMAIL SIMULATOR - NO CREDENTIALS] ==================`);
    console.log(`📩 TO: ${to}`);
    console.log(`📌 TYPE: ${type}`);
    console.log(`🔑 OTP CODE: [ ${code} ]`);
    console.log(`=============================================================================\n`);
    return { success: true, devPreview: true };
  }

  try {
    const transporter = service === "gmail" || (!host && user.includes("@gmail.com"))
      ? nodemailer.createTransport({
          service: "gmail",
          auth: { user, pass },
          // `logger`/`debug` printed the whole SMTP session, including the OTP,
          // to stdout in production.
          ...(process.env.NODE_ENV === "development" ? { logger: true, debug: true } : {}),
        })
      : nodemailer.createTransport({
          host: host || "smtp.gmail.com",
          port,
          secure: port === 465,
          auth: { user, pass },
        });

    await transporter.sendMail({
      from,
      to,
      subject: title,
      html,
    });

    console.log(`✅ [EMAIL SENT SUCCESSFULLY] to ${to}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to send email via SMTP:", error);
    return { success: false, error: error?.message || "Lỗi gửi email qua máy chủ SMTP." };
  }
}

export interface SendStudyReminderEmailParams {
  to: string;
  userName?: string | null;
  streak?: number;
  dueCards?: number;
  currentLevel?: string;
  nativeLanguage?: "vi" | "en";
}

export async function sendStudyReminderEmail({
  to,
  userName = "Học viên",
  streak = 0,
  dueCards = 0,
  currentLevel = "N5",
  nativeLanguage = "vi",
}: SendStudyReminderEmailParams): Promise<{ success: boolean; devPreview?: boolean; error?: string }> {
  const isEn = nativeLanguage === "en";
  const name = userName || (isEn ? "Learner" : "Bạn");
  const subject = isEn
    ? `🌸 Nihon Quest Daily Reminder: Keep your ${streak}-day streak alive!`
    : `🌸 Nihon Quest: Giữ vững chuỗi ${streak} ngày Streak & ôn luyện hôm nay!`;

  const baseUrl = process.env.NEXTAUTH_URL || "https://nihonquest.netlify.app";

  const html = `
    <!DOCTYPE html>
    <html lang="${isEn ? "en" : "vi"}">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fdf2f8; margin: 0; padding: 24px; }
        .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #fbcfe8; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(244, 63, 94, 0.12); }
        .header { background: linear-gradient(135deg, #d92f25 0%, #f43f5e 50%, #f59e0b 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .logo { font-size: 28px; font-weight: 900; margin-bottom: 6px; letter-spacing: -0.5px; }
        .subtitle { font-size: 14px; opacity: 0.95; margin: 0; }
        .content { padding: 30px 28px; color: #334155; line-height: 1.6; }
        .greeting { font-size: 18px; font-weight: bold; margin-bottom: 12px; color: #0f172a; }
        .stats-grid { display: flex; gap: 12px; margin: 20px 0; }
        .stat-box { flex: 1; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 16px; padding: 14px; text-align: center; }
        .stat-val { font-size: 22px; font-weight: 900; color: #e11d48; margin-bottom: 2px; }
        .stat-lbl { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #9f1239; }
        .advice-box { background: #f8fafc; border-left: 4px solid #f43f5e; padding: 14px 18px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #475569; }
        .btn-wrap { text-align: center; margin: 28px 0 16px 0; }
        .cta-btn { display: inline-block; background: linear-gradient(135deg, #e11d48, #d92f25); color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.35); }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">🌸 Nihon Quest 日本クエスト</div>
          <p class="subtitle">${isEn ? "Personalized Japanese Learning Assistant" : "Hành Trình Khám Phá & Học Tiếng Nhật Thông Minh"}</p>
        </div>
        <div class="content">
          <div class="greeting">${isEn ? `Konnichiwa, ${name}! 👋` : `Konnichiwa, ${name}! 👋`}</div>
          <p>${isEn ? "Aoi Sensei and your Nihon Quest study plan are waiting for you today. Just 10-15 minutes of consistent practice makes a huge difference!" : "Aoi Sensei gửi lời chào và nhắc bạn dành ra 10-15 phút hôm nay để giữ nhịp học tiếng Nhật thật đều đặn nhé!"}</p>
          
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
            <tr>
              <td width="33%" style="padding: 4px;">
                <div class="stat-box">
                  <div class="stat-val">🔥 ${streak}</div>
                  <div class="stat-lbl">${isEn ? "Day Streak" : "Ngày Streak"}</div>
                </div>
              </td>
              <td width="33%" style="padding: 4px;">
                <div class="stat-box">
                  <div class="stat-val">⏰ ${dueCards}</div>
                  <div class="stat-lbl">${isEn ? "SRS Due" : "Thẻ Cần Ôn"}</div>
                </div>
              </td>
              <td width="33%" style="padding: 4px;">
                <div class="stat-box">
                  <div class="stat-val">🎯 ${currentLevel}</div>
                  <div class="stat-lbl">${isEn ? "Current JLPT" : "Cấp độ JLPT"}</div>
                </div>
              </td>
            </tr>
          </table>

          <div class="advice-box">
            <strong>🌸 Kawaii Sensei Tip:</strong><br />
            ${isEn
              ? dueCards > 0
                ? `You have <strong>${dueCards} cards</strong> ready for SRS spaced repetition review. Clear them now to lock vocabulary into permanent memory!`
                : "Great job keeping up with your reviews! Try completing 1 new lesson or have a 5-minute chat with AI Sensei today."
              : dueCards > 0
                ? `Hôm nay bạn đang có <strong>${dueCards} thẻ từ vựng</strong> đến hạn ôn tập SRS. Ôn ngay lúc này là thời điểm vàng để từ vựng khắc sâu vào trí nhớ dài hạn đấy!`
                : "Tiến độ của bạn đang rất tốt! Hôm nay hãy hoàn thành 1 bài học mới hoặc trò chuyện 5 phút cùng AI Sensei nhé."
            }
          </div>

          <div class="btn-wrap">
            <a href="${baseUrl}/app" class="cta-btn" target="_blank">
              ${isEn ? "Continue Learning Now →" : "Vào Học & Ôn Tập Ngay →"}
            </a>
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Nihon Quest. Chúc bạn học tập thật tốt trên hành trình chinh phục tiếng Nhật！🇯🇵
        </div>
      </div>
    </body>
    </html>
  `;

  const service = process.env.SMTP_SERVICE;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || (user ? `"Aoi Sensei 🌸 Nihon Quest" <${user}>` : `"Nihon Quest" <noreply@nihonquest.local>`);

  if (!user || !pass) {
    if (process.env.NODE_ENV === "production") {
      console.log(`[EMAIL SIMULATED in prod without smtp]: ${to} | ${subject}`);
      return { success: true, devPreview: true };
    }
    console.log(`\n================== [DEV STUDY REMINDER EMAIL] ==================`);
    console.log(`📩 TO: ${to}`);
    console.log(`📌 SUBJECT: ${subject}`);
    console.log(`🔥 STREAK: ${streak} | ⏰ DUE CARDS: ${dueCards}`);
    console.log(`=================================================================\n`);
    return { success: true, devPreview: true };
  }

  try {
    const transporter = service === "gmail" || (!host && user.includes("@gmail.com"))
      ? nodemailer.createTransport({
          service: "gmail",
          auth: { user, pass },
          ...(process.env.NODE_ENV === "development" ? { logger: true, debug: true } : {}),
        })
      : nodemailer.createTransport({
          host: host || "smtp.gmail.com",
          port,
          secure: port === 465,
          auth: { user, pass },
        });

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(`✅ [STUDY REMINDER SENT] to ${to}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to send study reminder email:", error);
    return { success: false, error: error?.message || "Lỗi gửi email qua máy chủ SMTP." };
  }
}
