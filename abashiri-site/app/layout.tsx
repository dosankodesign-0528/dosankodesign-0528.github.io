import type { Metadata } from "next";
import { Zen_Kaku_Gothic_New, M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const zen = Zen_Kaku_Gothic_New({
  weight: ["500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-zen",
  display: "swap",
});

const rounded = M_PLUS_Rounded_1c({
  weight: ["100", "500", "700", "800"],
  subsets: ["latin"],
  variable: "--font-rounded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "網走観光サイト｜な〜んにもない たまらない",
  description:
    "な〜んにもない、たまらない。北海道・網走でぼーっとする旅の観光サイト。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${zen.variable} ${rounded.variable}`}>
      <body>{children}</body>
    </html>
  );
}
