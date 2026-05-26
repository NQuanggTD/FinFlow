import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "FinFlow – Quản lý Tài chính Cá nhân",
  description: "Nền tảng quản lý tài chính thông minh với AI tích hợp",
  keywords: ["tài chính", "quản lý chi tiêu", "tiết kiệm", "ngân sách"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Anti-flash: apply dark class before first paint */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{const t=localStorage.getItem('finflow-theme');const d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||((!t||t==='system')&&d))document.documentElement.classList.add('dark')}catch(_){}`}
        </Script>
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
