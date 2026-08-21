# tune-panel

**作りながら数値をその場でいじれる「調整パネル」。**
JavaScript 1ファイル・依存ゼロ。どのページにも `<script>` 1行で足せます。

anyflow-embed のアニメ調整パネル（スライダー74本）を、どのプロジェクトでも使えるように
切り出したものです。

- 🎚 スライダー / 2〜3択 / ピル（案の切替）/ ON・OFF / プルダウン / 色 / 文字
- 🧭 大カテゴリのアコーディオン + 小見出し2階層 + 各行の補足文
- 🔍 検索ボックス（項目が増えても迷子にならない）
- 💾 `localStorage` に自動保存（次に開いても続きから）
- 📋 「設定をコピー」→ JSON を Claude に貼れば、そのまま既定値に焼き込める
- 🎯 **ツマミの初期位置が自動で真ん中**（上げるも下げるもできる）
- 🖱 ヘッダーを掴んで移動 / 右下つまみでリサイズ / `.` キーで隠す（位置もサイズも保存）

---

## 🔴 必須要件（2026-08-21 ヒデさん制定）

**調整パネルと名の付くものは、どのプロジェクトでも必ず次の3点を備えること。**

1. **位置移動** … ヘッダーをドラッグして好きな場所へ動かせる
2. **サイズ変更** … 右下のつまみでリサイズできる
3. **たたむ／ひらく** … アコーディオンで折りたためる

4. **階層で整理する** … 項目を全部並列に並べない。カテゴリ（アコーディオン）は
   **ページまたは画面**、その中の小見出しは**セクション**、`deep` 見出しで**細目**、
   の3階層で設計する（AnyFlow のパネルで確立した構成。2026-08-21 網走で再徹底）。
   例：`🏠 トップページ ＞ 表情 ＞ 眉／口／確認用`

理由：パネルは調整したい対象（人物イラスト等）に重なりがちで、動かせないと
対象が見えない。項目が並列に並ぶと、増えるほど目的の場所を探せなくなる。
この tune-panel.js と、abashiri-site の components/TunePanel.tsx
（Reactシェル）は移動・リサイズ・たたむの3点を備えている。
**素の div でパネルを自作しないこと。**

---

## 使い方（3ステップ）

### 1. 読み込む

```html
<script src="tune-panel.js"></script>
```

### 2. いじりたい値を1か所にまとめる

```js
const DEFAULTS = {
  common: { speed: 1 },
  orbit:  { radius: 190, period: 9 },
  dot:    { size: 7, style: 'gradient' }
};
const params = structuredClone(DEFAULTS);   // 実際に描画で読むのはこっち
```

### 3. パネルを作る

```js
const panel = TunePanel.create({
  title: '⚙️ 調整パネル',
  storageKey: 'my-app',   // 保存キー。プロジェクトごとに変える
  version: 1,             // 値の意味を変えたら上げる（古い保存値を自動で捨てる）
  params, defaults: DEFAULTS,

  schema: [
    { cat: '🌊 全体', open: true, items: [
      { slider: '再生スピード', path: 'common.speed', min: 0.1, max: 3, step: 0.05, fmt: 'x',
        hint: '全部の動きが同じ倍率で速くなります。' }
    ]},
    { cat: '🛰 軌道', items: [
      { sub: '形' },
      { slider: '大きさ',   path: 'orbit.radius', min: 60, max: 420, step: 1, fmt: 'px' },
      { slider: '1周の秒数', path: 'orbit.period', min: 2,  max: 30,  step: .5, fmt: 's' },
      { pills: '配色', path: 'dot.style', options: [
        { name: 'グラデ', value: 'gradient', swatch: '#3fb7ff', desc: '青→ピンクへ変化。' },
        { name: '2色',    value: 'brand',    swatch: '#FF5D97', desc: '交互に2色。' }
      ]}
    ]}
  ],

  onSettle: () => replay()   // 手が止まって0.25秒後に1回だけ呼ばれる
});
```

