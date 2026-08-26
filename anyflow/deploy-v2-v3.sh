#!/bin/bash
# ===== anyflow V2.0 / V3.0 の自動デプロイ =====
# 2026-08-27: Vercel 無料プランの「1日100デプロイ」上限に当たったため、
# 上限がリセットされたら自動で上がるようにしたスクリプト。
#   anyflow/v2 → anyflow-embed-v2 (V2.0 モック版)
#   anyflow/v3 → anyflow-embed-v3 (V3.0 惑星版)
# 成功したら done マーカーを置き、二度と実行しない（何度呼ばれても安全）。

set -u
ROOT="/Users/hideyuki/Developer/Claude Code/anyflow"
LOG="$ROOT/.deploy-v2-v3.log"
DONE="$ROOT/.deploy-v2-v3.done"

say() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

if [ -f "$DONE" ]; then
  say "すでに完了済み（$DONE があるので何もしない）"
  exit 0
fi

deploy_one() {   # $1=ディレクトリ  $2=表示名
  local dir="$1" label="$2" out rc
  cd "$dir" || { say "$label: ディレクトリが無い ($dir)"; return 1; }
  # 誤ったプロジェクトへ上げないよう、毎回リンク先を確認してログに残す
  local proj
  proj=$(python3 -c "import json;print(json.load(open('.vercel/project.json'))['projectName'])" 2>/dev/null)
  say "$label: プロジェクト = ${proj:-不明}"
  out=$(npx vercel --prod --yes 2>&1); rc=$?
  if [ $rc -eq 0 ]; then
    say "$label: デプロイ成功"
    return 0
  fi
  if echo "$out" | grep -q "api-deployments-free-per-day"; then
    say "$label: まだ1日の上限中。次回リトライ"
    return 2
  fi
  say "$label: 失敗 → $(echo "$out" | tail -3 | tr '\n' ' ')"
  return 1
}

say "=== 自動デプロイ開始 ==="
deploy_one "$ROOT/v2" "V2.0(モック版)"; r2=$?
deploy_one "$ROOT/v3" "V3.0(惑星版)";   r3=$?

if [ $r2 -eq 0 ] && [ $r3 -eq 0 ]; then
  # 本番URLが実際に応答するかまで確かめてから完了にする
  c2=$(curl -s -o /dev/null -w "%{http_code}" https://anyflow-embed-v2.vercel.app/)
  c3=$(curl -s -o /dev/null -w "%{http_code}" https://anyflow-embed-v3.vercel.app/)
  say "疎通確認: v2=$c2 / v3=$c3"
  if [ "$c2" = "200" ] && [ "$c3" = "200" ]; then
    date '+%Y-%m-%d %H:%M:%S' > "$DONE"
    say "=== 両方の公開が完了しました ==="
    exit 0
  fi
  say "デプロイは通ったが疎通が 200 ではない。次回もう一度試す"
  exit 1
fi

say "=== まだ完了していない（次回リトライ） ==="
exit 1
