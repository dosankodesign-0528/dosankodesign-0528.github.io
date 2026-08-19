#!/bin/bash
# anyflow-embed-v2 本番デプロイの自動リトライ（Vercel無料枠の日次上限待ち・2026-08-19）
# 30分ごとに試行 → 成功して新版(v=9)を確認できたら Mac 通知を出して自分自身を削除する
cd "/Users/hideyuki/Developer/Claude Code/anyflow-embed-v2" || exit 1
LOG="/Users/hideyuki/Developer/Claude Code/anyflow-embed-v2/.deploy-retry.log"
for i in $(seq 1 48); do
  echo "[$(date '+%m/%d %H:%M')] 試行 $i 回目" >> "$LOG"
  OUT=$(npx vercel --prod --yes 2>&1)
  if echo "$OUT" | grep -qi "ready"; then
    sleep 10
    if curl -s https://anyflow-embed-v2.vercel.app/kv/ | grep -q 'engine.js?v=9'; then
      echo "[$(date '+%m/%d %H:%M')] ✅ デプロイ成功・v9 反映を確認" >> "$LOG"
      osascript -e 'display notification "アイコンアニメの新版が本番に反映されました" with title "anyflow-embed-v2 デプロイ完了" sound name "Glass"'
      rm -f "$0"
      exit 0
    fi
    echo "[$(date '+%m/%d %H:%M')] Readyだがv9未確認。継続" >> "$LOG"
  else
    echo "$OUT" | tail -1 >> "$LOG"
  fi
  sleep 1800
done
echo "[$(date '+%m/%d %H:%M')] ❌ 24時間リトライしても未達。手動対応が必要" >> "$LOG"
osascript -e 'display notification "24時間リトライしても反映できませんでした。Claudeに声をかけてください" with title "anyflow-embed-v2 デプロイ失敗" sound name "Basso"'