描画側は `params` を読むだけ。パネルは `params` を直接書き換えるので、
毎フレーム `params` を読む作り（requestAnimationFrame）なら**何も繋がなくても反映されます**。

デモ: [`demo/index.html`](./demo/index.html) をブラウザで開く

---

## 部品の書き方

| 書き方 | 出るもの |
|---|---|
| `{ slider:'ラベル', path:'a.b', min, max, step, fmt, hint }` | スライダー |
| `{ seg:'ラベル', path, options:[['右回り',1],['左回り',-1]] }` | 2〜3択のボタン |
| `{ pills:'見出し', path, options:[{name,value,swatch,desc}] }` | 案の切替ピル（選択中の説明つき） |
| `{ toggle:'ラベル', path }` | ON / OFF スイッチ |
| `{ select:'ラベル', path, options }` | プルダウン |
| `{ color:'ラベル', path }` / `{ text:'ラベル', path }` | 色 / 文字 |
| `{ sub:'小見出し' }` / `{ sub:'…', deep:true }` | 見出し（deep で一段内側） |
| `{ note:'注釈' }` | グレーの補足文 |
| `{ button:'ラベル', onClick, primary:true }` | ボタン |
| `{ custom:(el, panel) => {…} }` | 自前のDOMを差し込む |

共通オプション

| キー | 意味 |
|---|---|
| `path` | `params` の場所を `'orbit.radius'` のように文字で指定 |
| `get` / `set` | `path` の代わりに関数で読み書きしたい時 |
| `fmt` | 値の見せ方。`'s' '%'  'px' 'deg' 'x' 'int' 'n1' 'n2'` か自前の関数 |
| `hint` | 行の下に出る薄いグレーの説明。**全部の行に書くのを推奨** |
| `when: p => p.core.show` | 条件付き表示（切替時は `rebuild:true` を併用） |
| `autoCenter: false` | ツマミの自動センタリングを切る（角度など、真ん中に意味がない値で使う） |

---

## パネル側のオプション

| キー | 既定 | 意味 |
|---|---|---|
| `storageKey` | なし | `localStorage` のキー。省略すると保存しない |
| `version` | `1` | **値の意味を変えたら上げる。** 古い保存値を自動で消す |
| `theme` | `'light'` | `'dark'` で暗いパネル |
| `position` / `size` | 右下 / 360×520 | 初期位置とサイズ |
| `startClosed` | `false` | たたんだ状態で出す |
| `search` | `true` | 検索ボックス |
| `hotkey` | `'.'` | 隠す / 出すキー。`null` で無効 |
| `saveMode` | `'button'` | **保存のしかた（Anyflowのパネルと同じ仕様）。** `'button'`: 触った値はその場で反映されるが保存はされず、未保存の変更があると「💾 保存」がピンクになる。押した時だけ localStorage に確定（リロード後も残る）。`'auto'`: 触るたびに自動保存（旧来の挙動） |
| `secret` | `true` | **隠しモード。** パネルは最初は見えず、画面右上の透明ボックス（64px）をクリックすると出る/隠れる。出した状態は同じタブの間だけ記憶。`false` で従来どおり常時表示（2026-08-21 ヒデさん指示で既定ON） |
| `settleDelay` | `250`(ms) | `onSettle` を呼ぶまでの「手が止まった」判定 |
| `footer` | `[]` | 足すボタン。`footerDefaults:false` で既定3つを消す |
| `onChange(info)` | — | 動かすたび（毎フレーム相当）。**軽い処理だけ** |
| `onSettle(info)` | — | 手が止まって0.25秒後。**リプレイなど重い処理はこっち** |

### メソッド

```js
panel.sync()          // params を外から書き換えた後、表示を合わせる
panel.rebuild()       // schema を組み直す
panel.reset()         // 初期値に戻す
panel.copy()          // 設定JSONをクリップボードへ
panel.importJSON(str) // JSONを流し込む
panel.toggle()        // 開閉
panel.destroy()       // 消す
```

---

## 引き継いだ仕様（anyflow-embed で決めたこと）

