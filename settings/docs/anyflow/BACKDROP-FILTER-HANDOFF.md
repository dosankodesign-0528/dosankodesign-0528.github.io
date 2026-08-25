# anyflow v2 KV — すりガラス(backdrop-filter)問題 引き継ぎ書

> 2026-08-25 作成。**別アカウントのClaude／別セッションが続きを引き継ぐための自己完結ドキュメント。**
> これ1枚 ＋ [general/FIGMA-EFFECTS-RULES.md](../general/FIGMA-EFFECTS-RULES.md) を読めば状況が分かるようにしてある。

---

## 0. 一言でいう現状

Figmaカンプの「すりガラス（frosted glass）のアイコン＋モック」を**コードで忠実再現**する作業。
`backdrop-filter` が「効かない／のっぺりする」問題に何度もぶつかり、**原因は複数**あった。
主要因は解決済み（Chromeで検証済み）。**残る懸念は Safari と、無地背景での見え方**。

---

## 1. 対象・場所・デプロイ

| 項目 | 値 |
|---|---|
| 作業ディレクトリ | `anyflow/v2/kv/` |
| エンジン(JS) | `patterns.js`（`window.KVP`。パターン生成の本体。ここを主に触る） |
| スタイル | `patterns.css` |
| 埋め込みページ | `embed.html`（グラフィック＋調整パネルのみ。本体サイトへ iframe 埋込用） |
| 単体確認ページ | `index.html`（`/kv/`。案A〜H切替の比較ページ） |
| 本体サイト | `anyflow/v2/index.html`（`.orbit`＝旧惑星を隠し、`kv/embed.html` を iframe 埋込） |
| マスク画像 | `assets/masks/*.svg`（ガラス形状の不透明シルエット。後述） |
| ローカル確認 | `cd anyflow/v2 && python3 -m http.server 8774` → `http://localhost:8774/kv/embed.html` |
| 本番 | https://anyflow-embed-v2.vercel.app/ （本体） / …/kv/ （比較ページ） |
| デプロイ | `cd anyflow/v2 && npx vercel --prod --yes`（⚠️ `.vercel/project.json` が **anyflow-embed-v2** か必ず確認。`anyflow/v1` は公開中の別物・触らない） |
| キャッシュ | `embed.html`/`index.html` の `patterns.css?v=NN` `patterns.js?v=NN` を毎回上げる |

**採用案 = H（`p6`）**：Figma忠実版。中央=CSSモック、周囲=CSSアイコン、背面=軌道(SVG楕円)＋周回ドット。
`setPattern('p6')` → `buildSvgScene()` が組む。各アイコンは `buildIcon(id,'glass',size)`、グリフ部品は `ICON_DEFS[id]`。

---

## 2. すりガラスが「効かない／のっぺり」した**原因は複数**（全部実際に踏んだ）

### 原因① Figma書き出しSVGの背景ブラーは死ぬ
Figmaは背景ブラーを `<foreignObject><div style="backdrop-filter:blur()">` として書き出す。
- `<img src>` で読むと **完全に無効**（img内SVGはページ背景を合成しない）。残るのは半透明の塗り＋影だけ→透ける。
- インラインSVG(`innerHTML`)でも **Safariで不安定**＋複数インスタンスで **clip-path の id 衝突**。
- → **結論：ガラスはSVGでやらない。CSSで作る。**（アイコン・モック・グリフ全部CSS再現に移行済み）

### 原因②（最重要）入れ子の backdrop-filter は描画されない
**backdrop-filter を持つ要素の中(子孫)にある backdrop-filter は描画されない**（Chromium #993644。Chrome/Safari共通）。
- 最初 `.kvp-ico-face`（箱のガラス＝backdrop-filter）の**中**にグリフを置いていた → グリフのガラスが全部のっぺり。
- → **対策：箱のブラーを "面" から外し、別レイヤー `.kvp-ico-frost` に載せてグリフの"兄弟(背面)"にした。**
  これでグリフのガラス部品が入れ子でなくなり、backdrop-filter が生きる（Chromeで検証済み）。
  実装: `patterns.js buildIcon()` が `face > [frost, glyph]` を作る。CSS `.kvp-ico--glass .kvp-ico-frost` にブラー。

### 原因③ 変形した祖先の中でも描画されない
祖先に `transform` / `filter` / `perspective` / `transform-style: preserve-3d` があると子の backdrop-filter が消える。
- `.kvp-ico-face` に `transform: translateZ(1px)` があった → グリフのガラスを壊す一因。
  → `.kvp-ico--rebuilt .kvp-ico-face { transform:none }` ＋ `.kvp-ico--rebuilt .kvp-ico-box { transform-style:flat }` で解除。
- 浮遊アニメは `transform` でなく **margin**、パララックスは **left/top**（transformを祖先に残さない）。
- モックは `transform:scale` を "ガラス要素自身" に掛けない。**縮小しない枠 `.kvp-emock-slot` にガラス**を載せ、中身`.kvp-emock`だけ scale。

### 原因④ ステージの拡大縮小
- `transform: scale()` でステージ全体を縮小すると中の backdrop-filter が消える（環境依存・Chromium #415354762）。
- ⚠️ **`zoom` は実測で安全**（縮小しても backdrop-filter が効いたまま。zoom=0.7で対照実験済み）。`fit()` は `zoom` を使用。

