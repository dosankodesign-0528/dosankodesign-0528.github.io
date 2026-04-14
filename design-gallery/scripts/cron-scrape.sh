#!/bin/bash
# デザインギャラリー 自動スクレイピングスクリプト
# cron で定期実行される

LOG_DIR="/Users/hideyuki/Library/CloudStorage/Dropbox/Work/x_others/#practice/Claude Code/design-gallery/scripts/logs"
PROJECT_DIR="/Users/hideyuki/Library/CloudStorage/Dropbox/Work/x_others/#practice/Claude Code/design-gallery"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# ログディレクトリ作成
mkdir -p "$LOG_DIR"

# Node.js パス（nvm等を使ってる場合に必要）
export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node/ 2>/dev/null | tail -1)/bin:$PATH"

echo "[$TIMESTAMP] スクレイピング開始" >> "$LOG_DIR/scrape.log"

cd "$PROJECT_DIR" && npx tsx scripts/scraper.ts >> "$LOG_DIR/scrape_${TIMESTAMP}.log" 2>&1

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo "[$TIMESTAMP] スクレイピング成功" >> "$LOG_DIR/scrape.log"
else
  echo "[$TIMESTAMP] スクレイピング失敗 (exit code: $EXIT_CODE)" >> "$LOG_DIR/scrape.log"
fi

# 古いログを削除（30日以上前）
find "$LOG_DIR" -name "scrape_*.log" -mtime +30 -delete 2>/dev/null
