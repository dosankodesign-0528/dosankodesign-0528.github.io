/* アイコン刷新の比較用データ（モック専用。本番からは読み込まれない）
 *
 * 現状は全アイコンが「文字（記号・絵文字）」で描かれている。
 *   ⚙ ◧ ▤ 🔗 ↻ ▶ ✎ ⋯ ＋ ‹ ›
 * これが視認性の問題の根っこ：
 *   - フォント依存でOS/ブラウザごとに形が変わる（絵文字はカラーで浮く）
 *   - 24pxグリッドに乗らないのでピクセルがボケる
 *   - 線の太さを揃えられない（⚙は細い／▤は真っ黒）
 *   - ベースライン基準なので上下がズレる
 *   - ◧ と ▤ が似ていて区別がつかない
 *
 * 3案はすべて 24×24 のグリッドで作り直し、意味（メタファー）は3案共通。
 * 違うのは「描き方（線／塗り／太線）」だけなので、純粋に見え方だけ比較できる。
 */

// ---- 現状（文字で描いているもの）----
const CURRENT = {
  settings: '⚙', panelLeft: '◧', notes: '▤', link: '🔗', refresh: '↻',
  play: '▶', prev: '‹', next: '›', edit: '✎', more: '⋯', plus: '＋',
};

const LABELS = {
  settings: '設定',
  panelLeft: 'スライド一覧の開閉',
  notes: 'トークスクリプトの開閉',
  link: 'URL',
  refresh: '再取得',
  play: 'プレゼンを開始',
  prev: '前へ',
  next: '次へ',
  edit: '編集',
  more: 'メニュー',
  plus: '新規',
};
const ORDER = ['settings', 'panelLeft', 'notes', 'link', 'refresh', 'play', 'prev', 'next', 'edit', 'more', 'plus'];

/* 共通の骨格（3案で位置・比率は同じ。線の太さと塗り方だけ変える）
 *  パネル枠 : x3,y4.5 → x21,y19.5 / 角丸2.5
 *  一覧の開閉 = 枠 + 「左」の柱を塗る
 *  原稿の開閉 = 枠 + 「下」の帯を塗る + 上に本文の線
 *  → 塗る位置が左と下で真逆になるので、小さくてもシルエットで区別できる
 */
const FRAME = 'M5.5 4.5h13A2.5 2.5 0 0 1 21 7v10a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17V7a2.5 2.5 0 0 1 2.5-2.5z';
const BAND_LEFT = 'M5.5 4.5H9.5v15H5.5A2.5 2.5 0 0 1 3 17V7a2.5 2.5 0 0 1 2.5-2.5z';
const BAND_BOTTOM = 'M3 14h18v3a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17v-3z';
const PENCIL = 'M4 20h4.2L19 9.2a2.97 2.97 0 0 0-4.2-4.2L4 15.8V20z';
// 塗り用：芯（先端の三角）と軸を1.6px分あけて描く。棒に見えるのを防ぐ
const PENCIL_NIB = 'M4 20 5.35 15.69 8.31 18.65Z';
const PENCIL_BODY = 'M7.05 13.99 10.01 16.95 19.62 7.34A2.1 2.1 0 0 0 16.66 4.38Z';
const CHAIN_A = 'M10.5 13.5a4.2 4.2 0 0 0 6.02 0l2.6-2.6a4.25 4.25 0 0 0-6.01-6.01l-1.5 1.49';
const CHAIN_B = 'M13.5 10.5a4.2 4.2 0 0 0-6.02 0l-2.6 2.6a4.25 4.25 0 0 0 6.01 6.01l1.49-1.49';
const ARC = 'M21 12a9 9 0 1 1-2.64-6.36';
const PLAY_TRI = 'M8.5 5.4v13.2L19 12z';

