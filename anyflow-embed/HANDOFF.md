# anyflow-embed 構築引き継ぎドキュメント

別の Claude アカウント／セッションでこの構築の続きを行うためのドキュメント。
これを読めば、現状の実装内容・設計判断・作業の続け方が再現できる。

最終更新: 2026-08-13

---

## 1. プロジェクト概要

- **内容**: Anyflow Embed のトップページ（キービジュアル）。Figma カンプの忠実再現＋アニメーション実装
- **本番 URL**: https://anyflow-embed.vercel.app
- **場所**: 親リポ `hideyuki-yamanaka.github.io` の `anyflow-embed/` サブディレクトリ（submodule ではない）
- **構成**: `index.html` 単一ファイル（フレームワーク・ビルドなし）+ `assets/`
- **デプロイ**: 手動。`anyflow-embed/` ディレクトリで `npx vercel --prod --yes`
  （Vercel プロジェクト名: `anyflow-embed`。git push では自動デプロイされない）
- **ブランチ運用**: main 一本。feature branch 禁止（親リポの CLAUDE.md 参照）
- **ローカル確認**: `.claude/launch.json` の `anyflow-embed`（port 8773 の python http.server）

## 2. Figma ソース

ファイルキー: `jSLFEubHMoy3Hxgcw1AZuR`（works）

| ノード | 内容 |
|---|---|
| `14286:15414` | TOP カンプ本体（レイアウト・軌道・ドット座標の出典） |
| `14329:12869` | 惑星デザイン違い 3 案のセクション（B/C/D の出典） |
| `14329:13846` | 惑星 E（ハーフトーン）＋軌道形状違いのセクション |
| `14329:12780` / `12868` / `12692` | 惑星 B / C / D の Vector ノード |
| `14329:13580` | 惑星 E の Vector ノード |

- 惑星テクスチャは **defaultScale 4 で PNG 書き出し**したもの（`assets/planet-b〜e.png`、約950px）
- Figma MCP の asset URL は約7日で失効するので、再取得時は `download_assets` を使う

## 3. レイアウトの数値（カンプ準拠）

- ステージ: **1440×921 固定**を `transform: scale()` で画面幅にフィット（`fit()`）
- 見出し: left 109px / top 210px、Noto Sans JP Thin、50px / 80px / 80px
- 軌道グループ: left 496px / top 179px、915.483×630
- 楕円（`ELLIPSES`）: outer = cx457.741, cy306.543, rx435.517, ry146.026 ／ inner = cx475.283, cy350.505, rx397.09, ry133.142、基本回転 `ROTDEG = -23.3266°`
- 軌道線: stroke 3px の線形グラデ（outer: ピンク→白→水色 / inner: 水色→白→ピンク、`userSpaceOnUse` で cy±ry）
- ドット6個: r=5.606。所属楕円と初期角度は `DOTS` 配列（カンプ座標から楕円式で逆算済み）
- 惑星: 230×230、ステージ座標 left 817 / top 306（canvas は余白込み 260×260）
- ロゴ: `logos-strip.png` を2枚並べた CSS マーキー（top 796）

## 4. アーキテクチャ

### 4.1 奥行き（前後）の仕組み

軌道は **奥レイヤー SVG → 惑星 canvas → 手前レイヤー SVG** の3層。

- 奥 SVG: 楕円の全周＋「奥側を通行中のドット」
- 手前 SVG: 楕円の手前半分（clipPath で下半分を切り出し）＋「手前側のドット」
- ドットはパラメトリック角度の `sin(t) > 0` が手前。`renderFrame()` で毎フレーム表示レイヤーを切替
- これで奥を通る線・ドットは惑星の裏に隠れる（カンプの重なりと一致）

軌道のジオメトリはパネル設定を反映して毎フレーム `orbitGeom()` → `updateOrbitSvg()` で
SVG属性（cx/cy/rx/ry/transform、クリップ矩形、グラデ座標）を再計算する。
ドット位置も同じジオメトリから計算するので、軌道をいじってもズレない。

### 4.2 惑星（WebGL）

- 素の WebGL（ライブラリなし）。フルスクリーントライアングル＋フラグメントシェーダー
- **惑星ごとに別プログラムをコンパイル**（`DESIGNS` の各エントリ）
- B/C/D: カンプ画像をテクスチャとして球面に貼る方式
  - `uv = (0.5 + d.x*0.47, 0.5 - d.y*0.47)`（d = 回転後の法線）
  - 無回転時はカンプがピクセル一致で表示される。裏側はカンプに無いので鏡映で生成
  - デザイン別の `finish`（GLSL片）で粒・ハイライト・リムを仕上げ（B: 乗算粗粒 / C: 境界中粒 / D: 高密度微粒）
- E（ハーフトーンブルー）: **完全生成**（`fragment` に独自シェーダー全体を持つ。テクスチャ不使用＝継ぎ目なし）
  - 明るさの場 `lum` → 6段階量子化 ＋ ベイヤーディザ（2px セル）でピクセル調
  - カラーランプ: マゼンタ⇄紫⇄深青⇄青⇄シアン⇄白（`ramp()`、負の値で紫帯）
  - ディザ演出（`uDither`）: ①固定 ②うつろい ③流れ ④さざ波 — **色の場を波で動かして**境目のピクセルがパラパラめくれる方式（しきい値だけ動かす方式はNGだった経緯あり）
