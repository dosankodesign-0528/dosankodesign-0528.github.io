# 網走観光サイト（な〜んにもない たまらない）

Next.js 製の観光サイト。トップのキービジュアルは、吹き出し → 「な〜んにもない」→
「たまらない」→ ボタン → 人物イラスト、の順に出てくる登場アニメーションで構成されている。

## ローカルで動かす

```bash
npm install
npm run dev
```

http://localhost:3000 を開く。

## 本番

- URL: https://abashiri-site.vercel.app
- Vercel Project: `abashiri-site`（Root Directory = `abashiri-site`）
- **`main` に push すると自動でデプロイされる**（2026-08-14 に Git 連携を設定）

手動で上げ直したい時は、リポジトリのどこからでも:

```bash
npx vercel redeploy abashiri-site.vercel.app
```

> ⚠️ このディレクトリの中で `npx vercel --prod` を叩くと、Vercel 側の Root Directory と
> 二重になって失敗する。詳細は [../docs/VERCEL-PROJECTS.md](../docs/VERCEL-PROJECTS.md)。

## 演出まわりの調整ファイル

数値をいじるだけで動きを変えられるように、パラメーターは設定ファイルに切り出してある。

| ファイル | 何を決めているか |
|---|---|
| [components/heroTiming.ts](components/heroTiming.ts) | 登場演出全体のタイミング（何秒後に何が出るか） |
| [components/bubbleConfig.ts](components/bubbleConfig.ts) | 吹き出しの形の補正、しっぽが伸びる演出、ムニムニ |
| [components/layoutConfig.ts](components/layoutConfig.ts) | キービジュアルの配置 |
| [components/birdConfig.ts](components/birdConfig.ts) | カモメの位置とふわふわ |

## 比較用モックページ

`/mock/` 配下は認証不要で、実機（iPhone）で開いて触れる比較ページ。
採用案が決まったら不採用のモックは消す。

| URL | 中身 |
|---|---|
| `/mock/tail` | 吹き出しのしっぽが伸びる演出（5案） |
| `/mock/bubble` | 吹き出しのムニムニ（3案） |
| `/mock/bubble/tune` | 吹き出しの数値を触りながら確認する調整パネル |
| `/mock/tune` | 登場タイミングの調整パネル |
| `/mock/illust` | 人物イラストのスイング |
| `/mock/kv` / `/mock/layout` / `/mock/shadow` / `/mock/bird` | キービジュアル各種 |
