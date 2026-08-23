# このリポジトリの運用ルール

ユーザーは非エンジニア。Claude Code は以下を守ること。

## 📚 ドキュメントの置き場所（必須）

> **📄 索引は [settings/docs/README.md](settings/docs/README.md)。資料を探す時も足す時もまずここ。**

- **全プロダクト共通の資料 → `settings/docs/general/`**（進め方・カンプの読み方・デプロイ運用）
- **特定プロダクトの資料 → `settings/docs/<プロダクト名>/`**（フォルダ名はプロダクトのフォルダ名とそろえる）
- 新しく `.md` を作る時は**プロダクト直下に置かず `settings/docs/` の下に置く**。
  例外は下の3つだけ:
  1. `CLAUDE.md` / `AGENTS.md`（Claude Code がその場所から読むので動かせない）
  2. 各プロダクトの `README.md`（GitHub がフォルダを開いた時に出す定位置）
  3. 納品物としてフォルダごと渡すもの（例: `anyflow-embed/framer-handoff/`）
- **ファイルを足したら [settings/docs/README.md](settings/docs/README.md) の表にも1行足す**（索引が古くなると意味がない）

## 🎨 UI 提案ルール（必須）

ヒデさんから「〜のUIを提案して」「○案出して」など UI 案を求められた時は、
**テキストだけで終わらせず、必ず実際のデザインに当て込んだレイアウトで比較できる
URL を一緒に渡すこと**。

- 該当するアプリの `/mock/` 配下に各案ごとの mock ページを作る
  （houmon-app なら `src/app/mock/<topic>-<n>/page.tsx`）
- mock は認証不要 (`/mock/` 配下) で、実機 (iPhone) で開いて触れる前提で作る
- 5 案出すなら 5 ページ + 一覧ページ (`/mock/<topic>/`) を作って各案へのリンクを置く
- mock は本物のロジックまで実装しなくてよい (UI の見た目とジェスチャの感触だけ)
- 完成したら本番 URL (`https://houmon-app-lilac.vercel.app/mock/...`) を提示
- **採用案が決まったら、不採用 mock を即削除する（dev サーバが重くなる原因）**
  ヒデさんが「〇案で採用」と言った時点で、Claude は「他の比較 mock 消しますか？」と必ず聞くこと

## 🧭 進め方の共通ルール（推測・質問・報告）🔴最重要

> **📄 全文は [settings/docs/general/WORKING-RULES.md](settings/docs/general/WORKING-RULES.md)（持ち運び用）。着手前に必ず読む。**
> 根拠となった実測と経緯は [settings/docs/anyflow-embed/anyflow-postmortem.md](settings/docs/anyflow-embed/anyflow-postmortem.md)。

### 大原則

1. **推測は歓迎。黙るのが禁止。** 推測して進めてよい。ただし**推測した瞬間に、それが推測だと
   分かる形にする**（コードに印 / 報告に「仮置き一覧」の表 / 会話の最後に確認事項3つ以内）
2. **決まっていないことに気づけるのは Claude 側だけ。** ヒデさんは画面を見ても
   「何が決まっていないか」が分からず、**聞かれなければ全部決まっていると受け取る**。
   → 決まっていない箇所を見つけて**こちらから聞くのが Claude の仕事**
3. **判断で作業を止めない。** 答えに依存しない部分は先にやり切り、依存する所だけ仮置きする

### 聞くか・決めるかの判定（迷ったらこの3問）

「①正解が1つに決まるか ②見た目・体験に出るか ③あとで変えるのは安いか」

| 判定 | 条件 | 例 |
|---|---|---|
| 🟢 黙って進める | 正解が1つ **かつ** 見た目に出ない | 変数名・リファクタ・明らかなバグ修正 |
| 🟡 **仮置きして進む** | 見た目に出るが安く変えられる | カンプから**取れなかった値**・hover や空表示・レスポンシブ |
| 🔴 **手を止めて聞く** | 好みで変わる **または** 手戻りが高い | 演出そのもの・色やトーン・構成変更・**資料同士の食い違い**・**カンプの明らかなミス** |

- 🟡 が**5件を超えたら**、個別に進めず一度まとめて確認する
- 🔴 は `AskUserQuestion` で**選択肢＋おすすめ＋理由**。「どうしますか？」の丸投げは禁止
- **見た目・動きは言葉で聞かない。** mock か [tune-panel](settings/tune-panel/) を出して触ってもらう
  （実測: 選択肢を出した割合 12% の案件と 40% の案件で、繰り返し修正が 4件 vs 1件）

