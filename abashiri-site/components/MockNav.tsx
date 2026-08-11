"use client";

import Link from "next/link";

type MockNavProps = {
  /** light: 白文字（写真の上） / dark: 黒文字（体験フロー） */
  theme: "light" | "dark";
  size?: "md" | "sm";
};

const ITEMS: { label: string; href?: string; anchor?: string }[] = [
  { label: "ぼーっとスポット", anchor: "#spot" },
  { label: "グルメ", anchor: "#gourmet" },
  { label: "体験", href: "/experience" },
  { label: "宿泊" },
  { label: "よくある質問" },
  { label: "お問い合わせ" },
];

export default function MockNav({ theme, size = "md" }: MockNavProps) {
  const color = theme === "light" ? "text-white" : "text-[#1e1e1e]";
  const fontSize = size === "sm" ? "text-[14px]" : "text-[16px]";
  return (
    <nav
      className={`absolute left-1/2 top-[43px] z-20 flex -translate-x-1/2 items-center gap-[42px] whitespace-nowrap font-bold leading-[1.2] ${color} ${fontSize}`}
    >
      {ITEMS.map((item) =>
        item.href ? (
          <Link
            key={item.label}
            href={item.href}
            className="transition-opacity hover:opacity-70"
          >
            {item.label}
          </Link>
        ) : (
          <a
            key={item.label}
            href={item.anchor ?? "#"}
            onClick={(e) => {
              if (!item.anchor) e.preventDefault();
            }}
            className="transition-opacity hover:opacity-70"
          >
            {item.label}
          </a>
        )
      )}
    </nav>
  );
}
