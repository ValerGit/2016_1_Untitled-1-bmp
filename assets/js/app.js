define(function(require) {
  var Backbone = require('backbone');
  var Session = require('models/session');
  var User = require('models/user');

  var App = Backbone.Model.extend({
    session: new Session(),
    user: new User(),
    offline: false,

    initialize: function() {
      this.listenTo(this.session, 'auth', this._onAuth.bind(this));
      this.listenTo(this.session, 'logout', this._onLogout.bind(this));
      this.listenTo(this.session, 'offline', this._onOffline.bind(this));

      this.listenTo(this.user, 'register', this._onRegister.bind(this));
    },

    start: function(cb) {
      this.session.check(cb);
    },

    getSession: function() {
      return this.session;
    },

    getUser: function() {
      return this.user;
    },

    isOffline: function() {
      return this.offline;
    },

    getAuthData: function() {
      return {
        isAuth: this.session.isAuthorized(),
        user: this.user
      };
    },

    _onAuth: function(result) {
      if(result.result) {
        if(result.id == 'offline' && this.offline) {
          this.user.set('id', 'offline');
          this.user.set('login', 'Гость');
          this.user.set('score', require('cache').get('user-is-offline-score', 0));
          this.user.set('isAnonymous', true);
          this.user.set('isOffline', true);
          this.trigger('auth', this.getAuthData());
          return;
        }

        this.user.set('id', result.id);
        this.user.fetch({
          success: (function() {
            this.trigger('auth', this.getAuthData());
          }).bind(this)
        });
      }
    },

    _onLogout: function() {
      this.user.clear();
      this.session.clear();
      this.trigger('auth', this.getAuthData());
    },

    _onOffline: function() {
      this.offline = true;
    },

    _onRegister: function() {
      this.session.check();
    }
  });

  return new App();
});
