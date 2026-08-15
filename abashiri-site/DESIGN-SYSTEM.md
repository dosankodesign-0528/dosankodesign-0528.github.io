# 網走サイト デザインシステム

整備日: 2026-08-15 ／ 対象: `abashiri-site`（Next.js 16 / Tailwind CSS v4 / framer-motion）

Figma: [works — デザインシステム](https://www.figma.com/design/jSLFEubHMoy3Hxgcw1AZuR/works?node-id=14829-23769)

---

## 0. このドキュメントの立ち位置

- **値の唯一の出どころは [`app/globals.css`](app/globals.css) の `@theme` ブロック。** ここに書いていない値をコンポーネントに直接書かない。
- このドキュメントと Figma の板は、その `@theme` を人間が読める形に写したもの。**ずれていたらコードが正**。
- ここに載っているのは **整備後の値だけ**。整備前の値と、それをどこにまとめたかは「[10. 統合の記録](#10-統合の記録)」にある。

### 命名の考え方

| 原則 | 中身 |
|---|---|
| 見た目でなく役割で名付ける | `--color-blue-500` ではなく `--color-brand`。色を変えても名前が生き残る |
| Tailwind の名前空間に乗せる | `--color-*` → `bg-* / text-* / border-*`、`--radius-*` → `rounded-*`、`--ease-*` → `ease-*`。独自のクラス名を作らない |
| 網走ならではの言葉は英語にしない | `botto` / `tamannee` などはアセット名・コンポーネント名にそのまま残す |

> Figma のカラースタイル・テキストスタイル・変数としては**登録していない**。Figma 側は一覧として読む板であって、定義の出どころではない。

---

## 1. 色

17 トークン。白と黒はトークンを持たせず Tailwind 既定の透過（`bg-white/90` など）で使う。

### ブランド

| トークン | 値 | クラス | 用途 |
|---|---|---|---|
| `--color-brand` | `#0070C9` | `bg-brand` / `text-brand` | 押せるもの全部。ボタン・見出し・アクティブな STEP・音 ON |
| `--color-brand-hover` | `#0080E4` | `hover:bg-brand-hover` | 押せるものに触れた時 |

### 空（全ページ共通の地）

| トークン | 値 | クラス | 用途 |
|---|---|---|---|
| `--color-sky-top` | `#35C3EA` | `from-sky-top` | 空の上端 |
| `--color-sky-bottom` | `#B5D7FF` | `to-sky-bottom` | 空の下端 |

`html/body` の背景と `Stage.tsx` のグラデーションが、どちらもこの 2 つを参照する。

### 面

| トークン | 値 | クラス | 用途 |
|---|---|---|---|
| `--color-canvas` | `#E6F3FF` | `bg-canvas` | 体験フローの地 |
| `--color-track` | `#CCE4FA` | `bg-track` | STEP の線と丸 |
| `--color-sky-pale` | `#B6DAFC` | `bg-/border-/text-sky-pale` | 装飾カモメ・弱い枠線・未到達 STEP のラベル |
| `--color-scroller` | `#8EC6EA` | `bg-scroller` | TOP スクロール領域の地 |

### 文字

| トークン | 値 | クラス | 用途 |
|---|---|---|---|
| （Tailwind 既定） | `#FFFFFF` | `text-white` | 写真・空の上の文字。最頻出 |
| `--color-ink` | `#1E1E1E` | `text-ink` | 白地の上の文字・見出し・ナビ(dark) |
| `--color-ink-muted` | `#7BA7CC` | `text-ink-muted` | 補助の文字・音 OFF のスピーカー |

### さし色

| トークン | 値 | クラス | 用途 |
|---|---|---|---|
| `--color-accent` | `#87D500` | `bg-accent` | 「今の気持ち」選択中チップ。**UI 上の非・青はこの 1 色だけ** |

### 影とスクリム

| トークン | 値 | クラス | 用途 |
|---|---|---|---|
| `--color-shadow` | `#005FB3` | `shadow-*` / `drop-shadow-*` | すべての影の色。濃さだけ用途で変える |
| `--color-scrim` | `#0B3C69` | `bg-scrim/30` | 環境音ダイアログの背面 |

> 影に黒を使わないのがこのサイトの肝。右上から陽が差している設定を全部の影で共有している。

### 場面の色かぶせ（STEP02）

| トークン | 値 | 用途 |
|---|---|---|
| `--color-tint-tento` | `#031FAC` | 天都山展望台 |
| `--color-tint-sango` | `#AC3303` | さんご草 |
| `--color-tint-himawari` | `#5DC000` | ひまわり畑 |
| `--color-tint-ryuhyo` | `#0368AC` | 流氷クルーズ |

写真の上に 40% でのせる。`ExperienceFlow.tsx` の `TINT()` が `color-mix(in srgb, var(…) 40%, transparent)` を組み立てる。

### 白と黒の透過

| クラス | 用途 |
|---|---|
| `bg-white/90` | ボタン・未選択チップ・ダイアログ |
| `border-white/70` | 楕円カードの白フチ・環境音ボタンの地 |
| `to-black/60` | カードホバーの黒グラデ終端 |

### トークンに含めない色

イラストとロゴの中の色（線 `#232222` / 肌 `#FCE4D3` / 肌の影 `#FCD0BD` / グレー `#CDCCCC` / キラキラ `#FCDF5A`）はアートワークの一部。UI から参照することも無いのでトークン化していない。

---

## 2. 書体と文字

### ファミリー

| トークン | 実体 | クラス | 読み込むウェイト |
|---|---|---|---|
| `--font-body` | Zen Kaku Gothic New | `font-body`（`body` に既定で当たる） | 500 / 700 / 900 |
| `--font-num` | M PLUS Rounded 1c | `font-num` | 100 / 700 / 800 |

- **400 は読み込んでいない。** ウェイト指定を書き忘れると 400 を要求して落ちるので、必ず `font-medium` 以上を明示する。
- `font-num` は No. とタイマーと STEP だけの限定使用。

### サイズ（11 段）

| トークン | 値 | クラス | よく使う組み合わせ | 用途 |
|---|---|---|---|---|
| `--text-number` | 140px | `text-number` | `font-num font-thin leading-none` + `opacity-80` | 楕円カードの通し番号 |
| `--text-timer` | 80px | `text-timer` | `font-num font-bold` + `tabular-nums` | ぼーっとタイマー |
| `--text-section` | 48px | `text-section` | `font-medium leading-[1.2]` | セクション見出し |
| `--text-promo` | 34px | `text-promo` | `font-bold leading-[1.4]` | プロモカードの見出し |
| `--text-title` | 32px | `text-title` | `font-black leading-[1.2]` / `font-medium leading-[1.2]` | 問いかけ見出し／カードホバーのスポット名 |
| `--text-step` | 28px | `text-step` | `font-num font-extrabold leading-none` | STEP の番号 |
| `--text-action` | 20px | `text-action` | `font-black` / `font-bold` / `font-medium` | 主要ボタン・チップ／もどる／もっと見る |
| `--text-lead` | 18px | `text-lead` | `font-bold leading-[1.4]` / `font-black leading-[1.3]` | プロモの小見出し／縦書き「観光サイト」 |
| `--text-label` | 16px | `text-label` | `font-bold leading-[1.2]` | グローバルナビ（通常） |
| `--text-body` | 15px | `text-body` | `font-bold leading-[1.6]` | ダイアログ本文・ON / OFF |
| `--text-label-sm` | 14px | `text-label-sm` | `font-black` / `font-bold` | 小さいボタン・タイマーのラベル・動画中のナビ・STEP |

### 行間と字間

- 行間は **1.0 / 1.2 / 1.3 / 1.4 / 1.6** の 5 種類だけ。Tailwind の `leading-relaxed` のような既定値は使わない。
- 字間を触っているのは右レールの縦書き「観光サイト」の `tracking-[2.3px]` **1 か所だけ**。

### 3 層のルール（世界観を壊さないための一番のルール）

| 層 | 何で組むか | 守備範囲 |
|---|---|---|
| 感情のことば | **手書き SVG**（フォントではない） | キャッチ・「ぼーっ」「たまんねーっ」「地味だけど、美味い」 |
| 説明のことば | Zen Kaku Gothic New | ナビ・見出し・本文・ボタン |
| 数のことば | M PLUS Rounded 1c | No.・タイマー・STEP |

**層をまたがない。** ゴシック体でキャッチを組むと「よくある観光サイト」になり、本文まで手書きにすると読めなくなる。

---

## 3. 角丸（6 段）

| トークン | 値 | クラス | 用途 |
|---|---|---|---|
| `--radius-card` | 290px | `rounded-card` | 楕円カード（730×410）。高さの 7 割超なので実質スタジアム型 |
| `--radius-device` | 60px | `rounded-t-device` | タブレット外枠の上端 |
| `--radius-device-inner` | 30px | `rounded-t-device-inner` | タブレット内側（外枠 60 − ベゼル 30） |
| `--radius-panel` | 24px | `rounded-panel` | プロモカード・環境音ダイアログ |
| `--radius-thumb` | 12px | `rounded-thumb` | STEP02 の場面サムネイル |
| （Tailwind 既定） | 9999px | `rounded-full` | ボタン・チップ・環境音ボタン・STEP の線 |

---

## 4. 余白（14 段）

すべて 4 の倍数。**Tailwind の spacing スケールで書く。`gap-[80px]` のような任意値は使わない。**

| クラス | px | 用途 |
|---|---|---|
| `-1` | 4 | プロモの小見出しと見出しの間 |
| `-2` | 8 | タイマーのラベルと数字／チップの上下 |
| `-3` | 12 | 気持ちチップの横並び／ロゴと SNS の間 |
| `-4` | 16 | 見出しと吹き出し／チップの縦並び／SNS の縦 |
| `-5` | 20 | 「次へ」と「もどる」の間 |
| `-6` | 24 | もっと見るの文字とアイコン／KV 内／チップ左右 |
| `-8` | 32 | プロモカードの中／問いかけとチップ／サムネイル間 |
| `-10` | 40 | カードホバーの文字下／グローバルナビの項目間 |
| `-11` | 44 | ボタンの左右パディング |
| `-15` | 60 | カード列の右余白／ロゴと SNS 群／プロモの上下 |
| `-20` | 80 | カード同士の間隔 |
| `-30` | 120 | 見出しとカード列／カード列の左余白／KV の上 |
| `-50` | 200 | ページ下端の余白 |
| `-75` | 300 | セクション同士の間隔 |

> タブレットの位置（`left-[76px]` など）やカードの実寸（730×410）は「レイアウトの座標」であって余白ではないので、このスケールの対象外。→ [8. レイアウト定数](#8-レイアウト定数)

---

## 5. 影（6 トークン・色は 1 色）

| トークン | 値 | クラス | 用途 |
|---|---|---|---|
| （`shadowConfig.ts`） | `-45px 55px 80px -12px rgba(0,95,179,0.70)` | `style={{ boxShadow: buildShadow(...) }}` | タブレットの浮遊感。調整パネル（`/mock/shadow/tune`）で触れる |
| `--shadow-press` | `2px 3px 0.5px rgba(0,95,179,0.25)` | `shadow-press` | 選択中の気持ちチップ |
| `--drop-shadow-press` | `2px 3px 0.5px rgba(0,95,179,0.40)` | `drop-shadow-press` | STEP02 の場面サムネイル |
| `--drop-shadow-illust` | `-8px 1px 2px rgba(0,95,179,0.25)` | `drop-shadow-illust` | 切り抜きイラスト |
| `--shadow-floating` | `0 8px 20px -6px rgba(0,95,179,0.35)` | `shadow-floating` | 環境音の ON/OFF ボタン |
| `--shadow-modal` | `0 25px 50px -12px rgba(0,95,179,0.35)` | `shadow-modal` | 環境音ダイアログ |

**黒い影は 1 つも無い。** Tailwind 既定の `shadow-lg` / `shadow-2xl` は使わない。

---

## 6. ブラー（7 トークン）

| トークン | 値 | クラス | 用途 |
|---|---|---|---|
| `--blur-hover` | 6px | `backdrop-blur-hover` / `blur-hover` | ボタン／カードホバーの幕／タイマーのラベル |
| `--blur-enter` | 10px | （framer / WAAPI の値として） | 登場時にピントが合う。KV・ボタン・イラスト・STEP 切り替え |
| `--blur-reveal` | 16px | （framer variants） | スクロールで現れるセクションとカード。背景写真も 0→8→16 |
| `--blur-scrim` | 18px | `backdrop-blur-scrim` | ダイアログ背面 |
| `--blur-scroll` | 22px | （`kvPatterns.ts`） | KV が奥へ引く時の最大ブラー |
| `--blur-glass` | 30px | （`soundBtnConfig.ts`） | 環境音ボタン |
| `--blur-glass-strong` | 40px | `backdrop-blur-glass-strong` | プロモカード。いちばん強い |

---

## 7. 動き

### 考え方

**秒数の正確さより、印象とのんびりした空気を優先する。** 速い動きと、急かす動きは入れない。

- 何かが出てくる時は必ず**ブラーが晴れる形**で出す。パキッとは出さない。
- カモメとキラキラだけは `linear` の 2〜3 コマ切り替え。あえてカクつかせて、GIF のようなコミカルさを出す。
- 常に動いているものは画面に置かない。人物は 15 秒に 1 回、背景写真は 36 秒かけて動く。

### イージング（3 本だけ）

| トークン | 値 | クラス | 用途 |
|---|---|---|---|
| `--ease-standard` | `cubic-bezier(0.22, 1, 0.36, 1)` | `ease-standard` | ほぼ全部。出だしが速く、最後をたっぷり伸ばす＝「ゆとり」の正体 |
| `--ease-bounce` | `cubic-bezier(0.3, 1.4, 0.5, 1)` | `ease-bounce` | 弾ませたい時だけ |
| （トークン無し） | `linear` | `ease-linear` | カモメ・キラキラのコマ送り |

### デュレーション

| 値 | 用途 |
|---|---|
| 300ms | ホバーの基本（ボタン拡大・チップ・サムネイル） |
| 500ms | カードのオーバーレイ／プロモカードの拡大／STEP 切り替え |
| 700ms | カード写真のズーム／再生ボタンの出入り |
| 900ms | スクロールで現れるセクション・カード／吹き出しの登場 |
| 1,100ms | 「たまらない」・ボタン・イラストの登場 |
| 1,450ms | 「な〜んにもない」の登場。単発の最長 |
| 1,600ms | 人物イラストのシェイク |

### TOP の登場シーケンス（全部そろうまで 4.55 秒）

| 何 | 開始 | 長さ |
|---|---|---|
| ヘッダー（ナビ） | 500ms | 1,300ms |
| 白い吹き出し（しっぽ無しの丸い形） | 500ms | 900ms |
| しっぽが下へ伸びる | 1,100ms | 1,378ms |
| な〜んにもない | 1,150ms | 1,450ms |
| たまらない | 1,948ms | 1,100ms |
| ぼーっとしてみる | 2,098ms | 1,100ms |
| 人物イラスト＋たまんねーっ | 3,448ms | 1,100ms |
| イラストが一回シェイク | 4,548ms | 1,600ms（以後 15 秒ごと） |

開いてから最初の 0.5 秒は**何も起きない**。空と海だけを見せる時間で、これが「ぼーっ」の入口になっている。

> ⚠️ `heroTiming.ts` の `kotoba.delay` / `tamaranai.delay` / `flourish.offset` は、本番の演出（`blurSeq`）では読まれていない。`HeroBlurSeq.tsx` が `t1 = start + 650` / `t2 = t1 + kotoba.duration × 0.55` と自前で計算しているため。調整パネルで触っても TOP は変わらない。

### ずっと動き続けるもの

| 周期 | 何 | 中身 |
|---|---|---|
| 0.48 – 0.75 秒 | カモメの羽ばたき | 2〜3 コマを opacity で切り替えるだけ。個体ごとに速さを変えて群れに見せる |
| 1.5 秒 | キラキラ | 2 箇所をフェード無しで往復 |
| 2.6 / 3.2 / 5.2 秒 | 吹き出しのムニムニ・波 | ぷにぷに呼吸と、輪郭を伝う波 |
| 6 – 11 秒 | カモメの漂い | 8 秒周期で 4 点を回る |
| 15 秒 | 人物イラストのシェイク | 1.6 秒動いて 13.4 秒休む |
| 36 秒 | 背景写真のズーム | 1.02 → 1.22 倍。気づかないくらい遅い |

---

## 8. 線・不透明度・レイアウト定数

### 白フチ（4 種類）

| 太さ | クラス | 用途 |
|---|---|---|
| 30px | `border-[30px] border-white` | タブレットのベゼル |
| 10px | `border-[10px] border-white` | 場面サムネイルのフチ |
| 8px | `border-8 border-white/70` | 楕円カードのフチ。ここだけ 70% で空が透ける |
| 2px | `border-2 border-sky-pale` | OFF ボタン。唯一の色付きの線 |

カモメの線だけは SVG 座標（viewBox 120）で 2.5〜8 の 5 段階あり、px ではないので `birdConfig.ts` の別管理。

### 不透明度（6 段）

`30 / 60 / 70 / 80 / 90 / 100`

| 値 | 用途 |
|---|---|
| 30% | スクリム・無効ボタン・選ばれなかった写真 |
| 60% | 未到達 STEP・カードの黒幕 |
| 70% | ナビ hover・SNS・カードのフチ・環境音ボタン |
| 80% | No. の数字 |
| 90% | ボタン・チップ・ダイアログ |
| 100% | ベゼル・サムネイル |

### レイアウト定数

| 何 | 値 |
|---|---|
| ステージ | 1512 × 982（カンプ原寸。画面サイズに合わせて等倍縮小して中央に置く） |
| タブレット | `left 76 / right 206 / top 87 / h 1005` + `translate(-30, -40)` |
| 右レール | `right 60 / top 80` |
| コンテンツ幅 | 980px |
| 楕円カード | 730 × 410（間隔 80 / 左余白 120 / 右余白 60） |
| キービジュアル画像 | 471 × 390（上余白 120px） |
| 背景写真の領域 | 945px 高 |
| グローバルナビ | `top 43` / 項目間 40 |
| 人物イラスト | 366 × 401 / `right 0 / top 600` |
| STEP インジケーター | 666 × 104 / `top 120` / 丸 56px / 間隔 305px |

---

## 9. コンポーネント

| ファイル | 役割 |
|---|---|
| `Stage.tsx` | 全ページ共通の器。空・カモメ・人物イラスト・右レール |
| `TopPage.tsx` | TOP ページの中身（KV・カード列・プロモ） |
| `ExperienceFlow.tsx` | 体験フロー STEP01〜03 |
| `GlobalNav.tsx` | グローバルナビ（`theme: light / dark`、`size: md / sm`） |
| `SoundUi.tsx` | 環境音の ON/OFF 確認ダイアログとトグル |
| `Bird.tsx` | カモメ（`variant: flap / soft / smooth3`） |
| `HeroBlurSeq.tsx` | キービジュアルの登場演出（採用版） |
| `IllustTamannee.tsx` | 人物イラスト（元PNG＋眉だけカーソルに反応） |

`/mock/` 配下は比較検討用のページで、本番の対象外。比較専用の値（浮遊シャドウ 3 案など）は本番コンポーネントに置かず、mock ページ側に持たせる。

---

## 10. 統合の記録

整備前にあって、今はもう実装に残っていない値。

### 色

| 整備前 | → | まとめた先 | なぜ |
|---|---|---|---|
| `#0160C4` | → | `--color-brand` | 写真の下地。ブランド青とほぼ同じで、普段は写真に隠れている |
| `#007BDD` 90% | → | `--color-brand` / 90% | プロモカードの面。見分けがつかない |
| `#0060BD` | → | `--color-shadow` | チップと写真の落ち影 |
| `#033466` | → | `--color-shadow` | 比較 mock 専用だった影の色 |
| `#BCD6EA` | → | `--color-sky-pale` | OFF ボタンの枠線 |
| `#ADCDEA` | → | `--color-sky-pale` | 未到達 STEP のラベル |
| `#9DB9D1` | → | `--color-ink-muted` | 音 OFF のスピーカー |
| `#F0F8FF` | → | `white` | 完了 STEP のチェック線 |
| `white / 95%` | → | `white / 90%` | ダイアログのカード |

### 余白

`6 → 8` ／ `10 → 12` ／ `18 → 16` ／ `30 → 32` ／ `34 → 32` ／ `42 → 40` ／ `63 → 60` ／ `130 → 120`

### そのほか

| 項目 | 整備前 | 整備後 |
|---|---|---|
| 角丸 | 8 段（28 / 38 を含む） | 6 段（28 → 24、38 → full） |
| 影 | 7 個・色 4 種 | 6 個・色 1 種 |
| 背景ブラー | 5 段（3px を含む） | 4 段（3 → 6） |
| 登場ブラー | 6 段（9 / 12 を含む） | 4 段（9・12 → 10） |
| イージング | 6 本 | 3 本 |
| 不透明度 | 8 段（35 / 95 を含む） | 6 段（35 → 30、95 → 90） |
| 文字サイズ | px 直書き 18 か所 | 11 トークン |
| コンポーネント名 | `MockNav` / `TopMock` / `ExperienceMock` | `GlobalNav` / `TopPage` / `ExperienceFlow` |

### 直した不具合

- **カードのフォントウェイト抜け**: ホバー時のスポット名（32px）だけ `font-weight` を書いておらず、読み込んでいない 400 を要求していた。ブラウザ次第で太さが変わる状態だったので `font-medium` を明示。
- **空グラデの二重管理**: `globals.css` に変数があるのに `Stage.tsx` が同じ値を直書きしていた。片方だけ直して事故る典型なので、トークン 1 か所に集約。

### 見た目への影響

いちばん大きい差はキービジュアルの上余白が 10px 上がったこと。あとは 1〜2px と数 % の不透明度差だけ。ビルドと全画面の目視確認は済んでいる。

---

## 11. 戻したい時

整備を始める直前の状態を GitHub に置いてある。

```
origin/restore-abashiri-before-design-system   (cea27f7)
```

```bash
git fetch origin restore-abashiri-before-design-system
git checkout restore-abashiri-before-design-system
```

---

## 12. これから値を足す時

1. `app/globals.css` の `@theme` に**名前を付けて**足す。
2. コンポーネントではその名前（クラス）だけを使う。
3. このドキュメントと Figma の板を同じタイミングで更新する。

コンポーネントに px や HEX を直接書きたくなったら、それは「トークンが足りない」というサイン。