### 絶対にやらないこと

1. **取れなかった値を黙って埋める**（一番やってはいけない）
2. 「◯◯通りにしました」だけの報告（数値の表と実測値で示す）
3. 目視で「確認しました」と言う（書体・字間・余白は目で見て分からない）
4. **同じ症状に3回目の対処**（2回出たら対処をやめて原因を探す）
5. 好み・ブランドの判断を勝手に**確定**させる（仮で置くのは可）

### 実装まわりの事故防止

- **CSS / JS を範囲でまとめて置換しない。** マーカーは同じセクション内で取り、消す前に末尾5行を目で見る
- **1ファイルが4,000行を超えたら分割を提案する**（巻き添え削除は構造が呼び込む）

## 📐 Figma カンプ参照ルール（必須・違反したら作り直し）

> **📄 詳細は [settings/docs/general/DESIGN-SYSTEM-RULES.md](settings/docs/general/DESIGN-SYSTEM-RULES.md) に全文がある。**
> **📄 既存サイトのスタイルを棚卸ししてデザインシステムに整える手順は
> [settings/docs/general/DESIGN-SYSTEM-WORKFLOW.md](settings/docs/general/DESIGN-SYSTEM-WORKFLOW.md)**（洗い出し→統合→命名→トークン化→運用。
> abashiri-site で実際に通した工程。完成物の実例は
> [settings/docs/abashiri-site/DESIGN-SYSTEM.md](settings/docs/abashiri-site/DESIGN-SYSTEM.md)）。
> フォントだけでなく **角丸・padding・margin・gap・レイアウト・制約・影・ブラー・
> グラデ・不透明度・線** など、デザインシステムと呼ばれるもの全般が対象。
> 他の Claude アカウント／他プロジェクトで使う時は、あのファイルを持っていけばよい。

ヒデさんが Figma の URL を貼って「カンプ通りに」と言った時は、以下を**必ず**守る。
2026-08-14 に anyflow-embed で、フォントの太さ・書体・字間・要素の抜けが
何度も発覚したため制定。原因は毎回**「取れなかった情報を推測で埋めた」**こと。

### 1. 数値は推測禁止。取れる方法で取り切る

| 欲しい情報 | 使うツール | ダメな例 |
|---|---|---|
| **書体・ウェイト・サイズ・字間・行間** | **`get_design_context`**（文字列で返る） | ❌ `get_metadata` の枠のサイズから逆算 |
| 位置・サイズ・要素の一覧 | `get_metadata` | — |
| ベクターの座標・グラデ | SVG 書き出し | ❌ SVG から文字情報を読もうとする（パス化されて消える） |

- ⚠️ **`get_metadata` はフォント情報を返さない。** 返ってくる「テキスト枠の幅」は
  デザイナーが手で広げた値のことがあり、**文字送りとは無関係**。
  ここから字間を逆算するのは**捏造**。実際にこれで事故った
- ⚠️ **SVG 書き出しでは文字がパスになる**ので font 情報が消える。図の中の文字も
  `get_design_context` で別途取ること

### 2. 「一部」で済ませない

- セクション単位で**全テキストノードを列挙してから**照合する。主要な所だけ見ない
- **カンプにあって実装に無い要素**、**実装にあってカンプに無い要素**も必ず数える
  （実際に「認証基盤」ラベルが丸ごと抜けていた）

### 3. 取れなかったら、推測せずに言う

情報が取れなかった項目は、**勝手に埋めない**。
「この項目はカンプから取得できなかったので、こう仮定した」と**必ず明示して報告**する。
黙って埋めるのが一番やってはいけないこと。

### 4. 報告は「表と実測値」で

「カンプ通りにしました」だけの報告は禁止。**箇所 / カンプ値 / 実装値 / 一致か** の表を出す。
ブラウザの computed style や `canvas.measureText` で**実測**して裏を取る。

```js
// 書体が合っているかは目視でなく実測で確かめる
const cv = document.createElement('canvas').getContext('2d');
const w = f => { cv.font = `100 120px ${f}`; return cv.measureText('200+').width; };
w(getComputedStyle(document.documentElement).getPropertyValue('--font-en')); // 実際に使われる書体
w("'SF Pro Text'");  // カンプの指定 → 一致すれば正しい
```

