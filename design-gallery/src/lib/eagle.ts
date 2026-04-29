/**
 * Eagle (画像収集アプリ) のローカルAPIと連携する薄いクライアント。
 *
 * Eagle API は `http://localhost:41595` で動く（Eagle起動時のみ）。
 * CORS的にはEagle側が `Access-Control-Allow-Origin: *` を返すので、
 * HTTPSサイトから localhost へのアクセスもブラウザ（Chrome/Safari）は許可する
 * （localhostは「セキュアコンテキスト」として扱われる）。
 */

const EAGLE_API_BASE = "http://localhost:41595";
const CACHE_KEY = "design-gallery:eagle-cache";
const FETCH_TIMEOUT_MS = 4000;

export interface EagleItem {
  id: string;
  name: string;
  url?: string;
  website?: string;
}

/** localStorage に保存するキャッシュ形式 */
export interface EagleCache {
  /** 正規化済みURL一覧 */
  urls: string[];
  /** 取得時刻 ISO */
  fetchedAt: string;
  /** Eagle内のアイテム数（参考表示用） */
  count: number;
}

/**
 * URL正規化。以下を吸収して「同じサイト」と判定できるようにする:
 *   - プロトコル (http/https)
 *   - 先頭 www.
 *   - 末尾スラッシュ
 *   - #fragment（URL クラスは search に含めないので search を吸収するだけでOK）
 *   - 大文字小文字
 *   - トラッキング系クエリパラメータ (utm_*, fbclid, gclid, ref, mc_cid 等)
 *   - 暗黙のインデックスファイル (/index.html, /index.php, /index.htm)
 *
 * ※ 業務的に意味のあるクエリ (?lang=ja, ?p=XX) は残す。トラッキング系だけ削る。
 *
 * ユーザー側で「Eagleに同じサイトを保存したのにギャラリーから消えない」問題に対応するための強化。
 */

/** 削除対象のクエリパラメータ（マーケティング/解析系） */
const TRACKING_PARAMS = new Set([
  // Google Analytics 系
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id",
  "utm_name", "utm_keyword", "utm_creative",
  // Facebook
  "fbclid", "fb_action_ids", "fb_action_types", "fb_ref", "fb_source",
  // Google Ads
  "gclid", "gclsrc", "dclid", "wbraid", "gbraid",
  // 一般のリファラー / アフィリエイト
  "ref", "referrer", "refsrc", "_hsenc", "_hsmi", "hsCtaTracking",
  // Mailchimp
  "mc_cid", "mc_eid",
  // ロード状態系（ページ機能と無関係）
  "reloaded",
]);

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    const host = u.host.toLowerCase().replace(/^www\./, "");

    // pathname の正規化:
    //   - 末尾スラッシュ除去
    //   - 暗黙インデックスファイル除去（"/index.html" → ""）
    let pathname = u.pathname.replace(/\/+$/, "");
    pathname = pathname.replace(/\/(index|default)\.(html?|php|asp|aspx|jsp)$/i, "");

    // クエリの正規化:
    //   - トラッキング系を除去
    //   - 残ったキーをアルファベット順にソート（順序ゆらぎ吸収）
    const params = new URLSearchParams(u.search);
    const keep: [string, string][] = [];
    for (const [k, v] of params) {
      if (!TRACKING_PARAMS.has(k.toLowerCase())) keep.push([k, v]);
    }
    keep.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    const search =
      keep.length > 0
        ? "?" +
          keep
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join("&")
        : "";

    return `${host}${pathname}${search}`.toLowerCase();
  } catch {
    // URLとして不正なら素直に文字列正規化
    return trimmed
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/#.*$/, "")
      .replace(/\/+$/, "");
  }
}

/**
 * Eagle APIから現在のライブラリURLを取得。
 * 失敗時（Eagle未起動・APIオフ・ネットエラー・タイムアウト）は null。
 */
export async function fetchEagleLibrary(): Promise<EagleCache | null> {
  if (typeof window === "undefined") return null;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${EAGLE_API_BASE}/api/item/list?limit=10000`,
      { signal: controller.signal }
    );
    window.clearTimeout(timer);

    if (!res.ok) return null;

    const json = (await res.json()) as {
      status?: string;
      data?: EagleItem[];
    };

    if (json.status !== "success" || !Array.isArray(json.data)) return null;

    const urls = new Set<string>();
    for (const item of json.data) {
      const u = item.url ?? item.website;
      if (u) {
        const n = normalizeUrl(u);
        if (n) urls.add(n);
      }
    }

    return {
      urls: Array.from(urls),
      fetchedAt: new Date().toISOString(),
      count: json.data.length,
    };
  } catch {
    window.clearTimeout(timer);
    return null;
  }
}

export function loadEagleCache(): EagleCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EagleCache;
    if (!parsed || !Array.isArray(parsed.urls)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveEagleCache(cache: EagleCache): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // quota等は無視
  }
}

export function clearEagleCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {}
}
