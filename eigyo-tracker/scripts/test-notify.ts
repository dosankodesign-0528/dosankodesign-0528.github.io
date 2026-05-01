import "dotenv/config";
import { buildNotionClient } from "../src/notion.js";
import { notifyMention } from "../src/notify.js";

async function main() {
  const notion = buildNotionClient();
  await notifyMention(notion, {
    title: "✅ 営業同期 通知テスト",
    summary: "通知システムが正しく動作することを確認するためのテストメッセージです。本番では新規追加・月次レポートのタイミングで届きます。",
    entries: [
      { name: "テスト株式会社A", mediaTag: "Wantedly" },
      { name: "テスト株式会社B", mediaTag: "問合せフォーム" },
      { name: "テスト株式会社C", mediaTag: "直営業" },
    ],
    linkUrl: "https://www.notion.so/dosankodesign/18919c93bf124d92b8675ef9c32fb7b3",
    linkLabel: "▶ 企業リストDBへ",
  });
}

main().catch((err) => {
  console.error(err?.body ?? err);
  process.exit(1);
});
