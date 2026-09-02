# カンペ連動プレゼン（presenter-notes）— セットアップ＆運用

Figma のスライドを見せながら、手元の「カンペ（トークスクリプト）」を
**ページ送りに連動**させて出すツール。**Chrome のタブを切り替えて**スライドと
ウェブサイトを行き来しながらプレゼンでき、カンペは共有されない別ウィンドウに出る。

- コード: [`presenter-notes/v1/`](../../../presenter-notes/v1/)（依存ゼロの静的HTML）
- 本番URL: **https://presenter-notes-seven.vercel.app**
- Vercel プロジェクト: `presenter-notes`（CLI 手動デプロイ・Git連携なし）
- ローカル確認: `http://localhost:8780`（`.claude/launch.json` の `presenter-notes`）

## 仕組み（なぜ連動できるか）

1. **スライドのタブ**（`present.html`）が Figma プロトタイプを `embed.figma.com` で埋め込む
2. Figma が **`PRESENTED_NODE_CHANGED`**（今このフレームに来た、というイベント）を postMessage で送る
3. そのページID(nodeId)を **`BroadcastChannel`**（同一PC・同一オリジンの別ウィンドウ/タブ間通信）で
   **カンペウィンドウ** `notes.html` へ飛ばし、対応する原稿を表示
4. 設定・原稿は `localStorage`（オリジン単位）に保存

> 🔑 **Figma のイベント送受信には OAuth アプリの `client-id` が必須**（無いと postMessage が一切飛ばない・実測確定）。
> **client-id とオリジン登録はアカウントに1回だけ**。デッキ（プレゼン）や Figma ファイルには依存せず**永久に使い回す**。

## 複数プレゼン（デッキ）

- `localStorage` の `pn_decks` に **{name, url(Figmaプロト), scripts(原稿)} を何個でも**保存。
- 設定ページ上部の「🎬 プレゼン（デッキ）を選ぶ」で切替・追加・名前変更・削除。
- **新しいプレゼン = 「＋新規プレゼン」→ URL貼る→収録だけ。Figma側の設定はやり直し不要。**
- 旧バージョン（1組だけ持っていた `pn_url`/`pn_scripts`）は初回ロードで自動的に「プレゼン1」へ移行。
- `present.html`/`notes.html` は**アクティブなデッキ**を見る。切替時は BroadcastChannel の
  `deck-changed` で present が reload・notes がリセット。

## Figma 側の設定（1回だけ・設定済み）

- OAuth アプリ「**カンペ連動**」（オーナー Hideyuki Yamanaka / どさんこデザイン / Status: Draft でも動く）
  - 作成: https://www.figma.com/developers/apps →「Create a new app」
- **Client ID: `ozsIuuW15ekd1Vek1gKbVe`**（公開情報。Secret 未使用）
- Embed API →「Add an embed origin」に登録済み:
  - `http://localhost:8780`（ローカル）/ `https://presenter-notes-seven.vercel.app`（本番）
  - ⚠️ **別URLで開くならそのオリジンを追加登録**しないとイベントが飛ばない

## 3画面の役割

| 画面 | ファイル | 開き方 | 役割 |
|---|---|---|---|
| 設定 | `index.html` | 最初に開くタブ | URL・client-id・デッキ・原稿を管理 |
| スライド | `present.html` | 「スライドを開く」= **同じChrome内の新しいタブ** | Figma 埋め込み。他サイトのタブと切替可 |
| カンペ | `notes.html` | 「カンペを開く」= **別ウィンドウ** | 共有しない。ページ連動・文字サイズ A＋/A− |

## 使い方（Chrome タブ切り替え式）

1. 本番URLを開く → デッキを選ぶ → STEP1 に Figma URL を保存
2. 「🖥 スライドを開く」→ 新しいタブでスライド。最初〜最後まで送って**収録**（各行に原稿）
3. 本番の構成:
   - **共有する Chrome ウィンドウ** … タブ①スライド ＋ タブ②③見せたいウェブサイト（タブ切替で行き来）
   - **カンペ** … 「カンペを開く」の別ウィンドウ。共有ウィンドウの外へ（裏/サブモニター/iPad）
4. 画面共有は **「画面全体」ではなく「Chrome ウィンドウ」を選ぶ** → 全タブが映り、カンペ(別ウィンドウ)は映らない（モニター1枚でOK）
5. スライドタブで Figma を送る → カンペが連動。右上 A＋/A− で文字サイズ

## 🔴 実運用の必須注意

- 画面共有は **「Chrome ウィンドウ」** を選ぶ（「画面全体」だとカンペ別ウィンドウも映る）。
- **カンペは共有する Chrome ウィンドウに入れない**（別ウィンドウのまま裏やサブ画面へ）。
- スライドタブを**表示している間だけ** Figma はイベントを出す（他タブに切替中は一時停止するが、
  戻れば再開。切替中は原稿も最後のページのまま待機＝正常）。
- `localStorage` は**オリジン単位**。localhost と Vercel は設定・原稿を共有しない。

## デプロイ（更新のしかた）

Git 連携なし。更新したら手動で:

```bash
cd "/Users/hideyuki/Developer/Claude Code/presenter-notes/v1" && npx vercel --prod --yes
```

- デプロイ前に `cat .vercel/project.json` で `projectName: presenter-notes` を確認
- 別ドメインで開くなら Figma アプリの embed origin にそのオリジンを追加

## 検証済み（2026-09-02・実Chrome / localhost / Vercel）

- Figma 埋め込み表示（リンク共有ONで未ログインでも可）✅
- client-id 設定後 `INITIAL_LOAD` / `PRESENTED_NODE_CHANGED` 受信 ✅（localhost・Vercel 両方）
- 発表 → カンペへ BroadcastChannel → ページ番号描画 ✅
- 複数デッキが URL・原稿ともに独立 ✅ / 旧データの自動移行 ✅
- 文字サイズ A＋/A−（40→48→44px 保存）✅

## 今後やるなら（未実装）

- **カンペをスマホ/iPadで見る**（＝画面全体共有でも隠す）には、別端末同期の中継サーバーが必要
  （Supabase Realtime / Upstash 等）。2026-09-02 時点は「Chrome ウィンドウ共有」で運用する方針。
