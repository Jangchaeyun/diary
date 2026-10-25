import type { Metadata, Viewport } from "next";
import { Gowun_Batang, Noto_Sans_KR } from "next/font/google";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const sans = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "감성 다이어리",
  description: "하루를 따뜻하게 기록하고, 원할 때 AI와 함께 돌아보는 일기장",
  applicationName: "감성 다이어리",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#F3F2EF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${sans.variable} ${display.variable}`}>
      <body>
        <div className="app-bg">
          <div className="app-column">
            <Suspense fallback={<div className="page-wrap">{children}</div>}>
              <AppShell>{children}</AppShell>
            </Suspense>
          </div>
        </div>
      </body>
    </html>
  );
}
