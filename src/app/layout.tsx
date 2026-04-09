import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "EV7 Driver Onboarding | ระบบอบรมคนขับ EV7",
  description: "ระบบอบรมและทดสอบคนขับแท็กซี่ EV7 - สมัครขับ Taxi กับ EV7 รายได้ดี เริ่มได้ทันที",
  keywords: ["EV7", "taxi", "driver", "onboarding", "training", "อบรม", "คนขับ", "แท็กซี่"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
