#!/bin/bash
# 本番デプロイ（必ず version.txt を更新してから上げる）
# version.txt が変わると、開いている画面が自動でリロードして最新になる。
set -e
cd "$(dirname "$0")"
date +%s > version.txt
npx vercel --prod --yes 2>&1 | grep -Ei "Aliased:|readyState|Error" | head
echo "version: $(cat version.txt)"
