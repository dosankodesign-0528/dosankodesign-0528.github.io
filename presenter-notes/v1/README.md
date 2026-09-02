# カンペ連動プレゼン（presenter-notes v1）

Figma のスライドを画面共有しながら、手元の**カンペ（トークスクリプト）を
ページ送りに連動**させて出すツール。依存ゼロの静的HTML（index / present / notes）。

- 本番: **https://presenter-notes-seven.vercel.app**
- ローカル: `http://localhost:8780`（`.claude/launch.json` の `presenter-notes`）

📄 **セットアップ・仕組み・使い方・注意点は
[settings/docs/presenter-notes/README.md](../../settings/docs/presenter-notes/README.md) を見る。**

## ざっくり
- `index.html` … 設定（Figma URL・client-id）＋ 各ページの原稿を書く
- `present.html` … Figma 埋め込み。**このウィンドウだけを画面共有**
- `notes.html` … 共有しないカンペ。ページ連動・文字サイズ変更

## 更新（デプロイ）
```bash
cd "/Users/hideyuki/Developer/Claude Code/presenter-notes/v1" && npx vercel --prod --yes
```
