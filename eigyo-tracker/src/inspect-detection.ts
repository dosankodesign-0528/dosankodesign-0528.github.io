/**
 * 判定根拠調査スクリプト：
 *   特定ドメインのメールを Gmail から取得 + status.ts の判定結果を表示。
 *
 * 「自動検知の精度が怪しい」と感じた時に、参照元メールを目視するために使う。
 *
 * 実行: workflow_dispatch (inspect-detection.yml)
 *   入力: TARGET_DOMAINS=recorc.com,to-inc.co.jp
 */
import "dotenv/config";
import { buildGmailClient, fetchMessages, getMyEmail } from "./gmail.js";
import { detectStatusFromMessage } from "./status.js";

async function main() {
  const targets = (process.env.TARGET_DOMAINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (targets.length === 0) {
    throw new Error("TARGET_DOMAINS env required (e.g. 'recorc.com,to-inc.co.jp')");
  }
  const lookbackDays = Number(process.env.LOOKBACK_DAYS ?? "14");

  const gmail = buildGmailClient();
  const myEmail = await getMyEmail(gmail);
  console.log(`[inspect] mailbox: ${myEmail}`);
  console.log(`[inspect] targets: ${targets.join(", ")}`);
  console.log(`[inspect] lookback: ${lookbackDays} 日\n`);

  for (const domain of targets) {
    const query = `(from:${domain} OR to:${domain} OR ${domain})`;
    console.log(`\n========================================`);
    console.log(`🔍 ドメイン: ${domain}`);
    console.log(`========================================`);
    let messages;
    try {
      messages = await fetchMessages(gmail, query, lookbackDays, myEmail, { withBody: true });
    } catch (err: any) {
      console.error(`  fetch error: ${err?.message ?? err}`);
      continue;
    }
    console.log(`  ${messages.length} 通取得`);

    for (const msg of messages) {
      console.log(`\n---`);
      console.log(`📧 件名: ${msg.subject}`);
      console.log(`   From: ${msg.fromAddress} (${msg.fromDomain})`);
      console.log(`   Date: ${msg.date.toISOString()}`);
      console.log(`   Outgoing: ${msg.isOutgoing}`);

      const detection = detectStatusFromMessage(msg);
      if (detection) {
        console.log(`\n🤖 自動検知結果:`);
        console.log(`   signal:  ${detection.signal}`);
        console.log(`   status:  ${detection.status}`);
        console.log(`   reason:  ${detection.reason}`);
        console.log(`   matched: 「${detection.matchedKeyword}」`);
      } else {
        console.log(`\n🤖 自動検知: なし`);
      }

      console.log(`\n📄 snippet:\n${msg.snippet}`);

      if (msg.body) {
        // 本文長すぎる場合は先頭3000字まで
        const bodyPreview = msg.body.length > 3000 ? msg.body.slice(0, 3000) + "\n...(以下省略)" : msg.body;
        console.log(`\n📄 本文:\n${bodyPreview}`);
      } else {
        console.log(`\n📄 本文: (取得していない)`);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
