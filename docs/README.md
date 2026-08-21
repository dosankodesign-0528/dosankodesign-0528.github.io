# 📚 ドキュメント置き場

「あの資料どこやったっけ？」を無くすための入口。**まずここを見る。**

## 置き方のルール（迷ったらこれ）

| 種類 | 置き場所 | 例 |
|---|---|---|
| **どのプロダクトにも効く話** | `docs/general/` | 進め方のルール・カンプの読み方・Vercel の運用 |
| **特定のプロダクトの話** | `docs/<プロダクト名>/` | 網走サイトのデザインシステム・anyflow の引き継ぎ書 |

- フォルダ名は**プロダクトのフォルダ名とそろえる**（`abashiri-site/` の資料 → `docs/abashiri-site/`）
- 新しいプロダクトの資料が出てきたら、`docs/` に同じ名前のフォルダを作って入れる
- ⚠️ **プロダクト別フォルダの中で `index.html` `app/globals.css` のように書かれている相対パスは、
  そのプロダクトのフォルダ（例: `../../anyflow-embed/`）を基準に読む**

## 🌐 general — 全プロダクト共通

| ファイル | 中身 | いつ読む |
|---|---|---|
| [general/WORKING-RULES.md](general/WORKING-RULES.md) | 推測・質問・報告の共通ルール（🔴最重要・持ち運び用） | **作業に着手する前に必ず** |
| [general/DESIGN-SYSTEM-RULES.md](general/DESIGN-SYSTEM-RULES.md) | Figma カンプの読み方（数値を推測で埋めない） | カンプ通りに実装する時 |
| [general/DESIGN-SYSTEM-WORKFLOW.md](general/DESIGN-SYSTEM-WORKFLOW.md) | 既存サイトを棚卸ししてデザインシステムに整える手順 | スタイルを整理する時 |
| [general/VERCEL-PROJECTS.md](general/VERCEL-PROJECTS.md) | 各プロジェクトの本番 URL・Vercel 設定・デプロイ手順 | デプロイ・本番反映の確認 |

## 📦 プロダクト別

### abashiri-site（網走サイト）
| ファイル | 中身 |
|---|---|
| [abashiri-site/DESIGN-SYSTEM.md](abashiri-site/DESIGN-SYSTEM.md) | 完成したデザインシステム（色・文字・余白のトークン一覧） |
| [abashiri-site/DESIGN-SYSTEM-V2.md](abashiri-site/DESIGN-SYSTEM-V2.md) | V2.0 用に再整理したデザインシステム（4/8の倍数ルール・丸め表つき） |
| [abashiri-site/V1.1-STATUS.md](abashiri-site/V1.1-STATUS.md) | v1.1 のいまの状態・仮置き一覧・実装の地雷・次にやること（引き継ぎ用） |
| [abashiri-site/TASKS.md](abashiri-site/TASKS.md) | ヒデさんからの依頼台帳（依頼・進捗・概算時間。受けたら即追記） |

### anyflow-embed
| ファイル | 中身 |
|---|---|
| [anyflow-embed/HANDOFF.md](anyflow-embed/HANDOFF.md) | 実装の引き継ぎ書（一番厚い。実測値と経緯が全部ここ） |
| [anyflow-embed/DESIGN-TOKENS.md](anyflow-embed/DESIGN-TOKENS.md) | デザイントークン一覧 |
| [anyflow-embed/STORYBOARD-NOTES.md](anyflow-embed/STORYBOARD-NOTES.md) | 絵コンテのメモ |
| [anyflow-embed/FRAMER-AGENT-BRIEF.md](anyflow-embed/FRAMER-AGENT-BRIEF.md) | Framer 側の担当者／AI 向けの依頼書 |
| [anyflow-embed/anyflow-postmortem.md](anyflow-embed/anyflow-postmortem.md) | 事故の振り返り（[general/WORKING-RULES.md](general/WORKING-RULES.md) の根拠になった実測） |

### travel-shiori（旅のしおり）
| ファイル | 中身 |
|---|---|
| [travel-shiori/要件定義書.docx](travel-shiori/要件定義書.docx) | 要件定義書 |

## 🚚 ここに集めていないもの（意図的）

移すと壊れる・見つけにくくなるので、あえて元の場所に残しているファイル。

| ファイル | 場所 | 残す理由 |
|---|---|---|
| `CLAUDE.md` / `AGENTS.md` | リポジトリ直下 | Claude Code がその場所から自動で読み込む。動かすと効かなくなる |
| `abashiri-site/CLAUDE.md` / `AGENTS.md` | 各プロダクト直下 | 同上（`next dev` が自動生成もする） |
| 各プロダクトの `README.md` | 各プロダクト直下 | GitHub がフォルダを開いた時に表示する定位置。npm パッケージ（tune-panel）も同じ |
| `anyflow-embed/framer-handoff/*.md` | 元の場所 | `assets/` `code/` とセットで zip にして渡す**納品物一式**。バラすと zip が作れない |
| houmon-app / nittei-chousei の資料 | それぞれの別リポジトリ | submodule（このリポジトリの管理外） |
