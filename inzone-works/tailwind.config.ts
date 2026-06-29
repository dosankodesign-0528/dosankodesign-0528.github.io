import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // inZONE デザインのカラートークン
        ink: "#000000", // 本文の黒
        warm: "#423f3f", // 日付・タグ・ボーダーの温かみのある濃グレー
        line: "#9f9f9f", // 枠線グレー
      },
      fontFamily: {
        // 英字・数字は Hanken Grotesk、和文は Noto Sans JP、見出し明朝は Noto Serif JP
        en: ["var(--font-hanken)", "sans-serif"],
        jp: ["var(--font-noto)", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
      },
      maxWidth: {
        content: "1170px", // PC のコンテンツ最大幅
      },
    },
  },
  plugins: [],
};

export default config;