- 回転: 軌道の傾きとはずらした2軸合成（`ax1`, `ax2`、`uAngle`/`uAngle2`）。上下の位置揺れはなし
- ライト（`uLight`）: ①なし ②右上光源。②は右上からの平行光＋影は**青みに沈める**（グレー化させない）。ハイライトは白飛びさせない
- WebGL 不可時: canvas 背景にカンプ PNG を表示するフォールバック

### 4.3 アニメーションクロック

- `elapsed`（秒）が唯一の時間源。`requestAnimationFrame` で加算、`params.running=false` で停止
- すべての動き（ドット周回・自転・ディザ・ゆらぎ・軌道ゆれ）が `elapsed` から計算される＝一時停止で全部止まる
- ドット角度: `patternDeg()` = 緩急ゆらぎ（サイン波の速度変調 `warpTime`）＋遅延・ランプ・個別スピード
- **デバッグ用フック** `window.__anim`: `setElapsed(t)` / `step(dt)` / `setSway(n)` / `setDesign(k)` / `setDither(n)` / `setLight(n)` / `getState()`
  - ⚠️ Claude の Browser プレビューペインでは rAF が発火しない。検証は `setElapsed()` で時間を進めてスクショ比較する

### 4.4 パラメーター

- `DEFAULTS` がすべての初期値。ユーザー操作は `localStorage`（キー `anyflow-embed-anim-v4`）に保存
- `load()` はデフォルトと deep-merge ＋ 削除済み選択肢のバリデーション
- 構造: `sway / design / dither / light / duration / globalSpeed / direction / ramp / pulse{amp,period} / sphere{duration,tumble,noise} / planet{dx,dy,scale} / orbits{outer,inner}{scale,angle,dx,dy,wobbleAmp,wobblePeriod,wobblePhase} / marquee{duration,direction} / dots[6]{speed,delay,offset,pulsePhase}`
- **軌道のゆれ位相は outer=0 / inner=180 がデフォルト** → 両方のゆれ幅を上げるだけで2本がクロスする

### 4.5 UI（2つのフローティングパネル）

1. **🎛 パターン切替スイッチャー**（初期位置 左下）
   - ヘッダーをドラッグで移動、右下つまみでリサイズ（CSS `resize: both`）、▲で全体開閉
   - アコーディオン式セクション: ゆらぎ（固定/シーソー/クロス）・惑星（B/C/D/E）・ライト（なし/右上光源）・ディザ（E選択時のみ表示: 固定/うつろい/流れ/さざ波）
   - 閉じたセクションは右側に現在の選択名を表示
   - **「📋 いまの設定をコピー」ボタン**: 現在の `params` を JSON でクリップボードへ。
     これを Claude に貼れば `DEFAULTS` に焼き込んで「全訪問者のデフォルト」にできる（デフォルト化ワークフロー）
2. **⚙️ アニメーション調整パネル**（右下）
   - 大カテゴリのアコーディオン: 🪐惑星（自転/位置・サイズ）・🛰軌道（外側/内側 個別）・⚪ドット（全体/緩急/各ドット）・🎞ロゴカルーセル
   - 下部に 一時停止 / 最初から / 初期値に戻す

## 5. 削除済み機能（git 履歴から復元可能）

ユーザー指示で 2026-08-13 に削減。必要なら該当コミットから復元する。

| 機能 | あったもの | 参考コミット |
|---|---|---|
| アニメ（ドット周回）5パターン | スタンダード/コメット/ドリフト/すれ違い/リズム | `4924d48` |
| ゆらぎ 11種 | ふわふわ/うねり/ジェリー/惑星ゆらり/逆位相/漂流/呼吸/波乗り など | `4924d48` `604f227` |
| 惑星A やわらかパステル | テクスチャ＋専用finish（assets/planet-a.png も削除） | `d4d92ee` |
| ディザ ⑤ざわめき | セル単位のチラつき | `e09a701` |
| グロウ系 ⑥波/⑦漂い/⑧鼓動 | ドットマトリクス表現（参考GIF再現→ブランド色化） | `633877e` `6f772f0` |

## 6. 作業の続け方（次の Claude への指示例）

1. 修正 → `index.html` を直接編集（単一ファイル）
2. ローカル確認 → launch.json の `anyflow-embed`（port 8773）。アニメ検証は `__anim.setElapsed()` を使う
3. コミット → main に直接。author email が `dosanko.design@gmail.com` であることを確認
4. `git push origin main`
5. **本番反映** → `cd anyflow-embed && npx vercel --prod --yes`（push だけでは反映されない）
6. `curl -sI https://anyflow-embed.vercel.app` で 200 を確認

### デフォルト化の手順（ユーザーから設定JSONが貼られたら）

スイッチャーの「設定をコピー」で得た JSON が貼られたら、その値を `index.html` の
`DEFAULTS`（および `DOTS` 初期角度はそのまま）へ反映し、`STORAGE_KEY` のバージョンを
上げて（v4→v5）全ユーザーに新デフォルトが効くようにする。

## 7. 既知の注意点

- Claude の Browser プレビューでは rAF が止まる（実ブラウザでは動く）。過去に何度も混乱したので注意
- Figma の惑星画像を差し替える時は 4倍スケールで書き出し、`DESIGNS[].src` を更新
- E のディザは「色の場を動かす」実装。しきい値やパターンだけ動かすとユーザーNG（表層的に見える）
- ライト②の影はグレーでなく青みに沈める（`shadowCol = col * vec3(0.55, 0.60, 0.85)`）
- コミットメッセージ `d4d92ee` の直後の履歴に「Auto-save」コミットが混ざることがある（デスクトップアプリの自動保存）。実害なし
