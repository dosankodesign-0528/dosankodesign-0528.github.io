# Vercel プロジェクト設定スナップショット

Vercel ダッシュボードで設定している各プロジェクトの状態を git にも残しておくドキュメント。
ベンダーロックインを避け、**プラットフォーム移行時の手引き** または **Vercel アカウントが
吹き飛んだ場合の再構築チェックリスト** として使う。

> ⚠️ 値そのもの（API キー等）はここに書かない。値の管理は `.env.local` ＋
> `dotenvx` 暗号化済み `.env.production` で別途行う。

最終更新: 2026-08-14

## プロジェクト共通

- **Vercel Org**: dosankodesign-9866's projects (`team_QLgrOjDs1OkQZB4wukaNHsvG`)
- **Node.js Version**: 全プロジェクト 24.x
- **env sensitive 既定の注意**: Vercel CLI 53 系以降は Production/Preview の env が
  デフォルトで `--sensitive` 扱い → `vercel env pull` で**空文字に見える**。
  読み戻したいキーは `vercel env add NAME production --value "..." --no-sensitive --yes` で登録。

## プロジェクト一覧

| Vercel Project ID | Project Name | Repo (subdir or submodule) | Root Directory | Framework | 本番 URL | デプロイ方式 |
|---|---|---|---|---|---|---|
| `prj_hrj2qpnZ20GvUIuc2gmDheaWDewA` | houmon-app | submodule (`houmon-app`, main) | `.` | Next.js | https://houmon-app-lilac.vercel.app | 🤖 git push で自動 |
| `prj_4apcWk0dmdgVRHVa0Dktk0D59Vmo` | tabinoshiori | 親リポ subdir (`travel-shiori`, main) | `travel-shiori` | Next.js | https://tabinoshiori-swart.vercel.app | 🛠 手動 (`npx vercel --prod --yes`) |
| `prj_f6kYAiQmSBLytwmw8foolY2tmzj4` | nittei-chousei | submodule (`nittei-chousei`, **master**) | `.` | Next.js | https://nittei-chousei-pi.vercel.app | 🤖 git push で自動 |
| `prj_0PFWbicnMhDclphX9PtiF49XEsXU` | design-gallery | 親リポ subdir (`design-gallery`, main) | `.` | Next.js | https://design-gallery-puce.vercel.app | 🛠 手動 |
| `prj_mkKya8Hr3XlH3li3dwspClOLSS8G` | akijikan-mitsukeru-kun | 親リポ subdir (`akijikan-mitsukeru-kun`, main) | `.` | Other (静的) | https://akijikan-mitsukeru-kun.vercel.app | 🛠 手動 |
| `prj_quCYKGmCeVVY5dymibs8CxbYeQ1E` | retro-games | 親リポ subdir (`Retro Games`, main) | `.` | Other (静的) | https://retro-games-one.vercel.app | 🛠 手動 |
| `prj_OIXN98ujgsQn3JlUZjkevUOOJhnz` | abashiri-site | 親リポ subdir (`abashiri-site`, main) | `abashiri-site` | Next.js | https://abashiri-site.vercel.app | 🤖 git push で自動（2026-08-14 設定） |

### ⚠️ abashiri-site を Git 自動デプロイに切り替えた話（2026-08-14）

もともと **Git 未連携**（Settings > Git が「Connect Git Repository」のまま）で、
Mac から `npx vercel --prod` を叩いた時だけ更新されるプロジェクトだった。
そのため `main` に push しても本番に反映されず、「修正が反映されてへん」となった。

やったこと：

1. Settings > Git で `hideyuki-yamanaka/hideyuki-yamanaka.github.io` を接続（Production Branch = `main`）
2. Settings > Build and Deployment > **Root Directory** に `abashiri-site` を設定
3. 同じ枠の **Skip deployments when there are no changes to the root directory** を **Enabled**
   （モノレポなので、design-gallery の毎朝のスクレイパー commit で網走サイトまで
   ビルドされるのを防ぐ）

**ハマりどころ**: 上の設定をした直後に既存デプロイの「Redeploy」を押すと
`The specified Root Directory "abashiri-site" does not exist.` で失敗する。
Redeploy は**同じソースを再生するだけ**で、既存デプロイのソースは CLI が
`abashiri-site/` の中から上げたもの＝その中に `abashiri-site/` は無いため。
切り替え後の初回は **Redeploy ではなく git push**（＝Git 由来のデプロイ）で走らせること。

**手動デプロイのコマンドも変わる**: Root Directory 設定後に `abashiri-site/` の中で
`npx vercel --prod` を叩くとパスが二重になって失敗する。手動で上げ直す時は
`npx vercel redeploy abashiri-site.vercel.app` を使う（design-gallery と同じ）。

> **手動 deploy** が必要な理由: 親リポの subdir 変更は Vercel の Git Integration が拾えない（リポルートに `.vercel/project.json` が houmon-app 用のため）。subdir に cd してから `npx vercel --prod --yes` で叩く。

## env (production) のキー一覧

値はここに書かない。Supabase URL のみダッシュボード復元用に書いておく。

### houmon-app
| キー | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (`https://zzkhmocwscuyydyzqpof.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公開鍵 |
| `NEXT_PUBLIC_AUTH_ENABLED` | 認証ON/OFFフラグ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 管理鍵（漏洩厳禁） |
| `NOTIFY_CRON_SECRET` | 通知 cron 用シークレット |
| `VAPID_SUBJECT` | Web Push 識別 (mailto:...) |
| `VAPID_PRIVATE_KEY` | Web Push 署名鍵 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push 公開鍵 |
| `ANTHROPIC_API_KEY` | Claude API |
| `RESEND_API_KEY` | メール送信 |

### travel-shiori (tabinoshiori)
| キー | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (`https://rcmyvakuxlvvlmpbytwu.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公開鍵 |
| `GEMINI_API_KEY` | Gemini API |

### nittei-chousei
| キー | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (`https://fkpspoclslkwxngpxral.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公開鍵 |

### design-gallery / akijikan-mitsukeru-kun / retro-games / abashiri-site
- env なし（静的サイト or 認証なしの公開ページ）

## ゼロから再構築する手順

万が一 Vercel アカウントが消えた / 別プラットフォームに移る場合：

1. **アカウント作成**
   - 移行先で `vercel login` または対象プラットフォームでログイン
2. **各プロジェクトの新規作成**
   - 該当ディレクトリで `npx vercel` を実行（または `vercel link` で既存リンク）
3. **プロジェクト設定を一覧表の通りに**
   - Root Directory, Framework, Node 24.x を上の表に合わせる
4. **env 登録**
   - `.env.local` または `dotenvx decrypt .env.production` で値を取得
   - `npx vercel env add KEY production --value "..." --no-sensitive --yes` で1つずつ登録
5. **DB 復元**（Supabase 使用アプリのみ）
   - `settings/docs/SUPABASE-RESTORE.md` 参照（Phase 1 で追加予定）
6. **デプロイ**
   - submodule (houmon-app, nittei-chousei): `git push` で自動 build
   - 親リポ subdir 系: 該当ディレクトリで `npx vercel --prod --yes`
7. **動作確認**
   - 本番 URL に curl して 200 が返ることを確認
   - `/api/keep-alive` がある場合はそれも 200 確認

## 関連ファイル

- [.github/workflows/supabase-keepalive.yml](../../.github/workflows/supabase-keepalive.yml) — Supabase 自動停止防止
- [CLAUDE.md](../../CLAUDE.md) / [AGENTS.md](../../AGENTS.md) — AI 向け運用ルール（symlink で同一）