### 5. カンプは更新される

作業を始める時は**カンプが前回から変わっていないか**を確認する。
ノードIDが新しい番号（例: `14779:*`）になっていたら追加・変更されたサイン。
ヒデさんにも「Figma を更新したら一言ください」と伝えてよい。

## 🔒 削除厳禁 Notion リソース（運用中の本番資産）

下記の Notion リソースは **絶対に削除・改名しないこと**。eigyo-tracker（自動同期スクリプト）が ID 参照で使っており、削除すると本番が即停止する。タイトルに `[🔒削除厳禁]` プレフィックスを付けて運用中。

| 種類 | タイトル | ID | env 変数 | 役割 |
|---|---|---|---|---|
| 📊 DB | [🔒削除厳禁] 企業リスト（旧称: デザイン制作会社） | `18919c93-bf12-4d92-b867-5ef9c32fb7b3` | `NOTION_COMPANIES_DB_ID` | 営業同期のメインDB |
| 📊 DB | [🔒削除厳禁] 営業同期 レポート（週次） | `3519b3c4-ddc0-819f-a278-e7f00497ce37` | `NOTION_REPORT_DB_ID` | 週次レポート蓄積先 |
| 📊 DB | [🔒削除厳禁] ステータス変更ログ | `d08ccb69-d0e7-4a16-aba7-2423e77f8ea0` | `NOTION_STATUS_CHANGE_LOG_DB_ID` | Before/After 表示の元データ |
| 📄 ページ | [🔒削除厳禁] 📬 営業同期 通知 | `3529b3c4-ddc0-8138-bd75-eab8bc43efb1` | `NOTION_NOTIFY_PAGE_ID` | @メンション通知の貼付先 |

- 個別レコード（会社ページ・過去レポート個別ページなど）は削除可能。**DB / 親ページ自体は不可**。
- ID は `gh secret list` で GitHub Secrets にも登録済み。

### 🔄 営業トラッカーのスキーマ自動キャッチアップ（実装済み）

**ヒデさんは Notion 上でプロパティ・オプションをほぼ自由にいじってよい。型変更だけは要注意。**

仕組み：

1. **id ベースの動的解決**（[eigyo-tracker/src/schema-resolver.ts](eigyo-tracker/src/schema-resolver.ts)）
   - sync 起動時に Notion DB を retrieve
   - プロパティ id・オプション id（Notion 内部 ID、rename しても不変）で「現在の名前」を逆引き
   - status などの内部値は内部 role key（"S" "A" "WAITING" など）で扱う
2. **自動復元**（[eigyo-tracker/src/schema-restorer.ts](eigyo-tracker/src/schema-restorer.ts)）
   - プロパティ削除・オプション削除を検知 → Notion API で再作成
   - 復元成功時は Notion 通知ページに「自動復元しました」とコメント
3. **キャッシュの自動 git commit**（[.github/workflows/eigyo-tracker.yml](.github/workflows/eigyo-tracker.yml)）
   - [eigyo-tracker/notion-schema-cache.json](eigyo-tracker/notion-schema-cache.json) に「役割 → id, currentName」を保持
   - sync 後に差分があれば github-actions[bot] が main へ自動 commit
4. **型変更だけは停止＋通知**（[eigyo-tracker/src/schema-check.ts](eigyo-tracker/src/schema-check.ts)）
   - 自動で型を戻すとデータロスするため、検知して停止し Notion 通知ページに⚠️

**ヒデさんがやって OK な操作**：
- プロパティ rename / 新規プロパティ追加
- select オプション rename / 追加
- プロパティ削除（自動で再作成される）
- select オプション削除（自動で再作成される）

**止まる操作**：プロパティの型変更（select↔multi_select 等）。
- 意図的な変更なら → Claude に「コード側のスキーマ定義 (src/schema-resolver.ts の `*_PROP_INITIAL`) を新仕様に合わせて」と依頼
- ミスなら → Notion で型を元に戻す

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

### 🔒 削除厳禁ブランチ（凍結スナップショット）

「あの時の状態に戻したい」用に残してあるブランチ。**絶対に消さない・上書きしない。**

| ブランチ | 中身 | 作った日 |
|---|---|---|
| `abashiri-v1.0` | 網走サイト バージョン 1.0（デザインシステム整備・命名統一まで完了した状態） | 2026-08-16 |
| `anyflow-v1.0` | anyflow-embed バージョン 1.0（公開中の本番そのもの。ここからアップデート案を検討する） | 2026-08-19 |

