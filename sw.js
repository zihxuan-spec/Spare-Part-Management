// 強制版本號升級，破除舊快取
const CACHE_NAME = 'wms-cache-v13';
const urlsToCache = [
  './', 
  './index.html', 
  './style.css', 
  './app.js',
  'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
