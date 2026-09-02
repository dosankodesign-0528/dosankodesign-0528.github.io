/* presenter-notes v1 — 共有ヘルパー
 * 3ウィンドウ（設定/発表/カンペ）が localStorage と BroadcastChannel で会話する。
 * localStorage … 設定・複数デッキ（プレゼン）の原稿を保存（本体）
 * BroadcastChannel … 「今このページに来た」等をリアルタイムに飛ばす
 *
 * ■ 何がどこに紐づくか（重要）
 *  - client-id … アカウント（=OAuthアプリ）に1回。どのFigmaプロトでも永久に使い回す。デッキ非依存。
 *  - デッキ（プレゼン）… { name, url(Figmaプロト), scripts(原稿) } を何個でも保存し、切り替えて使う。
 *    → 新しいプレゼンは「デッキを足してURLを貼る」だけ。Figma側の設定はもう触らない。
 */
window.PN = (function () {
  const CHANNEL = 'presenter-notes-v1';
  const K_FONT = 'pn_font';       // カンペの文字サイズ(px)   … 全体設定
  const K_CID = 'pn_client_id';   // Figma OAuthアプリの client-id … 全体設定（デッキ非依存）
  const K_DECKS = 'pn_decks';     // { activeId, order:[id...], decks:{ id:{name,url,scripts} } }
  // 旧バージョンのキー（1組だけ持っていた時代）。読み込んでデッキへ移行する。
  const K_OLD_URL = 'pn_url';
  const K_OLD_SCRIPTS = 'pn_scripts';

  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel(CHANNEL) : null;

  // nodeId の表記ゆれ（"15242-316" と "15242:316"）を ":" 表記に統一する
  function normId(id) { return String(id || '').replace(/-/g, ':').trim(); }
  function uid() { return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function emptyScripts() { return { order: [], cards: {} }; }

  function post(msg) { if (bc) bc.postMessage(msg); }
  function onMessage(fn) { if (bc) bc.addEventListener('message', (e) => fn(e.data)); }

  // ---- 全体設定 ----
  function getClientId() { return (localStorage.getItem(K_CID) || '').trim(); }
  function setClientId(v) { localStorage.setItem(K_CID, (v || '').trim()); }
  function getFont() { return parseInt(localStorage.getItem(K_FONT) || '40', 10); }
  function setFont(px) { localStorage.setItem(K_FONT, String(px)); }

  // ---- デッキ（プレゼン）本体 ----
  function loadDecks() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(K_DECKS)); } catch (e) {}
    if (!d || !d.decks || !Array.isArray(d.order) || !d.order.length) {
      d = migrateOrInit();
    }
    // 壊れ対策：activeId が無ければ先頭
    if (!d.decks[d.activeId]) d.activeId = d.order[0];
    return d;
  }
  function saveDecks(d) { localStorage.setItem(K_DECKS, JSON.stringify(d)); }

  // 旧データ（pn_url / pn_scripts）があればデッキ1へ移行。無ければ空デッキ1個で開始。
  function migrateOrInit() {
    const oldUrl = localStorage.getItem(K_OLD_URL) || '';
    let oldScripts = emptyScripts();
    try {
      const s = JSON.parse(localStorage.getItem(K_OLD_SCRIPTS));
      if (s && Array.isArray(s.order) && s.cards) oldScripts = s;
    } catch (e) {}
    const id = uid();
    const d = { activeId: id, order: [id], decks: {} };
    d.decks[id] = { name: 'プレゼン1', url: oldUrl, scripts: oldScripts };
    saveDecks(d);
    // 旧キーは役目を終えたので掃除（残っても害はないが混乱の元）
    try { localStorage.removeItem(K_OLD_URL); localStorage.removeItem(K_OLD_SCRIPTS); } catch (e) {}
    return d;
  }

  function listDecks() { const d = loadDecks(); return d.order.map((id) => ({ id, name: d.decks[id].name })); }
  function getActiveDeckId() { return loadDecks().activeId; }
  function getActiveDeck() { const d = loadDecks(); const id = d.activeId; return Object.assign({ id }, d.decks[id]); }

  function setActiveDeckId(id) {
    const d = loadDecks();
    if (d.decks[id]) { d.activeId = id; saveDecks(d); post({ type: 'deck-changed', deckId: id }); }
  }
  function createDeck(name) {
    const d = loadDecks();
    const id = uid();
    d.decks[id] = { name: name || ('プレゼン' + (d.order.length + 1)), url: '', scripts: emptyScripts() };
    d.order.push(id);
    d.activeId = id;
    saveDecks(d);
    post({ type: 'deck-changed', deckId: id });
    return id;
  }
  function renameDeck(id, name) {
    const d = loadDecks();
    if (d.decks[id]) { d.decks[id].name = name || d.decks[id].name; saveDecks(d); post({ type: 'decks-updated' }); }
  }
  function deleteDeck(id) {
    const d = loadDecks();
    if (!d.decks[id]) return;
    delete d.decks[id];
    d.order = d.order.filter((x) => x !== id);
    if (!d.order.length) { // 最後の1個を消したら空デッキを作る
      const nid = uid(); d.decks[nid] = { name: 'プレゼン1', url: '', scripts: emptyScripts() }; d.order = [nid]; d.activeId = nid;
    } else if (id === d.activeId) {
      d.activeId = d.order[0];
    }
    saveDecks(d);
    post({ type: 'deck-changed', deckId: d.activeId });
  }

  // ---- アクティブなデッキに対する読み書き（present/notes はこれ経由で正しいデッキを見る）----
  function getUrl() { return getActiveDeck().url || ''; }
  function setUrl(v) {
    const d = loadDecks(); d.decks[d.activeId].url = v || ''; saveDecks(d);
  }
  function loadScripts() {
    const s = getActiveDeck().scripts;
    return (s && Array.isArray(s.order) && s.cards) ? s : emptyScripts();
  }
  function saveScripts(s) {
    const d = loadDecks(); d.decks[d.activeId].scripts = s; saveDecks(d);
  }

  // 新しい nodeId を来た順に登録（無ければ足す）。返り値は 1始まりのページ番号。
  function ensureCard(rawId) {
    const id = normId(rawId);
    if (!id) return -1;
    const s = loadScripts();
    if (!s.order.includes(id)) {
      s.order.push(id);
      s.cards[id] = s.cards[id] || { label: '', script: '' };
      saveScripts(s);
      post({ type: 'scripts-updated' });
    }
    return s.order.indexOf(id) + 1;
  }

  return {
    CHANNEL, normId,
    getClientId, setClientId,
    getFont, setFont,
    // デッキ
    listDecks, getActiveDeck, getActiveDeckId, setActiveDeckId,
    createDeck, renameDeck, deleteDeck,
    // アクティブデッキへの読み書き
    getUrl, setUrl, loadScripts, saveScripts, ensureCard,
    post, onMessage,
  };
})();
