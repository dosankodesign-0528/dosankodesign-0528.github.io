#!/bin/bash
# portal/build.sh — products.meta.json を自動スキャンしてポータルHTMLを生成
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATE="$REPO_ROOT/portal/index.html"
OUTPUT="$REPO_ROOT/_site/index.html"

mkdir -p "$REPO_ROOT/_site"

# product.meta.json を持つフォルダを収集（古い順にソート）
cards=""
for meta in "$REPO_ROOT"/*/product.meta.json; do
  [ -f "$meta" ] || continue
  dir="$(dirname "$meta")"
  dirname="$(basename "$dir")"

  # JSON からフィールド取得（jq なしで対応）
  get() { python3 -c "import json,sys;d=json.load(open('$meta'));print(d.get('$1',''))" ; }
  name="$(get name)"
  desc="$(get desc)"
  icon="$(get icon)"
  iconBg="$(get iconBg)"
  path="$(get path)"

  # path が空ならフォルダ名から自動生成
  [ -z "$path" ] && path="/$dirname/"

  # git 履歴から制作期間を算出
  is_submodule=false
  if [ -f "$dir/.git" ] || ([ -d "$dir/.git" ] && [ "$dir" != "$REPO_ROOT" ]); then
    is_submodule=true
  fi

  if [ "$is_submodule" = true ]; then
    first_line=$(git -C "$dir" log --format="%at %ai" --reverse 2>/dev/null | head -1)
    last_line=$(git -C "$dir" log --format="%at %ai" 2>/dev/null | head -1)
  else
    first_line=$(git -C "$REPO_ROOT" log --format="%at %ai" --reverse -- "$dirname" 2>/dev/null | head -1)
    last_line=$(git -C "$REPO_ROOT" log --format="%at %ai" -- "$dirname" 2>/dev/null | head -1)
  fi

  if [ -n "$first_line" ] && [ -n "$last_line" ]; then
    ts_first=$(echo "$first_line" | awk '{print $1}')
    ts_last=$(echo "$last_line" | awk '{print $1}')
    date_first=$(echo "$first_line" | awk '{print $2}')
    date_last=$(echo "$last_line" | awk '{print $2}')

    y1=$(echo "$date_first" | cut -d- -f1)
    m1=$(echo "$date_first" | cut -d- -f2 | sed 's/^0//')
    d1=$(echo "$date_first" | cut -d- -f3 | sed 's/^0//')
    m2=$(echo "$date_last" | cut -d- -f2 | sed 's/^0//')
    d2=$(echo "$date_last" | cut -d- -f3 | sed 's/^0//')

    diff=$(( ts_last - ts_first ))
    days=$(( diff / 86400 ))
    hours=$(( (diff % 86400) / 3600 ))
    period="${y1}/${m1}/${d1} → ${m2}/${d2}（${days}日${hours}時間）"
    # ソート用キー（初回タイムスタンプ）
    sort_key="$ts_first"
  else
    period=""
    sort_key="9999999999"
  fi

  # カードHTML を生成
  card="<SORT:${sort_key}>
    <a class=\"product\" href=\"${path}\">
      <div class=\"product-icon\" style=\"background:${iconBg};\">${icon}</div>
      <div class=\"product-info\">
        <div class=\"product-name\">${name}</div>
        <div class=\"product-desc\">${desc}</div>"
  [ -n "$period" ] && card="$card
        <div class=\"product-period\">${period}</div>"
  card="$card
      </div>
      <div class=\"product-arrow\">&#8250;</div>
    </a>"

  cards="$cards
$card"
done

# 初回コミット日でソート（古い順）
sorted_cards=$(echo "$cards" | grep -v '^$' | python3 -c "
import sys
blocks = []
current = []
for line in sys.stdin:
    line = line.rstrip('\n')
    if line.startswith('<SORT:'):
        if current:
            blocks.append(current)
        current = [line]
    else:
        current.append(line)
if current:
    blocks.append(current)
blocks.sort(key=lambda b: int(b[0].split(':')[1].rstrip('>')))
for b in blocks:
    for line in b[1:]:
        print(line)
")

# テンプレートにカードを埋め込み
python3 -c "
import sys
template = open('$TEMPLATE').read()
cards = open('/dev/stdin').read()
result = template.replace('{{PRODUCT_CARDS}}', cards)
with open('$OUTPUT', 'w') as f:
    f.write(result)
" <<< "$sorted_cards"

echo "ポータル生成完了: $(echo "$cards" | grep -c 'class=\"product\"') プロダクト"
