import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegistrar from "../components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "旅のしおり",
  description: "家族旅行の計画・共有アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "旅のしおり",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full bg-[var(--color-bg)]">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
