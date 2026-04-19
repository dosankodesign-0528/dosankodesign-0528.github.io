/** 引用元サイト */
export type SourceSite = "sankou" | "81web" | "muuuuu" | "webdesignclip";

export const SOURCE_LABELS: Record<SourceSite, string> = {
  sankou: "SANKOU!",
  "81web": "81-web.com",
  muuuuu: "MUUUUU.ORG",
  webdesignclip: "Web Design Clip",
};

export const SOURCE_COLORS: Record<SourceSite, string> = {
  sankou: "#E85D75",
  "81web": "#4A90D9",
  muuuuu: "#2ECC71",
  webdesignclip: "#9B59B6",
};

/** カテゴリ（業種） */
export type Category =
  | "corporate"
  | "branding"
  | "ec"
  | "media"
  | "service"
  | "portfolio"
  | "government"
  | "education"
  | "medical"
  | "food"
  | "fashion"
  | "technology"
  | "real-estate"
  | "entertainment"
  | "finance"
  | "travel";

export const CATEGORY_LABELS: Record<Category, string> = {
  corporate: "コーポレート",
  branding: "ブランディング",
  ec: "EC・通販",
  media: "メディア",
  service: "サービス",
  portfolio: "ポートフォリオ",
  government: "官公庁・自治体",
  education: "教育",
  medical: "医療・ヘルスケア",
  food: "飲食・フード",
  fashion: "ファッション",
  technology: "テクノロジー",
  "real-estate": "不動産",
  entertainment: "エンターテイメント",
  finance: "金融",
  travel: "旅行・観光",
};

/** デザインテイスト */
export type DesignTaste =
  | "minimal"
  | "stylish"
  | "pop"
  | "elegant"
  | "natural"
  | "dynamic"
  | "illustration"
  | "photo";

export const TASTE_LABELS: Record<DesignTaste, string> = {
  minimal: "ミニマル",
  stylish: "スタイリッシュ",
  pop: "ポップ",
  elegant: "エレガント",
  natural: "ナチュラル",
  dynamic: "ダイナミック",
  illustration: "イラスト",
  photo: "写真メイン",
};

/** メインのサイトデータ */
export interface SiteEntry {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: SourceSite;
  category: Category[];
  taste: DesignTaste[];
  agency?: string;
  color?: string;
  date: string; // YYYY-MM 形式
  starred: boolean;
  isAgency?: boolean;
  firstSeen?: string; // ISO datetime, 初めて取得した時刻
}

/** ソート順 */
export type SortOrder = "newest" | "oldest";

/** 表示モード（リマインダー的） */
export type ViewMode = "unchecked" | "all";

/** フィルター状態 */
export interface FilterState {
  search: string;
  sources: SourceSite[];
  categories: Category[];
  tastes: DesignTaste[];
  agencyOnly: boolean;
  dateRange: [string, string]; // [from, to] YYYY-MM
  starredOnly: boolean;
  sortOrder: SortOrder;
  viewMode: ViewMode;
}
