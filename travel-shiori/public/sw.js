// ========================================
// Service Worker - オフライン対応
// 一度開いたページをスマホ内にキャッシュして、
// 電波がない場所でも表示できるようにする
// ========================================

const CACHE_NAME = 'travel-shiori-v1';

// アプリ起動時にキャッシュに保存するファイル一覧
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

// Service Workerがインストールされた時（初回アクセス時）
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// 古いキャッシュを削除（アップデート時）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ページやファイルを取得する時の処理
// まずネットから取得を試み、失敗したらキャッシュから返す（オフライン対応）
self.addEventListener('fetch', (event) => {
  // APIリクエストやPOSTはキャッシュしない
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 成功したらキャッシュに保存して返す
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // ネット接続できない場合はキャッシュから返す
        return caches.match(event.request);
      })
  );
});
