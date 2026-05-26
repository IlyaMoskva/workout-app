// Service Worker — кеширует приложение и GIF для офлайна
const CACHE_NAME = 'workout-app-v1';

// Все файлы, которые надо предзагрузить при первой установке
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  // GIF-ки
  './gifs/goblet-squat.gif',
  './gifs/walking-lunge.gif',
  './gifs/glute-bridge.gif',
  './gifs/step-up.gif',
  './gifs/plank.gif',
  './gifs/dead-bug.gif',
  './gifs/cardio.gif',
  './gifs/climbing.gif',
  './gifs/farmers-walk.gif',
  './gifs/kettlebell-swing.gif',
  './gifs/push-up.gif',
  './gifs/side-plank.gif',
  './gifs/light-day.gif',
  './gifs/lat-pulldown.gif',
  './gifs/seated-row.gif',
  './gifs/shoulder-press.gif',
  './gifs/romanian-deadlift.gif',
  './gifs/pallof-press.gif',
  './gifs/hanging-knee-raise.gif',
  './gifs/hike-prep.gif'
];

// Install: предзагружаем всё в кеш
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll() прервётся на первой 404 — поэтому добавляем поштучно,
      // чтобы отсутствие одного GIF не сломало всю установку
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('SW: не смог закешировать', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: чистим старые кеши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first для всего
// (отдаём из кеша моментально, сетью пользуемся только если в кеше нет)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      // Не в кеше — идём в сеть, и на лету добавляем в кеш
      return fetch(event.request).then((response) => {
        // Только успешные ответы кешируем
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Сеть упала и в кеше нет — отдаём что-то осмысленное для GIF
        if (event.request.destination === 'image') {
          return new Response('', { status: 404 });
        }
        throw new Error('Offline and not cached');
      });
    })
  );
});
