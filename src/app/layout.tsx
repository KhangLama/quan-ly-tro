import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quản Lý Nhà Trọ",
  description: "Web App Quản Lý Nhà Trọ — Đơn giản, nhanh chóng trên mobile",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quản Lý Nhà Trọ",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0284c7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="UTF-8" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
