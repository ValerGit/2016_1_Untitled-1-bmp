define(function(require) {
  var View = require('views/base');
  var app = require('app');
  var alertify = require('alertify');
  var cache = require('cache');

  var template = require('templates/user-login');

  var CACHE_LOGIN_KEY = 'user-login-guest-login';

  var UserLogin = View.Simple.extend({

    events: {
      'click .js-login-guest-submit': 'onSubmitGuest',
      'click .js-login-submit': 'onSubmit'
    },

    initialize: function() {
      this.template = template;
      this.expectAuth = false;
      this.render();

      this.inputs = {};
      _.each(['guest-login', 'login', 'password'], function(classEnd) {
        this.inputs[classEnd] = this.$el.find('.js-login-' + classEnd);
      }.bind(this));

      this.buttons = {};
      _.each(['guest-submit', 'submit'], function(classEnd) {
        this.buttons[classEnd] = this.$el.find('.js-login-' + classEnd);
      }.bind(this));
    },

    render: function() {
      var html = this.template({
        guestLogin: cache.get(CACHE_LOGIN_KEY, '')
      });
      this.$el.html(html);
    },

    show: function() {
      this.$el.show();
    },

    hide: function() {
      this.$el.hide();
    },

    clear: function() {
      _.each(this.inputs, function(item) {
        item.val('');
      });
      this.inputs['guest-login'].val(cache.get(CACHE_LOGIN_KEY, ''));
    },

    clearErrors: function() {
      _.each(this.inputs, function(item) {
        item.removeClass('user-login__field_error');
      });
    },

    handleError: function(error) {
      if(error !== undefined && this.inputs[error.field] !== undefined) {
        this.inputs[error.field].addClass('user-login__field_error');
        alertify.error(error.error);
      }
    },

    blockButtons: function(block) {
      _.each(this.buttons, function(button) {
        button.prop('disabled', block);
      });
    },

    onSubmit: function(e) {
      e.preventDefault();

      var uData = {
        login: this.inputs.login.val(),
        password: this.inputs.password.val()
      };

      this.clearErrors();

      var session = app.getSession();
      var errors = session.validate(uData);

      if(errors != undefined && errors.length) {
        _.each(errors, this.handleError.bind(this));
      }
      else {
        this.blockButtons(true);
        session.once('auth', (function(result) {
          this.blockButtons(false);
          if(!result.result) {
            if(result.error) {
              this.handleError(result.error);
            }
            else {
              alertify.error('Не удалось войти. Может быть, поиграете офлайн?');
            }
          }
          else {
            this.expectAuth = true;
          }
        }).bind(this));

        session.tryLogin(uData.login, uData.password);
      }
    },

    onSubmitGuest: function(e) {
      e.preventDefault();

      var uData = {
        isAnonymous: true,
        login: this.inputs['guest-login'].val()
      };
      cache.set(CACHE_LOGIN_KEY, uData.login);

      var user = app.getUser();

      this.blockButtons(true);
      user.once('register', function(result) {
        this.blockButtons(false);
        if(result.result) {
          this.expectAuth = true;
        }
        else {
          alertify.error('Не удалось войти как гость. Может быть, поиграете офлайн?');
        }
      }.bind(this));

      user.register(uData);
    },

    onAuth: function(result, userView) {
      if(result.isAuth && this.expectAuth) {
        this.expectAuth = false;
        this.clear();
        userView.returnToPage();
      }
    }
  });

  return UserLogin;
});