### 原因⑤（未解決の本丸）無地の上ではブラーは"見えない"
すりガラスは「後ろにある物をボカして写す」だけ。**背景が単色だとガラスも単色＝のっぺり**（バグではない・物理）。
- Figmaカンプも無地なので、無地だと元々subtle。
- 一度「背後に淡い発光」を敷いて可視化したが **ユーザーが発光は不要と却下 → 撤去**。
- **今ここが論点**：発光なしで、無地でも"ガラスらしく"見せるには？
  - 見えている効果＝**グリフのガラスが"前の青ソリッド"をボカす**（発光なしでも見える。これは効いてる）
  - 箱のブラーは、アイコンが mock/軌道に**重なる所**でしか見えない
  - 案：軌道を少し濃く／ドットを増やす／構図でアイコンをmockに重ねる／ガラス自身のグラデ・ふちの光を強める 等

---

## 3. いま効いていること / 効いていないこと（2026-08-25時点）

| 対象 | 状態 | 検証 |
|---|---|---|
| アイコンの箱のブラー | ✅ 効く（別レイヤーfrost） | 縞テストでグレーにボケる |
| グリフのガラス（吹き出し裏バブル/雲/人＝**マスク方式**） | ✅ Chromeで効く / ⚠️ **Safari未確認**（mask+backdrop-filterはSafariで不安定な可能性） | blur=22に上げると前バブルが明確にボケた |
| グリフのガラス（chart棒/calendar本体＝**CSS矩形・マスク無し**） | ✅ 効くはず（矩形なのでSafariも箱と同様安全） | 未フォーカス検証 |
| モックのブラー | ✅ 効く（`.kvp-emock-slot`） | 縞テストでグレーにボケる |
| 無地背景での箱ブラーの"見え" | ❌ 見えない（原因⑤・物理） | 無地では判別不能 |

---

## 4. 検証のしかた（⚠️ ここを飛ばすと「直った」と誤認する）

**無地の上では効いていても見えない。必ず"ボカす対象"を置いて確かめる。**

1. **縞テスト**：対象の背後に高コントラストの縞を敷く → 縞がグレー/滑らかにボケたら効いてる。
   ```js
   var st=document.createElement('div');
   st.style.cssText='position:absolute;left:520px;top:80px;width:960px;height:760px;z-index:0;'
     +'background:repeating-linear-gradient(45deg,#111 0 6px,#fff 6px 12px)';
   document.querySelector('#kvp .kvp-e-back').prepend(st);
   ```
2. **blur=0 対照**：1つだけ backdrop-filter を `blur(0)` にする → そこだけ縞がくっきり戻り、他が滑らか＝他は効いてる。
3. **暗背景で抜き出す**：ガラス部品を暗背景に置くと、効いてればグレーになる（＝暗を写してる）。
4. Safari は必ず**実機**で（レスポンシブモードは backdrop-filter を正しく出さない）。`-webkit-backdrop-filter` 併記必須。

---

## 5. 次の一手（未解決＝ここから）

### A. Safari で masked glyph が効くか確定する（最優先）
- 実機Safariで、吹き出しの裏バブル等（`ICON_DEFS` の `{glass:'...svg'}` 部品）がボケるか。
- 効かない場合の代替（信頼度順）：
  1. `mask` → **`clip-path: url(#id)`（インラインSVG clipPath・id一意）** に変更（Safariでbackdrop-filterと相性が良いことが多い）。
  2. 形を **角丸矩形など単純形で近似**（矩形のbackdrop-filterは箱同様Safariでも安全）。
  3. **グリフのフロストを画像に焼く**（Canvasで前バブルをぼかして合成 or Figma PNG書き出し）。glyph内フロストは"アイコン内部だけ"で完結するので焼ける（箱のブラーはライブのまま）。

### B. 無地でも"ガラスらしさ"を出す（発光なしで）
- 軌道/ドットを少し濃く（ガラスがボカす対象になる）／アイコンをmockに一部重ねる構図。
- ガラス自身の質感を強める：シアンのグラデ・ふちの光(border/inner-shadow)を少し強く。

### C. 未着手の依頼（キュー）
- **アイソメの厚み**：普通ビュー=すりガラス／アイソメ=不透明白スラブ＋厚み。実装手段の比較（①積層スラブ ②明示的な面 ③多重box-shadow）＋厚み/光源の調整パネル。
  ※3D transformはガラスと両立しないので「アイソメ時は不透明」に割り切る方針で合意済み。
- **カレンダー白が薄い**件（全アイコン同一0.3。グリフ密度差の可能性→要確認）。

---

## 6. 触るとき注意
- CSS/JSを範囲でまとめて置換しない（同セクション内でマーカーを取る）。
- `patterns.js` は現状 ~600行超。大改修時は分割も検討。
- デプロイ前に `cat .vercel/project.json` = anyflow-embed-v2 を確認。git author = dosanko.design@gmail.com。
- 関連メモリ: `feedback_figma_backdrop_blur`。関連ルール: general/FIGMA-EFFECTS-RULES.md（本ファイルと対で更新）。
