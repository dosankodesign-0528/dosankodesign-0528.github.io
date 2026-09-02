# カンペ連動プレゼン（presenter-notes）— セットアップ＆運用

Figma のスライドを画面共有しながら、手元の「カンペ（トークスクリプト）」を
**ページ送りに連動**させて出すツール。非エンジニアでも使える3画面構成。

- コード: [`presenter-notes/v1/`](../../../presenter-notes/v1/)（依存ゼロの静的HTML）
- 本番URL: **https://presenter-notes-seven.vercel.app**
- Vercel プロジェクト: `presenter-notes`（CLI 手動デプロイ・Git連携なし）
- ローカル確認: `http://localhost:8780`（`.claude/launch.json` の `presenter-notes`）

## 仕組み（なぜ連動できるか）

1. **発表ウィンドウ**が Figma プロトタイプを `embed.figma.com` で埋め込む
2. Figma が **`PRESENTED_NODE_CHANGED`**（今このフレームに来た、というイベント）を
   親ページに postMessage で送ってくる
3. そのページIDを **`BroadcastChannel`**（同一PC・同一オリジンの別ウィンドウ間の通信）で
   **カンペウィンドウ**へ飛ばし、対応する原稿を表示する
4. 原稿は `localStorage` にオリジン単位で保存

> 🔑 **Figma のイベント送受信には OAuth アプリの `client-id` が必須。**
> これが無いと postMessage が一切飛ばない（実測で確定）。旧 `www.figma.com/embed` 方式でも同じ。

## Figma 側の設定（1回だけ・設定済み）

- OAuth アプリ「**カンペ連動**」（オーナー: Hideyuki Yamanaka / どさんこデザイン / Status: Draft）
  - 作成: https://www.figma.com/developers/apps →「Create a new app」
- **Client ID: `ozsIuuW15ekd1Vek1gKbVe`**（公開情報。Secret は未使用）
- Embed API →「Add an embed origin」に登録済みのオリジン:
  - `http://localhost:8780`（ローカル確認用）
  - `https://presenter-notes-seven.vercel.app`（本番）
  - ⚠️ **別URLで開くなら、そのオリジンをここに追加登録**しないとイベントが飛ばない

## 3画面の役割

| 画面 | ファイル | 役割 |
|---|---|---|
| 設定 | `index.html` | URL・client-id を入れる／各ページの原稿を書く／2窓を開く |
| 発表 | `present.html` | Figma 埋め込み。**このウィンドウだけを画面共有** |
| カンペ | `notes.html` | 共有しない。ページ連動表示・文字サイズ A＋/A− |

## 使い方

1. 本番URL（設定ページ）を開く。URL と client-id は保存済み（オリジンが変わったら再入力）
2. 「発表ウィンドウを開く」→ 別ウィンドウ。画面共有で**このウィンドウだけ**を選ぶ
3. 「カンペを開く」→ 別ウィンドウ。サブ画面や iPad（Sidecar）へ
4. **収録**: 発表でプロトを最初〜最後までクリックで送る → 設定ページに各ページが自動追加 →
   各行に原稿を打つ（`localStorage` に保存、本番当日はこのPCで再現）
5. **本番**: 発表を送る → カンペが連動。右上 A＋/A− で文字サイズ

## 🔴 実運用の必須注意

- **発表とカンペは必ず両方「見えている」状態にする**（別ウィンドウ・別画面）。
  片方を最小化/完全に隠すと `document.hidden` になり **Figma が描画とイベントを止めて連動が切れる**。
  → 画面共有で「発表ウィンドウだけ」を選ぶのはOK（隠れないので継続する）。
- タブではなく**ウィンドウ**として開くこと（index の「開く」ボタンは `window.open` で別ウィンドウを出す）。
- `localStorage` は**オリジン単位**。localhost で入れた設定・原稿は Vercel には引き継がれない（その逆も）。

## デプロイ（更新のしかた）

Git 連携なし。更新したら手動で:

```bash
cd "/Users/hideyuki/Developer/Claude Code/presenter-notes/v1" && npx vercel --prod --yes
```

- デプロイ前に `cat .vercel/project.json` で `projectName: presenter-notes` を確認
- 別ドメイン（プレビューURL等）で開く場合は Figma アプリの embed origin にそのオリジンを追加

## 検証済み（2026-09-02・実Chrome）

- Figma 埋め込み表示（このファイルはリンク共有ONで未ログインでも表示可）✅
- client-id 設定後、`INITIAL_LOAD` / `PRESENTED_NODE_CHANGED` 受信 ✅（localhost・Vercel 両方）
- 発表 → カンペへ BroadcastChannel → カンペがページ番号「1/1」描画 ✅
- 文字サイズ A＋/A−（40→48→44px・localStorage 保存）✅
