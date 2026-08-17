"use client";

import Link from "next/link";

type GlobalNavProps = {
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

export default function GlobalNav({ theme, size = "md" }: GlobalNavProps) {
  const color = theme === "light" ? "text-white" : "text-ink";
  const fontSize = size === "sm" ? "text-control-14" : "text-body-16";
  return (
    <nav
      /* v1.1 カンプ 15071:24709: top 32px / gap 42px / Noto Sans JP Light 300 / 16px / 行間 1.2 */
      className={`absolute left-1/2 top-[32px] z-20 flex -translate-x-1/2 items-center gap-[42px] whitespace-nowrap font-light leading-[1.2] ${color} ${fontSize}`}
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