- これ以降の網走サイトのアップデートは **main に積む**（v1.0 ブランチには何も足さない）
- 凍結ブランチを増やす時は、この表にも 1 行足すこと

### 🧹 消してよい古いブランチ（役目を終えたもの）

`abashiri-v1.0` と `main` 以外は、ヒデさんの判断で消してよい。
⚠️ **この環境（Claude Code Remote）からはブランチ削除ができない**（`git push --delete` が
403 で弾かれる）。消す時は GitHub の Branches 画面か、ヒデさんのローカルから実行する。

| ブランチ | 状態 |
|---|---|
| `restore-abashiri-before-design-system` | 役目終了（2026-08-16 にヒデさん確認済み） |
| `claude/laughing-maxwell` / `claude/tender-bartik` | 過去の自動ブランチ。本番未反映トラブルの元 |
| `claude/design-system-figma-docs-toi8q2` | 今回の作業ブランチ。main に統合済み |
| `claude/abashiri-speech-bubble-animation-rrs13o` | 統合済みなら不要 |
| `release/v2.0` | 中身を確認してから判断 |

## 🚀 各プロジェクトの本番 URL とデプロイ先

### Vercel 勢（アプリ本体は全部 Vercel に統一）

| プロジェクト | 本番 URL | Git | Vercel Project | 自動 deploy |
|---|---|---|---|---|
| **houmon-app** | **https://houmon-app-lilac.vercel.app** | submodule (main) | houmon-app | ✅ main push で自動 |
| **design-gallery** | **https://design-gallery-puce.vercel.app** | 親リポ subdir (main) | design-gallery | ✅ main push で自動（Root Directory: `design-gallery`、2026-07-31設定） |
| **空き時間みつける君** | **https://akijikan-mitsukeru-kun.vercel.app** | 親リポ subdir (main) | akijikan-mitsukeru-kun | 手動（`vercel --prod`） |
| **Retro Games** | **https://retro-games-one.vercel.app** | 親リポ subdir (main) | retro-games | 手動（`vercel --prod`） |
| **anyflow-embed（V1.0・公開中）** | **https://anyflow-embed.vercel.app** | 親リポ subdir (main) | anyflow-embed | 手動（`vercel --prod`） |
| **anyflow-embed-v2（アップデート案）** | **https://anyflow-embed-v2.vercel.app** | 親リポ subdir (main) | anyflow-embed-v2 | 手動（`vercel --prod`） |
| **abashiri-site（網走 V1.0・公開中）** | **https://abashiri-site.vercel.app** | 親リポ subdir (main) | abashiri-site | ✋ 手動（2026-08-23 に Git 連携を解除）。push しても本番は動かない。上げ直しは `npx vercel redeploy abashiri-site.vercel.app` |
| **abashiri-site-v2（網走 アップデート案）** | **https://abashiri-site-v2.vercel.app** | 親リポ subdir (main) | abashiri-site-v2 | 手動（`vercel --prod`） |
| travel-shiori（旅のしおり） | https://tabinoshiori-swart.vercel.app | 親リポ subdir (main) | **tabinoshiori**（※ project 名が違う） | - |
| nittei-chousei | https://nittei-chousei-pi.vercel.app | submodule (master) | nittei-chousei | - |

### GitHub Pages 勢（ポータル本体のみ）

| プロジェクト | 本番 URL | デプロイ元 |
|---|---|---|
| ポータル本体 | https://hideyuki-yamanaka.github.io/ | 親リポ `.github/workflows/deploy.yml` |

注意事項：
- 🔒 **abashiri-site も V1.0（公開中）と V2（アップデート案）の2本立て**（2026-08-21 から。Anyflow と同じ方式）。
  - `abashiri-site/` = **V1.0。凍結**（2026-08-16 凍結時点のデザインに巻き戻し済み）。バグ修正以外は触らない
  - `abashiri-site-v2/` = アップデート作業場（旧 v1.1〜v1.2 の内容はこちらに移行済み）
  - ✋ 2026-08-23 に abashiri-site の Git 自動デプロイを**解除（手動化）**。push しても本番は動かなくなった（旧: 触ると即本番の地雷 → 解消）。上げ直したい時だけ `npx vercel redeploy abashiri-site.vercel.app`
  - V2 は手動デプロイ（`abashiri-site-v2/` 内で `npx vercel --prod --yes`）
