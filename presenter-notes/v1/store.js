/* presenter-notes v1 — 共有ヘルパー
 * 3ウィンドウ（設定/発表/カンペ）が localStorage と BroadcastChannel で会話する。
 * localStorage … 原稿・設定を保存（本体）
 * BroadcastChannel … 「今このページに来た」等をリアルタイムに飛ばす
 */
window.PN = (function () {
  const CHANNEL = 'presenter-notes-v1';
  const K_URL = 'pn_url';        // Figma プロトタイプ共有URL
  const K_SCRIPTS = 'pn_scripts'; // { order:[nodeId...], cards:{ nodeId:{label, script} } }
  const K_FONT = 'pn_font';      // カンペの文字サイズ(px)
  const K_CID = 'pn_client_id';  // Figma OAuthアプリの client-id（連動に必須）

  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel(CHANNEL) : null;

  // nodeId の表記ゆれ（"15242-316" と "15242:316"）を ":" 表記に統一する
  function normId(id) { return String(id || '').replace(/-/g, ':').trim(); }

  function getUrl() { return localStorage.getItem(K_URL) || ''; }
  function setUrl(v) { localStorage.setItem(K_URL, v || ''); }

  function getClientId() { return (localStorage.getItem(K_CID) || '').trim(); }
  function setClientId(v) { localStorage.setItem(K_CID, (v || '').trim()); }

  function loadScripts() {
    try {
      const s = JSON.parse(localStorage.getItem(K_SCRIPTS));
      if (s && Array.isArray(s.order) && s.cards) return s;
    } catch (e) {}
    return { order: [], cards: {} };
  }
  function saveScripts(s) {
    localStorage.setItem(K_SCRIPTS, JSON.stringify(s));
  }

  function getFont() { return parseInt(localStorage.getItem(K_FONT) || '40', 10); }
  function setFont(px) { localStorage.setItem(K_FONT, String(px)); }

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

  function post(msg) { if (bc) bc.postMessage(msg); }
  function onMessage(fn) { if (bc) bc.addEventListener('message', (e) => fn(e.data)); }

  return {
    CHANNEL, normId,
    getUrl, setUrl,
    getClientId, setClientId,
    loadScripts, saveScripts,
    getFont, setFont,
    ensureCard, post, onMessage,
  };
})();
