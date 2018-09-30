let staticCacheName = "restaurant-review-v2";

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        "/",
        "/index.html",
        "/restaurant.html",
        "/css/styles.css",
        "/js/dbhelper.js",
        "/js/main.js",
        "/js/restaurant_info.js",
        "/js/idb.js",
        "js/sw_registration.js",
        "/img/*",
        "/data/restaurants.json"
      ])
      .catch(function(error) {
        console.log(error);
      });
    }));
});


self.addEventListener ("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith("restaurant-") &&
                  cacheName !== staticCacheName;
        }).map(function(cacheName) {
            console.log("cache removed.");
            return caches.delete(cacheName);
        })
      );
    })
  );
});


self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      }
      else {
        return fetch(event.request);
      }
    })
  );
});
