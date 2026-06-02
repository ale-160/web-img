import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import React from "react";

export const metadata: Metadata = {
  title: "web-img · 在线图片处理工具",
  description: "纯前端在线图片处理工具箱，支持图片压缩、格式转换、水印、编辑等功能",
  keywords: ["图片处理", "图片压缩", "图片水印", "格式转换", "在线工具"],
  icons: {
    // icon: "https://ale160.com/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
