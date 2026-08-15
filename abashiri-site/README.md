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
| [components/browConfig.ts](components/browConfig.ts) | 人物イラストの眉毛ピクッ（動く量・テンポ・左右） |

## 人物イラストがベクターになっている理由

右下の「たまんねーっ」の人物は、もとは 1枚のPNGだったので眉毛だけ動かせなかった。
いまは [components/illustMainPaths.ts](components/illustMainPaths.ts) にベクター化して
持っていて、**眉毛だけ別レイヤー**になっている。眉が上にずれても下から肌色の
レイヤーが出てくるので、眉があった跡は残らない。

眉毛はキラキラ（`.sparkle-hop`）と `--hop-cycle` を共有していて、必ず同じ瞬間に
パキッと切り替わる。動きの量は `browConfig.ts` の `lift`（画面上のpx）。

イラストを描き直した時は [scripts/illust-trace.py](scripts/illust-trace.py) で
`illustMainPaths.ts` を作り直す（手で書き換えない）。もとのPNGは
`public/img/illust-main.png` に残してある。横顔の「ぼーっ」はPNGのまま。

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
| `/mock/brow` | 眉毛ピクッの調整パネル（顔を拡大した確認窓つき） |
| `/mock/kv` / `/mock/layout` / `/mock/shadow` / `/mock/bird` | キービジュアル各種 |
