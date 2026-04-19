# このリポジトリの運用ルール

ユーザーは非エンジニア。Claude Code は以下を守ること。

## 🚨 本番反映チェックリスト（毎回必ず）

コード変更して「完了」と伝える前に、下記を **必ず確認してから** 報告する：

1. ✅ **main ブランチで作業しているか** — `git branch --show-current`
   - feature branch で作業していたら、必ず main に merge してから push する
   - このリポジトリは **main ブランチ一本化** 運用（feature branch は作らない）
2. ✅ **origin/main に push 済みか** — `git status` で "up to date with 'origin/main'"
3. ✅ **Vercel のデプロイが Ready になっているか**
   - Vercel ダッシュボード（または `vercel ls` / `vercel inspect`）で確認
   - ビルド失敗していたら即ユーザーに報告（sileny 無視しない）
4. ✅ **本番 URL を curl -I で確認** — `curl -sI https://<project>.vercel.app`
   - 200 が返るか
   - 必要ならシークレットウィンドウ相当の確認として、キャッシュ無効な GET を実行
5. ✅ **環境変数を追加・変更した場合は Vercel ダッシュボードにも登録** されているか確認
   - 登録漏れが最頻出原因。`.env.example` と Vercel 側を突き合わせる

上記いずれかが未達の場合は「完了」と言わず、状況を共有してユーザーの指示を仰ぐ。

## 🌳 ブランチ運用

- **main 一本化**。feature branch や `claude/*` 系の自動ブランチは作らない
- Worktree も原則使わない（どうしても必要な時のみ、後で必ず main に merge）
- 過去に `claude/laughing-maxwell` / `claude/tender-bartik` 系でトラブル多発（本番未反映）

## 🚀 各プロジェクトの本番 URL と Vercel 設定

| プロジェクト | 本番 URL | Git | Vercel Project |
|---|---|---|---|
| houmon-app | https://houmon-app.vercel.app | submodule (main) | houmon-app |
| travel-shiori | https://travel-shiori.vercel.app | 親リポ subdir (main) | travel-shiori |
| design-gallery | https://design-gallery-puce.vercel.app | 親リポ subdir (main) | design-gallery |
| nittei-chousei | https://nittei-chousei.vercel.app | submodule (master) | nittei-chousei |

注意: **nittei-chousei だけデフォルトブランチが `master`**。他は `main`。

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
