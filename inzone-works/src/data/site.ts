// サイト全体で使うデータ。Figma のテキスト・構成をそのまま反映している。

export type NavItem = { label: string; href: string };

export const NAV: NavItem[] = [
  { label: "商品", href: "/products" },
  { label: "コーディネート", href: "/coordinate" },
  { label: "サービス", href: "/service" },
  { label: "お知らせ", href: "/news" },
  { label: "店舗", href: "/stores" },
  { label: "私たちについて", href: "/about" },
];

export type NewsCategory = "お知らせ" | "コラム" | "イベント" | "フェア" | "特集";

export type NewsItem = {
  date: string;
  category: NewsCategory;
  title: string;
  image: string;
};

// 左の大きい注目記事
export const NEWS_FEATURED: NewsItem = {
  date: "2026.08.01",
  category: "特集",
  title: "お知らせがタイトルがここに入ります。長いとこのようなイメージです。",
  image: "/images/news/featured.png",
};

// カテゴリのタブ（先頭がアクティブ）
export const NEWS_TABS: NewsCategory[] = ["お知らせ", "コラム", "イベント", "フェア"];

// 右側のリスト
export const NEWS_LIST: NewsItem[] = [
  {
    date: "2026.08.01",
    category: "フェア",
    title:
      "お知らせがタイトルがここに入ります。長いとこのようなイメージです。お知らせがタイトルがここに入ります。長いとこのようなイメージです。",
    image: "/images/news/item1.png",
  },
  {
    date: "2026.08.01",
    category: "フェア",
    title:
      "お知らせがタイトルがここに入ります。長いとこのようなイメージです。お知らせがタイトルがここに入ります。長いとこのようなイメージです。",
    image: "/images/news/item2.png",
  },
  {
    date: "2026.08.01",
    category: "フェア",
    title:
      "お知らせがタイトルがここに入ります。長いとこのようなイメージです。お知らせがタイトルがここに入ります。長いとこのようなイメージです。",
    image: "/images/news/item3.png",
  },
];

// Coordinate のメイン画像とサムネイル列
export const COORDINATE_HERO = "/images/coordinate/hero.png";
export const COORDINATE_THUMBS = [
  "/images/coordinate/thumb1.png",
  "/images/coordinate/thumb2.png",
  "/images/coordinate/thumb3.png",
  "/images/coordinate/thumb4.png",
  "/images/coordinate/thumb5.png",
  "/images/coordinate/thumb6.png",
  "/images/coordinate/thumb7.png",
];

export type Service = {
  titleEn: string;
  titleJp: string;
  description: string;
  image: string;
};

const SERVICE_DESC =
  "サービスの概要がこのエリアに挿入されます。サービスの概要がこのエリアに挿入されます。サービスの概要がこのエリアに挿入されます。サービスの概要がこのエリアに挿入されます。サービスの概要がこのエリアに挿入されます。";

export const SERVICES: Service[] = [
  { titleEn: "3D Interior Planning", titleJp: "3Dインテリアプランニング", description: SERVICE_DESC, image: "/images/service/s1.png" },
  { titleEn: "Furniture Repair", titleJp: "家具の修理", description: SERVICE_DESC, image: "/images/service/s2.png" },
  { titleEn: "Furniture Rental", titleJp: "家具のレンタル", description: SERVICE_DESC, image: "/images/service/s3.png" },
  { titleEn: "Trade-In", titleJp: "トレードイン", description: SERVICE_DESC, image: "/images/service/s4.png" },
  { titleEn: "Custom Furniture", titleJp: "造作家具", description: SERVICE_DESC, image: "/images/service/s5.png" },
  { titleEn: "Actus Gift Catalog", titleJp: "アクタスカタログギフト", description: SERVICE_DESC, image: "/images/service/s6.png" },
  { titleEn: "Member’s App", titleJp: "メンバーズアプリ", description: SERVICE_DESC, image: "/images/service/s7.png" },
];
