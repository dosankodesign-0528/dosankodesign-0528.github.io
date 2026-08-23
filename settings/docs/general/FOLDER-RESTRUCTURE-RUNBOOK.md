# 📁 フォルダ構成の整理 手順書（ランブック）

「バージョンごとに親フォルダが増えていく」構成を、**プロダクト親1つ＋子でバージョン分け**に整える手順。
2026-08-23 作成。**この手順書のとおりにやれば本番を落とさずに移せる。**

> この手順書の一番大事なところは **「Vercel の自動デプロイ設定を先に直してからフォルダを動かす」** の一点。
> 順番を逆にすると公開中サイトが落ちる（過去に design-gallery で9日間デプロイ全滅した事故と同じ地雷）。

---

## 🎯 めざす形

```
abashiri/                ← プロダクト親（1つ）
  ├ v1/                  （今の abashiri-site）
  └ v2/                  （今の abashiri-site-v2）
anyflow/
  ├ v1/                  （今の anyflow-embed）
  └ v2/                  （今の anyflow-embed-v2）
```

※ 子フォルダ名（`v1`/`v2` か `1.0`/`2.0` か）はヒデさんに確認して決める。以下は `v1`/`v2` で書く。

---

## 🚦 まず「どのフォルダがどのデプロイ方式か」を把握する（最重要）

移動の危険度は **デプロイ方式** で決まる。

| フォルダ | Vercel プロジェクト | デプロイ方式 | 移動の危険度 | 公開状態 |
|---|---|---|---|---|
| `abashiri-site` | `abashiri-site` | **Git 自動**（main push で自動ビルド。Root Directory=`abashiri-site`） | 🔴 **高** | 網走 V1.0 公開中 |
| `abashiri-site-v2` | `abashiri-site-v2` | 手動（`vercel --prod`） | 🟡 中 | 作業中 |
| `anyflow-embed` | `anyflow-embed` | 手動（`vercel --prod`） | 🟡 中 | anyflow V1.0 公開中 |
| `anyflow-embed-v2` | `anyflow-embed-v2` | 手動（`vercel --prod`） | 🟢 低 | 作業中 |

- **Git 自動デプロイ**＝Vercel が「`abashiri-site` というフォルダ名」を覚えている（Root Directory）。フォルダを動かすと**古い名前を探し続けてビルド失敗→本番停止**。→ 移動前に設定変更が必須。
- **手動デプロイ**＝`.vercel/project.json`（projectId 入り）がフォルダと一緒に動く。新フォルダの中で `vercel --prod` すれば同じプロジェクトに出る。比較的安全。ただし Git 連携が付いていないか一応確認する。

### デプロイ方式の見分け方

```bash
npx vercel project ls          # Git 連携の有無・最新デプロイを一覧で確認
cat <フォルダ>/.vercel/project.json   # projectName を確認（誤爆防止）
```

Vercel ダッシュボード → 各プロジェクト → Settings → Git で「Connected Git Repository」があれば自動デプロイ。

---

## 🔴 手順A：Git 自動デプロイのフォルダ（abashiri-site）

**順番厳守。**フォルダを動かす前に Vercel 設定を直す。

1. **Vercel の Root Directory を先に変更する**
   - ダッシュボード → `abashiri-site` → Settings → Build and Deployment → **Root Directory**
   - `abashiri-site` → **`abashiri/v1`** に書き換えて Save
   - ⚠️ この時点ではまだデプロイは走らない（設定変更だけ）。フォルダもまだ動かさない
2. **ローカルでフォルダを動かす**（履歴を保つため必ず `git mv`）
   ```bash
   mkdir -p abashiri
   git mv abashiri-site abashiri/v1
   ```
3. **参照パスを直す**（下の「共通：参照パスの直し方」参照）
4. **node_modules を入れ直す**（`git mv` は node_modules を動かさないため）
   ```bash
   cd abashiri/v1 && npm install && cd -
   ```
5. **commit して push**（push した瞬間に Vercel が新パス `abashiri/v1` でビルドする）
   ```bash
   git add -A && git commit -m "abashiri-site を abashiri/v1 に移動" && git push origin main
   ```
6. **本番が生きているか確認**（CLAUDE.md の本番反映チェックリスト）
   ```bash
   npx vercel ls                                   # status が Ready か（Error が並んでないか）
   curl -sI https://abashiri-site.vercel.app | head -1   # 200 が返るか
   ```
   - もし Error → 落ち着いて **Root Directory が `abashiri/v1` になっているか**を最初に疑う（原因の9割はここ）

> 💡 **もっと安全にやりたい場合**：push で自動デプロイに任せず、先にローカルで本番ビルド（`npm run build`）が通るか確認 →
> それから push。網走 V1.0 は凍結中なので、そもそも中身は変えず「入れ物だけ移す」のが原則。

---

## 🟡 手順B：手動デプロイのフォルダ（anyflow-embed / anyflow-embed-v2 / abashiri-site-v2）

自動デプロイが無いので、フォルダを先に動かしてOK。

