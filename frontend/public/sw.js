// ══════════════════════════════════════════════════════
// 統包先生 Service Worker
// 離線快取 · 推播通知 · 背景同步
// ══════════════════════════════════════════════════════

const CACHE_NAME = 'tongbao-v3';
const ASSETS = [
  './',
  './tongbao_app_complete_final.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&family=DM+Mono:wght@400;500&display=swap',
];

// ── Install：快取核心資源 ──
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] 快取核心資源');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// ── Activate：清除舊快取 ──
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch：離線優先策略 ──
self.addEventListener('fetch', (e) => {
  // API 請求走網路優先
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // 靜態資源走快取優先
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      });
    }).catch(() => {
      // 離線 fallback
      if (e.request.destination === 'document') {
        return caches.match('./tongbao_app_complete_final.html');
      }
    })
  );
});

// ── Push：推播通知 ──
self.addEventListener('push', (e) => {
  let data = { title: '統包先生', body: '您有新的通知', icon: './icon-192.png' };
  if (e.data) {
    try { data = e.data.json(); } catch (_) { data.body = e.data.text(); }
  }
  e.waitUntil(
    self.registration.showNotification(data.title || '統包先生', {
      body: data.body || '',
      icon: data.icon || './icon-192.png',
      badge: './icon-192.png',
      tag: data.tag || 'tongbao-notify',
      data: data.url || './',
      vibrate: [200, 100, 200],
      actions: data.actions || [
        { action: 'open', title: '查看' },
        { action: 'dismiss', title: '關閉' },
      ],
    })
  );
});

// ── 通知點擊 ──
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => {
      for (const client of list) {
        if (client.url.includes('tongbao') && 'focus' in client) return client.focus();
      }
      return clients.openWindow(e.notification.data || './');
    })
  );
});

// ── 背景同步（打卡離線暫存）──
self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-checkins') {
    e.waitUntil(syncCheckins());
  }
  if (e.tag === 'sync-logs') {
    e.waitUntil(syncLogs());
  }
});

async function syncCheckins() {
  // 未來從 IndexedDB 讀取離線打卡，上傳後端
  console.log('[SW] 同步離線打卡紀錄');
}

async function syncLogs() {
  console.log('[SW] 同步離線工程日誌');
}
