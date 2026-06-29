import type { Metadata } from "next";
import { Hanken_Grotesk, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400"],
  variable: "--font-hanken",
  display: "swap",
});

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["100", "300", "400"],
  variable: "--font-noto",
  display: "swap",
});

const notoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "inZONE with ACTUS｜札幌の家具・インテリアショップ",
  description:
    "札幌の家具・インテリアショップ inZONE with ACTUS。コーディネート提案から3Dインテリアプランニング、家具の修理・レンタルまで。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${hanken.variable} ${noto.variable} ${notoSerif.variable}`}
    >
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
