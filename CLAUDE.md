# このリポジトリの運用ルール

ユーザーは非エンジニア。Claude Code は以下を守ること。

## 🚨 本番反映チェックリスト（毎回必ず）

コード変更して「完了」と伝える前に、下記を **必ず確認してから** 報告する：

1. ✅ **main ブランチで作業しているか** — `git branch --show-current`
   - feature branch で作業していたら、必ず main に merge してから push する
   - このリポジトリは **main ブランチ一本化** 運用（feature branch は作らない）
2. ✅ **origin/main に push 済みか** — `git status` で "up to date with 'origin/main'"
3. ✅ **ユーザーが実際に開く URL がどの deploy なのかを特定**（⭐ 最重要）
   - ポータル `hideyuki-yamanaka.github.io` 配下か、Vercel の独立ドメインか
   - 下の「各プロジェクトの本番 URL と Vercel 設定」の表を見る
   - **誤認防止**: `vercel inspect <url>` で deploy の最終更新時刻を確認、自分が push した時刻と一致するか見る
4. ✅ **Vercel プロジェクト名が正しいか**
   - `cat .vercel/project.json` で projectName を確認
   - `houmon-preview` など別プロジェクトを誤って作ってないか
   - 過去事故例: `/tmp/houmon-preview` で `npx vercel` を叩いた → ディレクトリ名で新プロジェクト自動作成
5. ✅ **Vercel のデプロイが Ready になっているか**
   - `npx vercel ls` で直近の status を確認
   - ビルド失敗（Error）していたら即ユーザーに報告
6. ✅ **本番 URL を curl -I で確認** — `curl -sI https://<project>.vercel.app`
   - 200 が返るか
7. ✅ **環境変数を追加・変更した場合は Vercel ダッシュボードにも登録** されているか確認
   - 登録漏れが最頻出原因。`.env.example` と Vercel 側を突き合わせる
   - ⚠️ **値の末尾改行バグ**: ダッシュボードで貼り付ける時、クリップボードに改行が付いてないか注意
   - 確認方法: `vercel env pull .env.tmp && python3 -c "print(repr(open('.env.tmp').read()))"`
   - 修正方法: `vercel env rm <NAME> <env> --yes && vercel env add <NAME> <env> --value "..." --yes`

上記いずれかが未達の場合は「完了」と言わず、状況を共有してユーザーの指示を仰ぐ。

## 🌳 ブランチ運用

- **main 一本化**。feature branch や `claude/*` 系の自動ブランチは作らない
- Worktree も原則使わない（どうしても必要な時のみ、後で必ず main に merge）
- 過去に `claude/laughing-maxwell` / `claude/tender-bartik` 系でトラブル多発（本番未反映）

## 🚀 各プロジェクトの本番 URL とデプロイ先

### Vercel 勢（アプリ本体は全部 Vercel に統一）

| プロジェクト | 本番 URL | Git | Vercel Project | 自動 deploy |
|---|---|---|---|---|
| **houmon-app** | **https://houmon-app-lilac.vercel.app** | submodule (main) | houmon-app | ✅ main push で自動 |
| **design-gallery** | **https://design-gallery-puce.vercel.app** | 親リポ subdir (main) | design-gallery | 手動（`vercel --prod`） |
| **空き時間みつける君** | **https://akijikan-mitsukeru-kun.vercel.app** | 親リポ subdir (main) | akijikan-mitsukeru-kun | 手動（`vercel --prod`） |
| **Retro Games** | **https://retro-games-one.vercel.app** | 親リポ subdir (main) | retro-games | 手動（`vercel --prod`） |
| travel-shiori（旅のしおり） | https://tabinoshiori-swart.vercel.app | 親リポ subdir (main) | **tabinoshiori**（※ project 名が違う） | - |
| nittei-chousei | https://nittei-chousei.vercel.app | submodule (master) | nittei-chousei | - |

### GitHub Pages 勢（ポータル本体のみ）

| プロジェクト | 本番 URL | デプロイ元 |
|---|---|---|
| ポータル本体 | https://hideyuki-yamanaka.github.io/ | 親リポ `.github/workflows/deploy.yml` |

注意事項：
- **アプリは全部 Vercel 一本**（2026-04-23 統一）。以前は GH Pages にも複製 deploy されてたが、houmon-app の mock モード問題や design-gallery の swc バグなどトラブルの温床だった。現在は各 `hideyuki-yamanaka.github.io/<app>/` にアクセスすると Vercel へリダイレクトされるだけ。
- **nittei-chousei だけデフォルトブランチが `master`**。他は `main`。
- ポータルの `product.meta.json` の `path` が絶対 URL（`https://...`）なら Vercel、未指定 or 相対パスなら GH Pages。今は全アプリが絶対URL指定済み。
- **design-gallery / 空き時間みつける君 / Retro Games は親リポの subdir に直置き**（submodule ではない）のでデプロイは手動。houmon-app と違って GitHub Auto Deploy は設定されていない（subdir の変更検知が厄介なため）。更新時は該当ディレクトリで `npx vercel --prod --yes` を叩く。

## 🧭 houmon-app のデプロイ手順（auto 連携あり）

1. `houmon-app/` 内で編集して commit
2. `git push origin main` → Vercel が**自動で** build & deploy
3. `npx vercel inspect houmon-app-lilac.vercel.app` で 最新 deploy の created 時刻を確認
4. 問題なければ親リポの submodule pointer も進める（`git add houmon-app && git commit -m 'bump houmon-app submodule' && git push`）
   - ※ GH Pages 側はリダイレクトだけなので急がなくてもOK

手動 deploy したい時だけ `npx vercel --prod --yes` を houmon-app ディレクトリで叩く。

## ⚠️ 過去の本番未反映事故（再発防止）

1. **別プロジェクトへの誤 deploy**（2026-04-23）
   - `/tmp/houmon-preview` ディレクトリ名で `npx vercel` → `houmon-preview` という別プロジェクト作成
   - 対策: deploy 前に必ず `cat .vercel/project.json` で projectName 確認
2. **env 末尾改行で Supabase 切断**（2026-04-23）
   - Vercel ダッシュボードにコピペした値に `\n` が混入
   - 対策: `vercel env pull` して `repr()` で確認、--value 渡しで再登録
3. **GH Pages と Vercel の二重 deploy**（2026-04-23）
   - ポータルは GH Pages に飛ばすが、CLAUDE.md は Vercel URL、ユーザーは両方行き来
   - 対策: houmon-app は Vercel 一本化（GH Pages はリダイレクト）

## ⚠️ git config（超重要・過去の本番未反映主犯）

コミット前に必ず `git log -1 --format='%ae'` で author email を確認。
`*@Mac.lan` のようなローカルホスト由来メールだと Vercel がデプロイを拒否する。

正しい設定:
```
user.name  = hideyuki-yamanaka
user.email = dosanko.design@gmail.com
```

もし過去のコミットが壊れた author で入ってたら、Claude は `git commit --amend --reset-author` ＋
`git push --force-with-lease` で修正する（force push の是非はユーザーに確認）。

## 🔑 環境変数

各プロジェクトに `.env.example` を置いている。ローカルでは `.env.local` にコピーして値を入れる。
**Vercel 側への登録を忘れない**（Project Settings > Environment Variables）。

## 💬 コミュニケーション

- 関西弁でかみ砕いて説明する（専門用語は例え話で）
- タスク完了時は VOICEVOX で音声通知（speaker=1, speedScale=1.3、100字以内）
- 選択肢を出す時は AskUserQuestion ツールを使う