// ============ 案A：ライン（線 1.75px・角丸） ============
// 細身で上品。今のダークUI（細い罫線・小さめの文字）と一番なじむ。
const SET_A = {
  key: 'A', name: 'ライン',
  tagline: '線 1.75px / 角丸。細身で上品。今のUIに一番なじむ',
  uiSize: 20,
  wrap: (inner) => `<g fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`,
  defs: {
    settings: '<path d="M4 8h9.6"/><path d="M18.4 8H20"/><circle cx="16" cy="8" r="2.4"/><path d="M4 16h3.6"/><path d="M12.4 16H20"/><circle cx="10" cy="16" r="2.4"/>',
    panelLeft: `<path d="${FRAME}"/><path d="${BAND_LEFT}" fill="currentColor" stroke="none"/>`,
    notes: `<path d="${FRAME}"/><path d="M6.8 8h10.4"/><path d="M6.8 11h6.6"/><path d="${BAND_BOTTOM}" fill="currentColor" stroke="none"/>`,
    link: `<path d="${CHAIN_A}"/><path d="${CHAIN_B}"/>`,
    refresh: `<path d="${ARC}"/><polyline points="21 3 21 9 15 9"/>`,
    play: `<path d="${PLAY_TRI}"/>`,
    prev: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    next: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
    edit: `<path d="${PENCIL}"/><path d="M13.9 6.1l4.2 4.2"/>`,
    more: '<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  },
};

// ============ 案B：ソリッド（面で見せる・2階調） ============
// 面で描くので小さくしても絶対に潰れない。区別の付きやすさは3案で最強。
const SET_B = {
  key: 'B', name: 'ソリッド',
  tagline: '面＋2階調。小さくても潰れない。区別の付きやすさは最強',
  uiSize: 20,
  wrap: (inner) => `<g fill="currentColor" stroke="none">${inner}</g>`,
  defs: {
    settings: '<rect x="3.2" y="6.8" width="10.4" height="2.4" rx="1.2" opacity=".5"/><rect x="17.6" y="6.8" width="3.2" height="2.4" rx="1.2" opacity=".5"/><circle cx="16" cy="8" r="3"/><rect x="3.2" y="14.8" width="4.4" height="2.4" rx="1.2" opacity=".5"/><rect x="11.6" y="14.8" width="9.2" height="2.4" rx="1.2" opacity=".5"/><circle cx="10" cy="16" r="3"/>',
    panelLeft: `<path d="${FRAME}" opacity=".32"/><path d="${BAND_LEFT}"/>`,
    notes: `<path d="${FRAME}" opacity=".32"/><rect x="6.8" y="7.1" width="10.4" height="1.8" rx=".9"/><rect x="6.8" y="10.1" width="6.6" height="1.8" rx=".9"/><path d="${BAND_BOTTOM}"/>`,
    link: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="${CHAIN_A}"/><path d="${CHAIN_B}"/></g>`,
    refresh: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="${ARC}"/></g><path d="M21 2.2 21.9 9.9 14.2 9z"/>`,
    play: `<path d="${PLAY_TRI}"/>`,
    prev: '<g fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5 8 12l6.5 6.5"/></g>',
    next: '<g fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 5.5 16 12l-6.5 6.5"/></g>',
    edit: `<path d="${PENCIL_NIB}"/><path d="${PENCIL_BODY}"/>`,
    more: '<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>',
    plus: '<rect x="10.7" y="4.5" width="2.6" height="15" rx="1.3"/><rect x="4.5" y="10.7" width="15" height="2.6" rx="1.3"/>',
  },
};

// ============ 案C：ボールド（太線 2.5px・丸端） ============
// 太いので暗い部屋・小さいウィンドウ・遠目でも読める。発表中の操作向き。
const SET_C = {
  key: 'C', name: 'ボールド',
  tagline: '線 2.5px / 丸端。暗い部屋や遠目でも読める。発表中の操作向き',
  uiSize: 21,
  wrap: (inner) => `<g fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`,
  defs: {
    settings: '<path d="M4.2 8h9"/><path d="M19 8h.8"/><circle cx="16" cy="8" r="2.6"/><path d="M4.2 16h3"/><path d="M13 16h6.8"/><circle cx="10" cy="16" r="2.6"/>',
    panelLeft: `<path d="${FRAME}"/><path d="${BAND_LEFT}" fill="currentColor" stroke="none"/>`,
    notes: `<path d="${FRAME}"/><path d="M7.2 8.4h9.6"/><path d="M7.2 11.4h5.4"/><path d="${BAND_BOTTOM}" fill="currentColor" stroke="none"/>`,
    link: `<path d="${CHAIN_A}"/><path d="${CHAIN_B}"/>`,
    refresh: `<path d="${ARC}"/><polyline points="21 3.4 21 9 15.4 9"/>`,
    play: `<path d="${PLAY_TRI}"/>`,
    prev: '<path d="M14.5 5.8 8.4 12l6.1 6.2"/>',
    next: '<path d="M9.5 5.8 15.6 12l-6.1 6.2"/>',
    edit: `<path d="${PENCIL}"/><path d="M13.9 6.1l4.2 4.2"/>`,
    more: '<circle cx="5" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.8" fill="currentColor" stroke="none"/>',
    plus: '<path d="M12 5.2v13.6"/><path d="M5.2 12h13.6"/>',
  },
};

const SETS = { A: SET_A, B: SET_B, C: SET_C };

/** アイコン1個をSVG文字列で返す */
function icon(setKey, name, size) {
  const s = SETS[setKey];
  const body = s.defs[name];
  if (!body) return '';
  const px = size || s.uiSize;
  return '<svg class="ic" width="' + px + '" height="' + px + '" viewBox="0 0 24 24" aria-hidden="true">'
    + s.wrap(body) + '</svg>';
}
/** 現状（文字）を同じ枠で返す */
function currentIcon(name, size) {
  const px = size || 20;
  return '<span class="ic-cur" style="font-size:' + px + 'px;width:' + px + 'px;height:' + px + 'px">' + CURRENT[name] + '</span>';
}
