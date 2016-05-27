var CACHE_NAME = 'sea-battle-cache-v0';

var isOffline = false;

var offlineResponse = function(result) {
  isOffline = true;

  return new Response(
    JSON.stringify(result),
    { status: 200, statusText: "OK", headers: { 'Content-Type': 'application/json' } }
  );
};

var offlineSessionResponse = function() {
  var body = { id: 'offline', isOffline: true };
  return offlineResponse(body);
};

var offlineUserResponse = function() {
  var body = { id: 'offline', login: 'Гость', score: 0, isAnonymous: true, isOffline: true };
  return offlineResponse(body);
};

this.addEventListener('fetch', function(event) {
  var url = event.request.url;
  var requestClone = event.request.clone();

  event.respondWith(
    caches.match(event.request).then(function(response) {
      if(response) {
        return response;
      }

      if(/\/api\/session/.test(url)) {
        return fetch(event.request).then(function(response) {
          if(!response || !(response.status == 200 || response.status == 401 || response.status == 400)) {
            throw Error('Offline');
          }
          return response;
        }).catch(offlineSessionResponse);
      }

      if(/\/api\/user\/offline/.test(url)) {
        return offlineUserResponse();
      }

      return fetch(event.request);
    })
  );
});

this.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([
        '/img/favicon/favicon-grey-64.ico',
        '/css/main.css',
        '/js/vendor/require.js',
        '/js/config.js',
        '/js/main.min.js',
        '/fonts/glyphicons-halflings-regular.woff2',
        '/img/logo/logo.svg'
      ]);
    })
  );
});

this.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (cacheWhitelist.indexOf(key) === -1) {
          return caches.delete(key);
        }
      }));
    })
  );
});
