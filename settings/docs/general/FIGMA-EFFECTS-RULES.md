# Figmaの「ブラー・影」を実装に正しく落とすルール（全プロダクト共通）

> 2026-08-25 制定。anyflow v2 KV で「すりガラスのアイコンが透けてしまう」事故が起きたため。
> **Figmaデザインを実装する時は毎回このファイルを確認する。**

## 🔴 一番の落とし穴：backdrop-blur（背景ブラー）は“焼き込めない”

Figmaの「すりガラス」は、たいてい **Background blur（背景ブラー）** で成り立っている。
これは**「後ろにあるものをぼかす」ライブな合成効果**であって、**要素そのものの見た目ではない**。

そのため：

- **SVG書き出し・PNG書き出し・単体レンダーには backdrop-blur は入らない**（後ろに何も無いのでぼかしようがない）。
- 書き出したデータには **半透明の塗り（例: 白30%）だけ**が残る。
- → 実装で置くと**後ろの要素が素通しで透けて見える**（＝すりガラスに見えない）。

### 対策（必須）
**backdrop-blur は必ず CSS の `backdrop-filter: blur(Npx)` でライブに掛ける。**
- 要素の**角丸に合わせてクリップ**する（`border-radius` ＋ `overflow:hidden`、または形状マスク）。
- SVG/PNG を使う場合は、その**背後に blur レイヤーを1枚敷く**（SVGは形・中身・影、CSSがブラー担当）。
- 値は**Figma実測をそのまま**使う（下記の拾い方）。

### 🔴🔴 一番ハマった真因：**祖先を「拡大縮小」すると backdrop-filter が描画されない**
Chrome/Safari は、**backdrop-filter を持つ要素の祖先に `transform` / `filter` / `perspective` / `transform-style: preserve-3d`、そして“拡大縮小”があると、背景ブラーを描画しない**（＝せっかく付けたブラーが全部無効化されて透ける）。実際 anyflow v2 KV で、ステージ全体を縮小していたせいで**全アイコンのブラーが外れて透けた**。
根拠: Chromium公式バグ [#415354762](https://issues.chromium.org/issues/415354762)「Scaling nested element with backdrop-filter within another element removes the filter」。

⚠️ **`zoom` に逃げてもダメ（ここ超重要・自分がハマった所）**。`transform: scale()` を避けて `zoom` にしても、**`zoom` も“拡大縮小”なので同じく backdrop-filter が消える**。**縮小そのものがアウト**。

**やりがちで全部アウトな例**：
- 拡縮を `transform: scale()` でやる → ❌ 中の backdrop-filter 全滅
- 拡縮を `zoom` でやる → ❌ これも全滅（scaleと同罪）
- 浮遊アニメを `transform: translateY()` でやる → ❌
- パララックスを `transform: translate()` でやる → ❌
- 3D風に箱を `rotateX/Y` する → ❌（その箱の中のガラス面が透ける）

**対策（ブラー要素の祖先を“変形も拡縮もしない”）**：
- **1:1で描く**のが大原則。ステージを丸ごと拡縮しない。画面フィットは「横幅fit・最大1倍（`zoom = min(1, 幅/設計幅)`）＋はみ出しは許容」か、**座標そのものを倍率で計算して置く**（＝拡縮ではなくレイアウトで縮める）。
- 中央寄せは flex で。浮遊は **`margin`**、パララックスは **`left`/`top`** で動かす（transform禁止）。
- ガラス（backdrop使用）の箱は**回転させない**。3D立体が要る箱は**不透明**にして backdrop を使わない。
- 検証は必ず「別要素（できれば高コントラストの縞）に重ねて後ろがボケるか」＋「拡縮/アニメを入れた実際の状態で」確認する。**1個だけブラーを0にする対照実験**が一番はっきり分かる（他が滑らかなら効いてる）。

## 影・ブラーの種類と CSS 対応（get_design_context の表記→CSS）

| Figma効果 | get_design_context表記 | CSS | 焼き込める？ |
|---|---|---|---|
| Background blur（背景ブラー＝すりガラス） | `backdrop-blur-[Npx]` | `backdrop-filter: blur(Npx)` | ❌ **ライブCSS必須** |
| Layer blur（レイヤー自体をぼかす） | `blur-[Npx]` | `filter: blur(Npx)` | ⭕（SVGにも一応入るが精度注意） |
| Drop shadow（ドロップシャドウ） | `shadow-[x_y_blur_spread_color]` | `box-shadow: x y blur spread color` | ⭕ そのまま |
| Inner shadow（インナーシャドウ/内側の光） | `shadow-[inset_x_y_blur_color]` | `box-shadow: inset x y blur color` | ⭕ そのまま |

- **ドロップ/インナーシャドウのロジックは Figma と CSS で同じ**（x, y, blur, spread, color）。ズレる時は値の拾い漏れ。
- **差が出るのは backdrop-blur だけ**、とまず疑う。

## 数値の拾い方（推測禁止・実測）

1. `get_design_context` を叩き、Tailwind表記から**そのまま数値を読む**（`backdrop-blur-[75px]`, `shadow-[45.159px_52.725px_48px_0px_rgba(0,0,0,0.2)]` など）。
2. ⚠️ **Figmaの効果はインスタンスのスケールで値が変わる**。例: 100pxの部品を140pxで使うと `backdrop-blur-[166px]` のように出る（≈1.19×size）。**使うサイズの実測値**を拾う。比例で持つなら `size × 実測比`。
3. 塗りの不透明度（`bg-[rgba(255,255,255,0.3)]`）・枠（`border`）・角丸（`rounded-[Npx]`）も同時に拾う。

## 実装チェックリスト（Figmaのガラス要素を作る時）

- [ ] 塗りの不透明度（例 白30%）
- [ ] **backdrop-filter: blur() をライブで**（角丸クリップ）← 忘れると透ける
- [ ] 枠線（border 1px 白 など）
- [ ] ドロップシャドウ（box-shadow）
- [ ] インナーシャドウ/ハイライト（box-shadow inset）
- [ ] 角丸（size比で）

## 検証（透けチェック）
- ガラス要素を**別の要素に重ねて**確認する（無地の上だと blur の有無が分からない）。後ろの文字/線がボケていれば正解、くっきり見えたら backdrop-blur 抜け。