- 🔒 **anyflow-embed は V1.0（公開中）と V2（アップデート案）の2本立て**（2026-08-19 から）。
  - `anyflow-embed/` = **V1.0。凍結**。バグ修正以外は足さない。URL は変えない
  - `anyflow-embed-v2/` = アップデート案の作業場。ここはいくら壊してよい
  - **Vercel プロジェクトが別**なので、V2 をデプロイしても V1.0 の URL は影響を受けない
  - ⚠️ デプロイ前に必ず `cat .vercel/project.json` で projectName を確認する。
    V2 のつもりで `anyflow-embed/` の中で叩くと**公開中のサイトが上書きされる**
  - V1.0 のコードは `anyflow-v1.0` ブランチにも凍結済み（削除厳禁）
- **アプリは全部 Vercel 一本**（2026-04-23 統一）。以前は GH Pages にも複製 deploy されてたが、houmon-app の mock モード問題や design-gallery の swc バグなどトラブルの温床だった。現在は各 `hideyuki-yamanaka.github.io/<app>/` にアクセスすると Vercel へリダイレクトされるだけ。
- **nittei-chousei だけデフォルトブランチが `master`**。他は `main`。
- ポータルの `product.meta.json` の `path` が絶対 URL（`https://...`）なら Vercel、未指定 or 相対パスなら GH Pages。今は全アプリが絶対URL指定済み。
- **空き時間みつける君 / Retro Games は親リポの subdir に直置き**（submodule ではない）でデプロイは手動。更新時は該当ディレクトリで `npx vercel --prod --yes` を叩く。
- **design-gallery は 2026-07-31 から Git 自動デプロイ**（Vercel の Root Directory を `design-gallery` に設定済み）。main に push するだけで本番反映される。毎朝のスクレイパー commit も自動で本番に乗る。
  - ⚠️ design-gallery ディレクトリ内から `npx vercel --prod` を叩くと Root Directory が二重になって失敗する。手動で再デプロイしたい時は `npx vercel redeploy design-gallery-puce.vercel.app` を使う。

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
4. **Vercel CLI 53 の sensitive 既定で env が「空」に見える罠**（2026-05-13）
   - Vercel CLI 53 系では Production / Preview に env add すると **デフォルトで sensitive 扱い** になり、`vercel env pull` で値が **空文字列として返る**（実際は中身入ってる）
   - これを「値が消えてる」と勘違いして再登録すると、本当に sensitive で書き直して読めなくなるループに入りがち
   - 対策: 読めるようにしたい時は `vercel env add NAME production --value "..." --no-sensitive --yes` で `--no-sensitive` を必ず付ける
   - pull で空に見えても、実際の本番アプリが動いてるなら値は入ってる可能性が高い。慌てて削除しない
5. **design-gallery の Root Directory 未設定で自動デプロイが9日間全滅**（2026-07-31発覚）
   - GitHub 連携はされてたのに Vercel の Root Directory が未設定 → モノレポのルート（Next.js アプリなし）でビルドして毎回 Error
   - スクレイパーは毎日 GitHub に commit してたが本番は 7/19 の手動デプロイのまま凍結 →「メディアからの更新が止まって見える」
   - 対策: Root Directory を `design-gallery` に設定（API で PATCH 済み）。「更新が止まった」と感じたら、まず `npx vercel ls` で **Error が並んでないか** を見る
6. **Supabase 無料プランの自動停止**（2026-05-13）
   - 7 日間無アクセスで Supabase プロジェクトが一時停止 → さらに長期で削除される
   - 旅のしおりがこれで一時停止していた
   - 対策: 各アプリに `/api/keep-alive` ルート + `.github/workflows/supabase-keepalive.yml` で週2回叩いて予防中

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

- **⏱ 長い作業は最大3分をめどに進捗を報告する（必須）**
  黙って作業し続けない。「今やっていること／終わったこと／次にやること／確認したいこと」を
  短くまとめて出す。ヒデさんから聞かれる前に、こちらから出すのが前提
- 関西弁でかみ砕いて説明する（専門用語は例え話で）
- タスク完了時は VOICEVOX で音声通知（speaker=1, speedScale=1.3、100字以内）
- 選択肢を出す時は AskUserQuestion ツールを使う
