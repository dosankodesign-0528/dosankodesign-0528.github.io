/*
 * 開発中（localhost）はサウンドを鳴らさないための共通スイッチ。
 * 本番（Vercel）では常に false。
 * ローカルで音も確認したい時だけ URL に ?sound を付ける（例: localhost:3096/?sound）。
 */
export function devSilent(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname === "localhost" &&
    !new URLSearchParams(window.location.search).has("sound")
  );
}
