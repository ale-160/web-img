import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import React from "react";
import { getMetadata, viewport } from "@/config/metadata";
import { StructuredDataScript } from "@/components/ui/StructuredDataScript";
import { ClientProviders } from "@/components/providers/ClientProviders";

export { viewport };

export function generateMetadata(): Metadata {
  // 默认使用英文，更有利于海外搜索引擎收录
  return getMetadata("en");
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <StructuredDataScript />
        <ClientProviders>
          {children}
        </ClientProviders>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
