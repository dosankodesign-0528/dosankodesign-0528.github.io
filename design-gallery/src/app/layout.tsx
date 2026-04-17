import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Design Gallery",
  description: "デザインギャラリー - 複数サイトからキュレーションしたWebデザイン集",
  manifest: "/manifest.json",
  themeColor: "#2c6db8",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  );
}
