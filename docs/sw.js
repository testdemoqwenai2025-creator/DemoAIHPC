// AIHPC Advanced — Service Worker (Phase 53)
// Caches the core platform files for offline use.
// Strategy: cache-first for static assets, network-first for HTML pages.
// Cache version bumps on every deploy (the SW URL changes).

var CACHE_NAME = 'aihpc-v52-3';
var CORE_ASSETS = [
  // Core HTML pages
  '/DemoAIHPC/',
  '/DemoAIHPC/index.html',
  '/DemoAIHPC/lab.html',
  '/DemoAIHPC/ai-lab.html',
  '/DemoAIHPC/cloud-lab.html',
  '/DemoAIHPC/feeds.html',
  '/DemoAIHPC/concepts.html',
  '/DemoAIHPC/404.html',
  '/DemoAIHPC/audit.html',
  '/DemoAIHPC/timeline.html',
  '/DemoAIHPC/retrospective.html',
  '/DemoAIHPC/component-registry.html',
  '/DemoAIHPC/manifest.json',
  '/DemoAIHPC/icon.svg',
  // Key JS components (the 6 most-used)
  '/DemoAIHPC/scientific-uploader.js',
  '/DemoAIHPC/molecule-3d.js',
  '/DemoAIHPC/bloch-sphere.js',
  '/DemoAIHPC/graph-table-sync.js',
  '/DemoAIHPC/ml-etl.js',
  '/DemoAIHPC/animated-derivation.js',
  // Feeds JSON snapshot
  '/DemoAIHPC/feeds/all.json',
];

// Install: pre-cache core assets
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // Use addAll but catch individual failures (some assets may 404)
      return Promise.allSettled(
        CORE_ASSETS.map(function (url) {
          return cache.add(url).catch(function (err) {
            console.log('[SW] Failed to cache ' + url + ': ' + err.message);
          });
        })
      );
    }).then(function () {
      self.skipWaiting();
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.map(function (name) {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(function () {
      self.clients.claim();
    })
  );
});

// Fetch: cache-first for static assets, network-first for HTML
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return; // let the browser handle cross-origin (CDN, etc.)
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Pyodide CDN (too large to cache — 10MB+ WASM)
  if (url.pathname.indexOf('pyodide') >= 0) {
    return;
  }

  // Skip digest/archive/* pages (too many to cache)
  if (url.pathname.indexOf('/digest/archive/') >= 0) {
    return;
  }

  // Skip concept card pages (126 individual files — too many to cache individually)
  if (url.pathname.indexOf('/concepts/') >= 0 && url.pathname.indexOf('/concepts.html') < 0) {
    return;
  }

  // Strategy: cache-first for .js + .json + .svg, network-first for .html
  var isStaticAsset = /\.(js|json|svg|css|woff2?)($|\?)/.test(url.pathname);

  if (isStaticAsset) {
    // Cache-first: serve from cache if available, else fetch + cache
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        if (cached) {
          // Update cache in background
          fetch(event.request).then(function (resp) {
            if (resp && resp.status === 200) {
              caches.open(CACHE_NAME).then(function (cache) {
                cache.put(event.request, resp.clone());
              });
            }
          }).catch(function () { /* offline — fine */ });
          return cached;
        }
        // Not in cache — fetch + cache
        return fetch(event.request).then(function (resp) {
          if (resp && resp.status === 200) {
            var respClone = resp.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, respClone);
            });
          }
          return resp;
        });
      })
    );
  } else {
    // Network-first for HTML: try network, fall back to cache
    event.respondWith(
      fetch(event.request).then(function (resp) {
        if (resp && resp.status === 200) {
          var respClone = resp.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, respClone);
          });
        }
        return resp;
      }).catch(function () {
        // Offline — serve from cache
        return caches.match(event.request).then(function (cached) {
          if (cached) return cached;
          // If requesting a page that's not cached, serve the 404 page
          return caches.match('/DemoAIHPC/404.html');
        });
      })
    );
  }
});
