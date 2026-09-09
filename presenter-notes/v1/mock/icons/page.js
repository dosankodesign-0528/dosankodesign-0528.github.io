/* 各案ページの中身を組み立てる（実際の画面と同じマークアップ・同じCSSを使う）
 * window.MOCK_SET に 'A' | 'B' | 'C' | 'CURRENT' を入れてから読み込む */

(function () {
  const KEY = window.MOCK_SET;
  const isCur = KEY === 'CURRENT';
  const set = isCur ? { key: 'CURRENT', name: '現状', tagline: '記号・絵文字の文字をそのまま置いている状態', uiSize: 20 } : SETS[KEY];

  // アイコン1個（現状なら文字、案なら新SVG）
  const I = (name, size) => (isCur ? currentIcon(name, size) : icon(KEY, name, size));

  const btn = (name, label, cls) =>
    '<button class="btn ' + (cls || '') + (label ? '' : ' ico') + '">' + I(name) +
    (label ? '<span>' + label + '</span>' : '') + '</button>';

  /* ---------- 上部の切り替えバー ---------- */
  const TABS = [['index.html', '一覧'], ['current.html', '現状'], ['a.html', '案A ライン'], ['b.html', '案B ソリッド'], ['c.html', '案C ボールド']];
  const here = location.pathname.split('/').pop() || 'index.html';
  const bar = '<div class="mk-bar"><div class="mk-wrap"><span class="ttl">アイコン刷新</span>' +
    TABS.map(([h, t]) => '<a class="mk-tab' + (h === here ? ' on' : '') + '" href="' + h + '">' + t + '</a>').join('') +
    '</div></div>';

  /* ---------- ① トップ（カード一覧） ---------- */
  const deck = (nm, pages) =>
    '<div class="deck-card"><div class="deck-thumb"><div class="tt">' + nm + '</div>' +
    '<div class="badge">' + pages + 'ページ</div></div>' +
    '<div class="deck-foot"><span class="nm">' + nm + '</span>' +
    '<span class="menu" title="メニュー">' + I('more', 18) + '</span></div></div>';

  const sceneTop =
    '<div class="mk-shot"><div class="gal-head"><span class="t">スライド</span>' +
      btn('settings', '', 'ghost') + '</div>' +
    '<div class="gal-grid">' +
      deck('NOTdsウェビナー', 48) + deck('anyflow 提案', 22) + deck('網走観光 最終プレゼン', 31) +
      '<div class="deck-card new">' + I('plus', 18) + '<span style="margin-left:8px">新規プレゼン</span></div>' +
    '</div></div>';

  /* ---------- ② エディターの上部バー ---------- */
  const sceneEditor =
    '<div class="mk-shot"><div class="ed-top">' +
      btn('panelLeft', '', 'ghost') +
      btn('notes', '', 'ghost on') +
      '<input class="ed-name" value="NOTdsウェビナー" readonly>' +
      btn('link', 'URL', 'ghost') +
      '<span class="grow"></span>' +
      btn('refresh', '', 'ghost') +
      btn('play', 'プレゼンを開始', 'primary') +
    '</div>' +
    '<div class="mk-stage"><div class="pv-nav ed-pill" style="position:static;transform:none">' +
      '<button class="pv-btn">' + I('prev') + '</button>' +
      '<span class="pv-count">12 / 48</span>' +
      '<button class="pv-btn">' + I('next') + '</button>' +
    '</div></div></div>';

  /* ---------- ③ カンペ（トークスクリプト）ウィンドウ ---------- */
  const sceneNotes =
    '<div class="mk-shot"><div class="notes-top">' +
      '<span class="dot on"></span><span class="grow"></span>' +
      '<div class="font-ctl">' +
        '<button class="btn">A−</button><span class="chip">18px</span><button class="btn">A＋</button>' +
        '<select class="wsel"><option>Light 300</option></select>' +
      '</div>' +
    '</div>' +
    '<div class="mk-stage"><div class="pv-nav" style="position:static;transform:none">' +
      '<button class="pv-btn">' + I('prev') + '</button>' +
      '<span class="pv-count">40 / 48</span>' +
      '<button class="pv-btn">' + I('next') + '</button>' +
    '</div></div>' +
    '<div style="padding:14px 16px;border-top:1px solid var(--line)">' +
      btn('edit', 'このページを編集') +
    '</div></div>';

  /* ---------- ④ サイズ検証 ---------- */
  const strip = (size) => ORDER.map((n) => I(n, size)).join('');
  const sizeCol = (cls, lb) =>
    '<div class="mk-sizecol ' + cls + '"><div class="lb">' + lb + '</div>' +
    [16, 20, 24].map((s) => '<div class="row">' + strip(s) + '</div>').join('') + '</div>';
  const sceneSizes = '<div class="mk-sizes">' + sizeCol('', '暗い背景（本番と同じ）／上から 16px・20px・24px') +
    sizeCol('light', '明るい背景（スライド上に重なった時）') + '</div>';

  /* ---------- ⑤ 現状との1:1比較 ---------- */
  const rows = ORDER.map((n) =>
    '<tr><td class="nm">' + LABELS[n] + '</td>' +
    '<td class="gl"><div class="cell cur">' + currentIcon(n, 20) + '</div></td>' +
    (isCur ? '' : '<td class="gl"><div class="cell">' + icon(KEY, n, 20) + '</div></td>') +
    '</tr>').join('');
  const table =
    '<table class="mk-tbl"><thead><tr><th>用途</th><th>現状（文字）</th>' +
    (isCur ? '' : '<th>' + set.name + '</th>') + '</tr></thead><tbody>' + rows + '</tbody></table>';

  /* ---------- 出力 ---------- */
  document.title = 'アイコン ' + (isCur ? '現状' : '案' + KEY + ' ' + set.name) + '｜スライド';
  document.body.innerHTML = bar + '<div class="mk-wrap">' +
    '<h1 class="mk-h1">' + (isCur ? '現状' : '案' + KEY + '：' + set.name) + '</h1>' +
    '<p class="mk-lead">' + set.tagline + '</p>' +

    '<h2 class="mk-h2"><span class="no">1</span>トップ（プレゼンの一覧）</h2>' +
    '<p class="mk-note">右上の設定と、カード右下のメニュー。</p>' + sceneTop +

    '<h2 class="mk-h2"><span class="no">2</span>エディターの上部バー</h2>' +
    '<p class="mk-note">左から「スライド一覧の開閉」「トークスクリプトの開閉（青＝表示中）」、右に「再取得」「プレゼンを開始」。' +
    '一覧の開閉は<b>左に柱</b>、トークスクリプトの開閉は<b>下に帯</b>で、塗る位置を左右逆にして見分けやすくしています。</p>' + sceneEditor +

    '<h2 class="mk-h2"><span class="no">3</span>トークスクリプトのウィンドウ</h2>' +
    '<p class="mk-note">ページ送りと「このページを編集」。</p>' + sceneNotes +

    '<h2 class="mk-h2"><span class="no">4</span>サイズ・背景の検証</h2>' +
    '<p class="mk-note">小さい方から 16 / 20 / 24px。潰れないか、明るい背景でも読めるかを見てください。</p>' + sceneSizes +

    '<h2 class="mk-h2"><span class="no">5</span>現状との1:1比較</h2>' + table +
    '</div>';
})();
