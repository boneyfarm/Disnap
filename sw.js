self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('distancesnap-v1').then(cache => cache.addAll([
      '/',
      '/index.html',
      '/script.js',
      '/manifest.json'
    ]))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});