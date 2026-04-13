import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "MKPI | ระบบบริหารจัดการการอบรมพนักงาน",
  description: "MC KPI Training System — ระบบอบรมพนักงานแบบครบวงจร Online, Offline, External พร้อม KPI Dashboard",
  keywords: ["MKPI", "training", "KPI", "อบรม", "พนักงาน", "e-learning"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={`${prompt.variable} antialiased`} style={{ fontFamily: "var(--font-prompt), sans-serif" }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
