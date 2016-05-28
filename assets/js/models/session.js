define(function(require) {
  var Backbone = require('backbone');

  var cache = require('cache');

  var CACHE_IS_OFFLINE_KEY = 'session-is-offline';

  var Session = Backbone.Model.extend({
    defaults: {
      auth: false
    },

    url: '/api/session',

    initialize: function() {
    },

    validate: function(attrs, options) {
      var errors = [];

      _.each(['login', 'password'], function(v) {
        if(attrs[v] === undefined) {
          attrs[v] =  '';
        }
        attrs[v] = $.trim(attrs[v]);
      });

      if(attrs.login === '') {
        errors.push({
          field: 'login',
          error: 'Логин не указан'
        });
      }

      if(attrs.password.length == 0) {
        errors.push({
          field: 'password',
          error: 'Пароль не указан'
        });
      }

      if(errors.length) {
        return errors;
      }
    },

    check: function(cb) {
      cb = cb || function() {};

      if(cache.get(CACHE_IS_OFFLINE_KEY)) {
        this.setOffline(cb);
        return;
      }

      this.set('id', null);
      this.fetch({
        success: (function(obj, result) {
          this.set('auth', true);

          if(result.isOffline) {
            this.trigger('offline');
          }

          this.trigger('auth', {
            result: true,
            id: result.id
          });
          cb();
        }).bind(this),
        error: (function(obj, result) {
          this.set('auth', false);
          cb();
        }).bind(this)
      });
    },

    setOffline: function(cb) {
      cb = cb || function() {};

      if(this.get('auth')) {
        return;
      }

      this.set('auth', true);
      this.trigger('offline');
      this.trigger('auth', {
        result: true,
        id: 'offline'
      });
      cache.set(CACHE_IS_OFFLINE_KEY, true);
      cb();
    },

    isAuthorized: function() {
      return !!this.get('auth');
    },

    tryLogin: function(login, password) {
      if(!this.isNew()) {
        return;
      }

      this.save({
        login: login,
        password: password
      }, {
        success: (function(obj, result) {
          this.set('auth', true);
          this.trigger('auth', {
            result: true,
            id: result.id
          });
        }).bind(this),
        error: (function(obj, result) {
          this.set('auth', false);
          this.trigger('auth', {
            result: false,
            error: result.responseJSON
          });
        }).bind(this)
      });
    },

    logout: function() {
      if(cache.get(CACHE_IS_OFFLINE_KEY)) {
        this.set('auth', false);
        this.trigger('logout');
        cache.remove(CACHE_IS_OFFLINE_KEY);
        return;
      }

      this.destroy({
        success: (function(data) {
          this.set('auth', false);
          this.trigger('logout');
        }).bind(this)
      });
    }
  });

  return Session;
});

