/**
 * Box Room - service worker
 *
 * This is what makes the app open instantly with no network. The shell
 * (HTML, CSS, icons, fonts) is stored on the device; only the box data
 * ever goes over the wire, and never through this cache.
 *
 * Bump SHELL_CACHE when you change index.html, or devices will keep
 * serving the old copy. The app shows a "new version ready" bar when a
 * new worker installs.
 */

var SHELL_CACHE = 'boxroom-shell-v2.3.1';   // ex-GST labelling
var FONT_CACHE  = 'boxroom-fonts-v1';
var KEEP = [SHELL_CACHE, FONT_CACHE];

var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './logo.png',
  './icon-192-v2.png',
  './icon-512-v2.png',
  './icon-maskable-512-v2.png'
];

// Add entries one at a time: a single 404 must not fail the whole install
// and leave the app with no offline copy at all.
function precache(cache){
  return Promise.all(SHELL.map(function(url){
    return cache.add(new Request(url, { cache: 'reload' })).catch(function(){ /* skip */ });
  }));
}

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(precache)
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(keys.map(function(k){
          return KEEP.indexOf(k) === -1 ? caches.delete(k) : null;
        }));
      })
      .then(function(){ return self.clients.claim(); })
  );
});

function isDataEndpoint(url){
  return url.hostname.indexOf('script.google') !== -1
      || url.hostname.indexOf('script.googleusercontent') !== -1
      || url.hostname.indexOf('googleusercontent.com') !== -1;
}

// Fonts: serve from cache at once, refresh in the background.
function fontStrategy(request){
  return caches.open(FONT_CACHE).then(function(cache){
    return cache.match(request).then(function(hit){
      var network = fetch(request).then(function(res){
        if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
        return res;
      }).catch(function(){ return hit; });
      return hit || network;
    });
  });
}

function shellStrategy(request){
  return caches.open(SHELL_CACHE).then(function(cache){
    return cache.match(request, { ignoreSearch: true }).then(function(hit){
      if (hit) return hit;
      return fetch(request).then(function(res){
        if (res && res.ok) cache.put(request, res.clone());
        return res;
      });
    });
  });
}

self.addEventListener('fetch', function(event){
  var request = event.request;
  if (request.method !== 'GET') return;         // sheet writes go straight to the network

  var url;
  try { url = new URL(request.url); } catch (e) { return; }

  // The box data must never be served from a cache - stale stock counts
  // are worse than a spinner. Let the app's own queue handle failures.
  if (isDataEndpoint(url)) return;

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(fontStrategy(request));
    return;
  }

  // Opening the app: always answer from the cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(SHELL_CACHE)
        .then(function(cache){ return cache.match('./index.html'); })
        .then(function(hit){ return hit || fetch(request); })
        .catch(function(){ return fetch(request); })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(shellStrategy(request));
  }
});
