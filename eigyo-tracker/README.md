# eigyo-tracker

Gmail から営業情報を集めて Notion に自動同期するツール。

- **15分毎に GitHub Actions** で動く
- **Gmail一本** から各媒体（Wantedly / Green / 問合せフォーム / 直営業）の情報を拾う
- **Notion DB「デザイン制作会社」** に新規追加 / コンタクト年・媒体の更新
- **AI判定なし**（完全ルールベース）
- **「反応」(A/B/C/D) は自動上書きしない**（人間判断を尊重）

## ディレクトリ構成

```
eigyo-tracker/
├── src/
│   ├── index.ts       # メインエントリ
│   ├── gmail.ts       # Gmail取得
│   ├── notion.ts      # Notion読み書き
│   ├── classify.ts    # 媒体識別ルール
│   ├── sources.ts     # sources.json 読み込み
│   └── types.ts
├── scripts/
│   └── gmail-auth.ts  # 初回 OAuth 認証ヘルパー
├── sources.json       # 媒体設定（編集してソース追加・無効化）
├── .env.example
└── package.json
```

## セットアップ手順

### 1. 依存関係インストール

```sh
npm install
```

### 2. `.env` ファイル作成

`.env.example` をコピーして `.env` を作り、以下の値を埋める：

- `NOTION_TOKEN` … Notion Integration のシークレット
- `NOTION_COMPANIES_DB_ID` … 「デザイン制作会社」DB の ID
- `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` … Google Cloud Console で作成
- `GMAIL_REFRESH_TOKEN` … 下の手順③で取得

### 3. Gmail Refresh Token を取得（初回1回だけ）

`.env` に `GMAIL_CLIENT_ID` と `GMAIL_CLIENT_SECRET` を入れた状態で：

```sh
npm run auth:gmail
```

ブラウザが開くので Google 認証 → 表示された refresh token を `.env` に貼る。

### 4. 動作確認

```sh
npm run sync
```

ログを見て、Notion に反映されてれば成功。

## 媒体（ソース）の追加・編集

`sources.json` を編集するだけ。

```json
{
  "name": "Indeed",
  "enabled": true,
  "query": "from:indeed.com",
  "tag": "Indeed",
  "memo": "応募完了通知"
}
```

新しいタグを使う場合は、Notion 側の「媒体」マルチセレクトに同じ名前の選択肢を追加しておく。

## GitHub Actions（15分毎の自動実行）

`.github/workflows/eigyo-tracker.yml`（親リポジトリ側）で定義。

### 必要な GitHub Secrets

- `NOTION_TOKEN`
- `NOTION_COMPANIES_DB_ID`
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`
