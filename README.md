<div align="center">

# 🌸 Nihon Quest

### Nền tảng học tiếng Nhật tương tác & gamification

*Từ bảng chữ cái đến JLPT N5 – N3, qua hành trình khám phá Nhật Bản*

![Next.js](https://img.shields.io/badge/Next.js-14.2.5-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.18.0-2D3748?logo=prisma&logoColor=white)
![Vitest](https://img.shields.io/badge/Tested_with-Vitest_2.0-6E9F18?logo=vitest&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

[Tính năng](#-tính-năng-nổi-bật) · [Cài đặt](#-cài-đặt-và-khởi-chạy) · [Scripts](#-danh-sách-lệnh-scripts) · [Xử lý sự cố](#-xử-lý-sự-cố-thường-gặp)

</div>

---

## 📑 Mục lục

1. [Giới thiệu tổng quan](#-giới-thiệu-tổng-quan)
2. [Tính năng nổi bật](#-tính-năng-nổi-bật)
3. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
4. [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
5. [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
6. [Cài đặt và khởi chạy](#-cài-đặt-và-khởi-chạy)
7. [Cấu hình biến môi trường](#-cấu-hình-biến-môi-trường)
8. [Cơ sở dữ liệu và dữ liệu mẫu](#-cơ-sở-dữ-liệu-và-dữ-liệu-mẫu)
9. [Danh sách lệnh scripts](#-danh-sách-lệnh-scripts)
10. [Xử lý sự cố thường gặp](#-xử-lý-sự-cố-thường-gặp)
11. [Đóng góp và bản quyền](#-đóng-góp-và-bản-quyền)

---

## 🌟 Giới thiệu tổng quan

**Nihon Quest** là ứng dụng web học tiếng Nhật toàn diện, xây dựng theo kiến trúc **Full-stack Monolith** trên **Next.js 14 App Router**. Ứng dụng biến việc học ngoại ngữ khô khan thành một hành trình nhập vai khám phá Nhật Bản:

- 👀 **Học qua nhiều giác quan:** hình ảnh, âm thanh phát âm bản ngữ, vẽ tay trực tiếp từng nét bút.
- 🔥 **Giữ động lực:** tích lũy XP, chuỗi ngày học (Streak), nhiệm vụ hàng ngày và bảng xếp hạng.
- 🧠 **Ghi nhớ lâu dài:** thuật toán lặp lại ngắt quãng (SRS) dựa trên đường cong quên lãng Ebbinghaus.

---

## 🚀 Tính năng nổi bật

| | Tính năng | Mô tả ngắn |
| :-: | :--- | :--- |
| ⛩️ | **Phòng Nhật Bản 3D** | Căn phòng tương tác phong cách truyền thống, nhạc nền Lofi, giao diện Sáng/Tối |
| ✍️ | **Kana Lab** | Học Hiragana, Katakana, âm đục, bán âm đục, âm ghép và tập viết trên Canvas |
| 📖 | **Từ vựng & Ngữ pháp** | Flashcards, Kanji chi tiết và điểm ngữ pháp JLPT N5 – N3 |
| 🧠 | **Ôn tập SRS** | Tự động lên lịch ôn theo mức nhớ Easy / Good / Hard / Again |
| 🎯 | **Bài tập & Quiz** | Trắc nghiệm, điền từ, ghép nghĩa, dịch câu, thưởng XP tức thì |
| 🗺️ | **Hành trình Nhật Bản** | Bản đồ qua Tokyo, Kyoto, Osaka, Sapporo, Hiroshima… |
| 🏆 | **Gamification** | Cấp bậc, Streak, nhiệm vụ ngày, huy hiệu, bảng xếp hạng |
| 🤖 | **AI Sensei & Sinh tồn** | Chatbot giải đáp 24/7 và mô phỏng tình huống thực tế |

<details>
<summary><b>Xem chi tiết từng tính năng</b></summary>

<br>

### ⛩️ Không gian phòng Nhật Bản 3D
- Tương tác 3D với căn phòng truyền thống: chiếu Tatami, cửa lùa Shoji, đèn lồng, kệ sách, máy phát nhạc…
- Phát nhạc nền Lofi / thư giãn cùng nhiều hiệu ứng âm thanh.
- Hỗ trợ chế độ giao diện Sáng / Tối.

### ✍️ Kana Lab và luyện viết Canvas
- Đầy đủ Hiragana, Katakana, Dakuten, Handakuten và Yoon.
- Bảng vẽ Canvas cảm ứng/chuột, tập viết theo thứ tự nét chuẩn (stroke order).
- Phát âm thanh chuẩn cho từng ký tự.

### 📖 Từ vựng và ngữ pháp JLPT (N5 – N3)
- Flashcards phân loại theo cấp độ N5, N4, N3.
- Chi tiết Kanji: âm On, âm Kun, nghĩa Hán-Việt, nét viết.
- Ngữ pháp có cấu trúc chuẩn, giải thích chi tiết, ví dụ song ngữ Nhật – Việt/Romaji và các lỗi sai thường gặp.

### 🧠 Ôn tập SRS
- Dựa trên đường cong quên lãng Ebbinghaus.
- Tự động lên lịch cho từ vựng, chữ cái đã lưu hoặc làm sai.
- Chấm độ nhớ **Easy / Good / Hard / Again** để tính chu kỳ ôn tiếp theo.

### 🎯 Bài tập thực hành
- Trắc nghiệm, điền từ vào chỗ trống, ghép nghĩa, dịch câu.
- Chấm điểm trực tiếp, giải thích đáp án, thưởng XP.

### 🗺️ Bản đồ hành trình (Japan Journey)
- Chu du qua các thành phố nổi tiếng của Nhật Bản.
- Mỗi chặng gắn với bài học và thử thách để mở khóa địa điểm mới.

### 🏆 Gamification
- **Cấp bậc & XP:** tích lũy điểm khi hoàn thành bài tập.
- **Streak:** theo dõi và nhắc nhở duy trì thói quen học mỗi ngày.
- **Daily Missions:** nhận thưởng khi đạt mục tiêu trong ngày.
- **Achievements:** mở khóa các huy hiệu độc đáo.
- **Leaderboard:** thi đua cùng các học viên khác.

### 🤖 AI Sensei và tình huống sinh tồn
- AI Sensei giải đáp ngữ pháp, dịch thuật 24/7.
- Mô phỏng tình huống: đặt món nhà hàng, hỏi đường, mua đồ ở Konbini, làm thủ tục sân bay…

</details>

---

## 🔧 Công nghệ sử dụng

| Thành phần | Công nghệ | Chi tiết |
| :--- | :--- | :--- |
| **Framework** | Next.js 14.2.5 | App Router, Server Actions, API Route Handlers |
| **Giao diện** | React 18, Tailwind CSS | UI components tinh chỉnh, responsive đa thiết bị |
| **Đồ họa & 3D** | HTML5 Canvas, Three.js | Vẽ nét Kana/Kanji, render phòng 3D tương tác |
| **Ngôn ngữ** | TypeScript 5.5 | Type-safe toàn dự án |
| **Cơ sở dữ liệu** | PostgreSQL | Quản lý qua `DATABASE_URL` và `DIRECT_URL` (hỗ trợ Neon / Supabase / Local Postgres) |
| **ORM** | Prisma 5.18.0 | Type-safe queries, migrations, seeding idempotent |
| **Xác thực & Bảo mật** | NextAuth.js v4 + Upstash Rate Limit | Email/Password (`bcryptjs`), Google OAuth, OTP 6 số, Rate Limiting phân tán |
| **Kiểm thử** | Vitest 2.0 | Unit & regression tests cho Auth, SRS, Learning Level, Japanese Content, Quiz |
| **Validation** | Zod 3.23 | Schema validation cho form và API payloads |

---

## 📁 Cấu trúc thư mục

```plaintext
nihonquest/
├── app/                           # Next.js 14 App Router
│   ├── api/                       # REST API Route Handlers
│   │   ├── account/               # Thông tin tài khoản, cấp độ JLPT & đổi mật khẩu
│   │   ├── auth/                  # NextAuth, đăng ký, gửi OTP & đặt lại mật khẩu
│   │   ├── journey/               # Tiến độ mở khóa bản đồ Nhật Bản
│   │   ├── kana/                  # Dữ liệu & lịch sử tập viết Kana
│   │   ├── learning-path/         # Lộ trình cá nhân hóa theo cấp độ JLPT
│   │   ├── lessons/               # Bài học, kiểm tra quyền truy cập & nộp bài
│   │   ├── review/                # Thuật toán & tương tác SRS
│   │   └── ...                    # Các API khác (AI Sensei, Exams, Documents)
│   ├── app/                       # Ứng dụng chính sau khi đăng nhập
│   │   ├── grammar/               # Ngữ pháp JLPT N5 - N3
│   │   ├── journey/               # Bản đồ hành trình Nhật Bản
│   │   ├── leaderboard/           # Bảng xếp hạng (học viên & đối thủ AI mô phỏng)
│   │   ├── learn/                 # Bảng chữ cái Kana & luyện nét viết
│   │   ├── path/                  # Lộ trình học tập cá nhân hóa
│   │   ├── practice/              # Bài học & Quiz Runner theo cấp độ
│   │   ├── profile/               # Hồ sơ cá nhân & bảo mật
│   │   ├── review/                # Trung tâm ôn tập SRS
│   │   ├── sensei/                # Hội thoại AI Sensei
│   │   ├── settings/              # Cài đặt cấp độ JLPT, giao diện & âm thanh
│   │   ├── survival/              # Thực chiến tiếng Nhật (Survival)
│   │   ├── test/                  # Kiểm tra năng lực 4 kỹ năng JLPT
│   │   └── vocabulary/            # Từ điển Từ vựng & Chữ Hán (Phiên âm | Chữ Nhật | Nghĩa)
│   ├── layout.tsx                 # Root layout, Fonts & Providers
│   └── page.tsx                   # Landing page
├── components/                    # React Components tái sử dụng
│   ├── AppNav.tsx                 # Thanh điều hướng hợp nhất
│   ├── JapaneseTerm.tsx           # Hiển thị Furigana chuẩn <ruby><rt> & cấu trúc Phiên âm | Chữ Nhật | Nghĩa
│   ├── KanaCanvas.tsx             # Canvas tập viết chữ
│   ├── SoundAndThemeContext.tsx   # Âm thanh, TTS & giao diện Sáng/Tối
│   └── ui.tsx                     # Button, Card, Dialog, Badge...
├── docs/
│   └── CONTENT_PROVENANCE.md      # Chuẩn trình bày tiếng Nhật & nguồn gốc học liệu
├── lib/                           # Logic cốt lõi & pure functions
│   ├── auth-options.ts            # Cấu hình NextAuth & bảo mật phiên
│   ├── auth-secret.ts             # Kiểm tra bắt buộc NEXTAUTH_SECRET trên Production
│   ├── learning-level.ts          # Nguồn sự thật duy nhất (Single Source of Truth) cho cấp độ JLPT & phân quyền bài học
│   ├── missionDay.ts              # Quản lý ngày học theo múi giờ & hoàn thành nhiệm vụ hàng ngày
│   ├── progress-service.ts        # Đồng bộ XP, Level, Streak & Thành tựu
│   ├── rateLimit.ts               # Rate limit bộ nhớ đệm + Upstash Redis REST cho Serverless
│   ├── srs.ts                     # Thuật toán lặp lại ngắt quãng (SRS)
│   └── streak.ts                  # Quản lý chuỗi ngày học
├── prisma/
│   ├── migrations/                # Lịch sử lược đồ CSDL PostgreSQL
│   ├── schema.prisma              # Định nghĩa models & composite indexes
│   ├── seed.ts                    # Script nạp dữ liệu mẫu idempotent
│   └── seed-data/                 # Dữ liệu Kana, Từ vựng, Kanji, Ngữ pháp, Bài học (N5 - N3)
└── vitest.config.ts               # Cấu hình Unit & Regression Tests
```

---

## 💻 Yêu cầu hệ thống

| Công cụ | Phiên bản |
| :--- | :--- |
| **Node.js** | ≥ 18.17.0 (khuyến nghị **20 LTS**) |
| **PostgreSQL** | ≥ 14 (Local PostgreSQL hoặc Cloud như Neon / Supabase) |
| **Package manager** | `npm` (đi kèm Node.js) |
| **Git** | Bản mới |

Kiểm tra phiên bản:

```bash
node -v
npm -v
git --version
```

---

## ⚡ Cài đặt và khởi chạy

### Bước 1 — Clone repository

```bash
git clone https://github.com/Kzkhanhacg547/SSA-GR3-.git
cd SSA-GR3-
```

### Bước 2 — Cài đặt dependencies

```bash
npm install
```

### Bước 3 — Tạo file môi trường `.env`

<table>
<tr>
<td><b>Windows (PowerShell)</b></td>
<td><b>macOS / Linux / Git Bash</b></td>
</tr>
<tr>
<td>

```powershell
Copy-Item .env.example .env
```

</td>
<td>

```bash
cp .env.example .env
```

</td>
</tr>
</table>

> 💡 Dự án sử dụng **PostgreSQL** (`provider = "postgresql"` trong `prisma/schema.prisma`). Hãy cập nhật `DATABASE_URL` và `DIRECT_URL` trong `.env` trỏ tới PostgreSQL cục bộ hoặc Neon/Supabase trước khi chạy migration.

### Bước 4 — Đồng bộ database và seed dữ liệu

Dùng cho môi trường mới hoặc khi cần cập nhật dữ liệu mẫu. Script chạy idempotent (bảo toàn dữ liệu người dùng hiện có):

```bash
npm run setup
```

Sau khi xong, CSDL có sẵn hệ thống Kana, 434 từ vựng, 260 chữ Hán (Kanji), 99 cấu trúc ngữ pháp và các bài học từ N5 đến N3.

### Bước 5 — Chạy development server

```bash
npm run dev
```

👉 Mở trình duyệt: **http://localhost:3000**

---

## 🔑 Cấu hình biến môi trường

Xem đầy đủ các biến môi trường và hướng dẫn trong file [`.env.example`](file:///d:/Projects/nihonquest/.env.example):

```env
# 1. Cơ sở dữ liệu PostgreSQL (Bắt buộc)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nihonquest?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/nihonquest?schema=public"

# 2. Cấu hình NextAuth (Bắt buộc >= 32 ký tự trên Production)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-at-least-32-bytes-of-high-entropy-secret"

# 3. Tùy chọn: Upstash Redis cho Rate Limiting phân tán (Multi-instance / Serverless)
# UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
# UPSTASH_REDIS_REST_TOKEN="your-upstash-rest-token"
```

> 🔐 **Tạo `NEXTAUTH_SECRET` ngẫu nhiên an toàn:**
>
> ```bash
> openssl rand -base64 32
> ```

---

## 💾 Cơ sở dữ liệu và dữ liệu mẫu

**Xem và chỉnh sửa dữ liệu trực quan (Prisma Studio):**

```bash
npm run db:studio
```

Truy cập http://localhost:5555 để xem các bảng: `User`, `Lesson`, `Vocabulary`, `Kanji`, `Grammar`, `Kana`, `ReviewItem`…

**Nạp lại dữ liệu bài học và từ vựng (idempotent):**

```bash
npm run db:seed
```

---

## 📜 Danh sách lệnh scripts

| Lệnh | Công dụng |
| :--- | :--- |
| `npm run setup` | Cài đặt, generate Prisma Client, chạy `prisma migrate deploy` và seed dữ liệu mẫu |
| `npm run dev` | Chạy dev server tại cổng 3000 |
| `npm run build` | Generate Prisma Client và tạo bản build production (`next build`) |
| `npm run build:deploy` | Generate Prisma Client, chạy `prisma migrate deploy` và build production |
| `npm run start` | Chạy bản build production |
| `npm run typecheck` | Kiểm tra kiểu TypeScript (`tsc --noEmit`) |
| `npm test` | Chạy toàn bộ Unit & Regression Tests với Vitest |
| `npm run test:watch` | Chạy Unit Tests ở chế độ watch |
| `npm run lint` | Kiểm tra code với Next.js ESLint |
| `npm run db:migrate` | Tạo và áp dụng migration Prisma mới (`prisma migrate dev`) |
| `npm run db:deploy` | Áp dụng các migration đã có lên CSDL (`prisma migrate deploy`) |
| `npm run db:seed` | Nạp dữ liệu học tập vào CSDL (idempotent) |
| `npm run db:studio` | Mở Prisma Studio |

---

## ❓ Xử lý sự cố thường gặp

<details>
<summary><b>1. Prisma Client out of date / không tìm thấy Schema</b></summary>

<br>

Tạo lại Prisma Client:

```bash
npx prisma generate
```

</details>

<details>
<summary><b>2. CSDL sai lệch schema hoặc muốn reset từ đầu</b></summary>

<br>

```bash
npx prisma migrate reset
```

> ⚠️ Lệnh này **xóa toàn bộ dữ liệu người dùng** và tạo lại dữ liệu mẫu sạch.

</details>

<details>
<summary><b>3. Port 3000 đã bị chiếm dụng</b></summary>

<br>

Chạy Next.js trên cổng khác:

```bash
npm run dev -- -p 3001
```

</details>

---

## 👥 Đóng góp và bản quyền

Dự án được xây dựng và duy trì bởi nhóm **SSA-GR3-**. Mọi đóng góp (Pull Request, báo lỗi, góp ý tính năng) đều được chào đón!

1. Fork dự án
2. Tạo branch mới: `git checkout -b feature/TinhNangMoi`
3. Commit: `git commit -m "Thêm tính năng mới"`
4. Push: `git push origin feature/TinhNangMoi`
5. Tạo Pull Request

📄 Phát hành theo giấy phép **MIT License**.
