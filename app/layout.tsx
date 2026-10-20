import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";
import "./fonts.css";
import "./redesign.css";
import "./nq-ui.css"; // phải import SAU redesign.css để ghi đè
import "./yokai.css";
import { MotionEnhancer } from "@/components/MotionEnhancer";

const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nihon Quest — Learn Japanese. Explore Japan.",
  description:
    "Học tiếng Nhật cùng Nihon Quest: luyện viết Kana, ôn tập SRS, hội thoại AI và khám phá văn hóa Nhật Bản theo nhịp độ của bạn.",
  keywords: ["learn japanese", "hiragana", "katakana", "kanji", "jlpt", "spaced repetition", "nihon quest"],
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

// viewportFit: "cover" là bắt buộc để env(safe-area-inset-*) có giá trị, nếu không
// phần dưới bị home indicator của iPhone che mất.
export const viewport: Viewport = {
  themeColor: "#f8f6f1",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${sans.variable} max-w-full overflow-x-clip`}
    >
      <head>
        <script
          id="theme-initializer"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("nq_theme");var d=document.documentElement;var dark=t==="dark"||(!t&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(dark){d.classList.add("dark");d.style.colorScheme="dark";}else{d.classList.remove("dark");d.style.colorScheme="light";}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-[100dvh] font-sans selection:bg-[#d22f27] selection:text-white max-w-full overflow-x-clip"
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-[max(1rem,env(safe-area-inset-top))] focus:p-4 focus:bg-[#c82c25] focus:text-white focus:z-[100] rounded-lg"
        >
          Chuyển đến nội dung
        </a>
        <Providers>
          <main id="main" className="min-h-[100dvh] w-full max-w-full overflow-x-clip">
            {children}
            <MotionEnhancer />
          </main>
        </Providers>
      </body>
    </html>
  );
}
