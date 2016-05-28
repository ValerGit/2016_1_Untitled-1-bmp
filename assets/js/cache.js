define(function(require) {
  var isSupported = function(storageName) {
    try {
      return (storageName in window && window[storageName]);
    }
    catch(e) {
      return false;
    }
  };

  var constructCache = function(storageName) {
    if(isSupported(storageName)) {
      var storage = window[storageName];

      var cache = {
        serialize: function(value) {
          return JSON.stringify(value);
        },

        deserialize: function(value) {
          if(typeof value !== 'string') {
            return undefined;
          }

          try {
            return JSON.parse(value);
          }
          catch(e) {
            return value || undefined;
          }
        },

        get: function(key, defaultVal) {
          var val = cache.deserialize(storage.getItem(key));
          return val === undefined ? defaultVal : val;
        },

        set: function(key, value) {
          if(value === undefined) {
            cache.remove(key);
            return;
          }
          storage.setItem(key, cache.serialize(value));
        },

        exists: function(key) {
          return cache.get(key, undefined) !== undefined;
        },

        remove: function(key) {
          storage.removeItem(key);
        },

        clear: function() {
          storage.clear();
        }
      };

      return cache;
    }

    var emptyStorage = {};

    var emptyCache = {
      get: function(key, defaultVal) {
        var val = emptyStorage[key];
        return val === undefined ? defaultVal : val;
      },

      set: function(key, value) {
        if(value === undefined) {
          return emptyCache.remove(key);
        }
        emptyStorage[key] = value;
      },

      exists: function(key) {
        return emptyCache.get(key, undefined) !== undefined;
      },

      remove: function(key) {
        emptyStorage[key] = undefined;
      },

      clear: function() {
        emptyStorage = {};
      }
    };

    return emptyCache;
  };

  return constructCache('localStorage');
});
