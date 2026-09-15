import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "개별 진도 관리 앱",
  description: "학생용 오늘의 미션 & 교사용 실시간 대시보드",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