1. **フォルダを動かす**
   ```bash
   mkdir -p anyflow
   git mv anyflow-embed    anyflow/v1
   git mv anyflow-embed-v2 anyflow/v2
   # abashiri-site-v2 は手順Aの abashiri/ に入れる
   git mv abashiri-site-v2 abashiri/v2
   ```
2. **参照パスを直す**（下記共通手順）
3. **node_modules を入れ直す**（node_modules があるフォルダのみ。abashiri 系は有り、anyflow 系は無し）
   ```bash
   cd abashiri/v2 && npm install && cd -
   ```
4. **commit して push**（手動デプロイ勢は push だけでは本番に出ない＝安全）
5. **本番を更新したくなった時だけ**、新フォルダの中からデプロイ
   ```bash
   cd anyflow/v1
   cat .vercel/project.json      # ← projectName が anyflow-embed か必ず確認（誤爆防止）
   npx vercel --prod --yes
   cd -
   ```
   - ⚠️ 公開中の anyflow V1.0（`anyflow/v1`）を触る時は、中身を変えていないなら**そもそもデプロイし直さない**のが安全

---

## 🔧 共通：参照パスの直し方（ここを漏らすと索引が古くなって事故る）

フォルダ名が変わると、名前を指している箇所が全部ずれる。移動後に必ず洗い出す。

```bash
# 旧名がまだ残っていないか一括チェック（例：abashiri-site）
git grep -n "abashiri-site" -- '*.md' '*.json' '*.ts' '*.tsx' '*.js' ':!*/node_modules/*'
git grep -n "anyflow-embed" -- '*.md' '*.json' '*.ts' '*.tsx' '*.js' ':!*/node_modules/*'
```

直す対象（2026-08-23 時点の実測）：

| 場所 | 中身 | 直し方 |
|---|---|---|
| **`.claude/launch.json`** | `abashiri`(cwd) / `abashiri-v2-start`(cwd) / `anyflow-embed`(cd パス) / `anyflow-v2`(cd パス) | 新パスに書き換え |
| **`CLAUDE.md`** | 本番URL表・凍結ブランチ表・デプロイ手順の `abashiri-site` / `anyflow-embed` 表記 | 新パスに書き換え |
| **`settings/docs/general/VERCEL-PROJECTS.md`** | 同上 | 新パスに書き換え |
| **`settings/docs/` の各引き継ぎ書** | パスを本文で参照している所 | 新パスに書き換え |
| **各フォルダ内の相対パス** | 基本は自己完結。`../` で親を参照している所だけ注意 | 深さが変わるので `../` の数を確認 |

> ⚠️ **`nextjs.org/docs/...`（Next.js 公式URL）や `node_modules/next/dist/docs/`（自動生成）は別物なので触らない。**

---

## ⚠️ 見落としやすい落とし穴

1. **ポータルのカード生成（`portal/build.sh`）は1階層しかスキャンしない**
   `$REPO_ROOT/*/product.meta.json` という glob なので、**ポータルに載るアプリを2階層深く（`xxx/v1/`）に入れると、カードが消える**。
   - 今回の abashiri / anyflow は `product.meta.json` を持たない（=ポータル非掲載）ので影響なし。
   - 将来 houmon-app や design-gallery のような**ポータル掲載アプリ**を親子化する時は、`build.sh` の glob を `*/product.meta.json */*/product.meta.json` のように直すこと。

2. **submodule（houmon-app / nittei-chousei）を動かす時は `.gitmodules` の `path` も直す**
   これらは別リポジトリ。フォルダだけ動かすと submodule が壊れる。今回の対象外。

3. **凍結ブランチ（`abashiri-v1.0` / `anyflow-v1.0`）とパスが食い違う**
   ブランチは消さない。「あの時に戻す」時、旧パス構成のブランチと新パスが混ざる点だけ CLAUDE.md に注記しておく。

4. **node_modules は `git mv` で動かない**（gitignore 対象）
   移動後に古い場所へ取り残される。新フォルダで `npm install` し直すのが確実。

---

## ✅ 仕上げチェックリスト（CLAUDE.md 本番反映チェックリスト準拠）

- [ ] `git branch --show-current` が `main`
- [ ] `git grep` で旧フォルダ名の取りこぼしゼロ
- [ ] 自動デプロイ勢（abashiri-site）の Vercel Root Directory を新パスに変更済み
- [ ] `npx vercel ls` で Error が無い
- [ ] `curl -sI https://abashiri-site.vercel.app`（公開中サイト）が 200
- [ ] `.claude/launch.json` の dev サーバがちゃんと起動する
- [ ] `git status` が origin/main と一致（push 済み）

---

## 🔙 もし失敗したら（切り戻し）

- **フォルダ移動の切り戻し**：`git mv abashiri/v1 abashiri-site` で元に戻せる（履歴も保持）。commit 前なら `git restore --staged . && git checkout .` でもよい
- **Vercel Root Directory の切り戻し**：ダッシュボードで元の値（`abashiri-site`）に戻して Save → 再デプロイ
- push 済みで本番が落ちた場合：Vercel ダッシュボードの Deployments から**直前の Ready なデプロイを「Promote to Production」**で即復旧できる
