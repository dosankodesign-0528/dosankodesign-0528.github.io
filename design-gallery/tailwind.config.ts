import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-sidebar": "var(--bg-sidebar)",
        "bg-sidebar-hover": "var(--bg-sidebar-hover)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-sidebar": "var(--text-sidebar)",
        "text-sidebar-active": "var(--text-sidebar-active)",
        accent: "var(--accent)",
        border: "var(--border)",
      },
    },
  },
  plugins: [],
};

export default config;
