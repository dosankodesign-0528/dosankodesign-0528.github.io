'use client';

/**
 * Service Workerを登録するコンポーネント
 * ページに置くだけで、バックグラウンドでService Workerが有効になる
 */

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service Worker登録に失敗しても、アプリ自体は普通に動く
      });
    }
  }, []);

  return null; // 画面には何も表示しない
}