このライブラリは思いつきで作ったものではなく、**anyflow-embed で実際に苦情が出て直した内容**を
そのまま持ってきています。対応状況は下の通り（ブラウザで実測して確認済み）。

| anyflow-embed で決めたこと | tune-panel | どこで |
|---|---|---|
| いじったら**その場でリプレイ**。ドラッグ中は重いので手が止まって0.25秒後 | ✅ | `onSettle`（`settleDelay:250`） |
| ピル・切替ボタンは**押した瞬間に即座に**流し直す | ✅ | `immediate:true` で即 `onSettle` |
| パネルを作り直しても**開いていたアコーディオンが閉じない** | ✅ | 開閉状態を記憶して復元 |
| 作り直しで**見ていたスクロール位置が先頭に飛ばない** | ✅ | `rebuild()` 前後で退避・復元 |
| **外寸を固定**して中身だけスクロール（開閉のたびに触る場所がズレない） | ✅ | 360×520 固定＋内部スクロール |
| パネル内のスクロールを**ページに伝播させない** | ✅ | `overscroll-behavior: contain` |
| **慣性スクロール(Lenis)にホイールを持っていかれない** | ✅ | `data-lenis-prevent` を自動で付与 |
| **ツマミの既定位置が自動で真ん中**（下げることもできる） | ✅ | `autoCenter`（既定ON） |
| 全スライダーに**補足文** | ✅ | `hint` |
| 小見出しの**2階層** | ✅ | `sub` / `sub:…, deep:true` |
| 選択中のピルの**説明文**を出す | ✅ | `options[].desc` |
| ヘッダーで移動 / 右下つまみでリサイズ / 位置とサイズを保持 | ✅ | ドラッグでは開閉を発火させない |
| **📋 いまの設定をコピー**（JSONを渡して既定値に焼き込む運用） | ✅ | フッターの既定ボタン |
| 保存値は初期値と**deep-merge**。壊れた値・知らないキーは捨てる | ✅ | `mergeSaved()` |
| **廃止した選択肢**が保存に残っていても事故らない | ✅ **改善** | options に無い値は初期値へ自動で戻す |
| 値の意味を変えたら保存キーのバージョンを上げる | ✅ **改善** | `version` を上げると古い保存を**自動で削除** |

> **改善** の2つは anyflow-embed では手作業だったところ（`STORAGE_KEY` を v56 まで手で上げていた）。

### 「その場でリプレイ」の書き方

ライブラリはタイミングだけ担当します。**何を流し直すか**はアプリ側に書きます。

```js
TunePanel.create({
  …,
  onSettle: () => {
    // いま画面に映っているセクションだけ時計を巻き戻して流し直す
    for (const key in SECTIONS) {
      const r = SECTIONS[key].getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) resetSectionClock(key);
    }
    renderFrame();
  }
});
```

毎フレーム `params` を読んでいる作りなら、`onSettle` は空でもその場で反映されます。

---

## 覚えておくと事故らないこと

- **`version` を上げ忘れると壊れる。** 値の意味を変えたのに古い保存値が残ると、
  新しい初期値が上書きされて「自分だけ表示が違う」状態になる。上げれば古い値は自動で消える
- **重い処理は `onSettle` に置く。** `onChange` はスライダーを動かす間ずっと呼ばれる
- **`hint` は全行に書く。** 半年後の自分と、他の人のために効く
- **パネルの外寸は固定。** 中身で高さが伸び縮みすると、開閉のたびに触っている場所がズレる
  （anyflow-embed で実際に起きた。だからこのライブラリは外寸固定＋中身スクロールにしている）

---

## Claude に頼む時のテンプレ

> `tune-panel` を入れて、下の値を調整パネルから触れるようにして。
> - storageKey は `<プロジェクト名>`、version は 1
> - カテゴリは「◯◯」「△△」に分けて、全部の行に hint を書く
> - 重い再描画は onSettle 側に置く
> - 触ったらその場で反映されること（リロード不要）

---

## ライセンス

MIT
