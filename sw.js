const CACHE_NAME = 'wms-cache-v18';
const urlsToCache = [
  './', 
  './index.html', 
  './style.css', 
  './app.js',
  'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://unpkg.com/html5-qrcode',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 1. 安裝階段：下載新檔案，並強制「立刻」接管網頁 (不等待舊分頁關閉)
self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// 2. 啟動階段 🚨(關鍵修復)🚨：無情刪除所有「非 v14」的舊快取！
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('系統已自動清除舊版快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 強制立刻控制所有開啟中的網頁
  );
});

// 3. 攔截請求：優先使用最新快取，沒有才去網路抓
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
