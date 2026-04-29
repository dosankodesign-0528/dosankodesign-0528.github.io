import "dotenv/config";
import { google } from "googleapis";
import { createServer } from "node:http";
import { URL } from "node:url";

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

async function main() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env first.");
    process.exit(1);
  }
  const oauth = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
  const url = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
  console.log("\n以下のURLをブラウザで開いて、Googleアカウントで認証してください:\n");
  console.log(url);
  console.log("\n認証が終わるとブラウザがlocalhostに戻ります（このまま待っててOK）\n");

  const code = await waitForCode();
  const { tokens } = await oauth.getToken(code);
  if (!tokens.refresh_token) {
    console.error(
      "\n⚠️ refresh_token が取得できませんでした。Google Cloud Console で OAuth 同意画面の設定を再確認してください。"
    );
    process.exit(1);
  }
  console.log("\n✅ 認証成功！下記をコピーして .env の GMAIL_REFRESH_TOKEN に貼ってください:\n");
  console.log("=".repeat(60));
  console.log(tokens.refresh_token);
  console.log("=".repeat(60));
  console.log("");
}

function waitForCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const reqUrl = new URL(req.url ?? "/", `http://localhost:${PORT}`);
      if (reqUrl.pathname !== "/oauth2callback") {
        res.statusCode = 404;
        res.end("not found");
        return;
      }
      const code = reqUrl.searchParams.get("code");
      const error = reqUrl.searchParams.get("error");
      if (error) {
        res.end(`認証エラー: ${error}\n（このタブは閉じてOKです）`);
        server.close();
        reject(new Error(error));
        return;
      }
      if (!code) {
        res.end("code not found");
        server.close();
        reject(new Error("code missing"));
        return;
      }
      res.end("✅ 認証成功！このタブは閉じてOKです。ターミナルに戻ってください。");
      server.close();
      resolve(code);
    });
    server.listen(PORT, () => {
      console.log(`localhost:${PORT} で認証コールバック待機中...`);
    });
  });
}

main().catch((err) => {
  console.error("auth failed:", err);
  process.exit(1);
});
