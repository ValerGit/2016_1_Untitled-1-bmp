define(function(require) {
  var View = require('views/base');
  var app = require('app');
  var alertify = require('alertify');

  var template = require('templates/user-signup');

  var UserSignup = View.Simple.extend({
    events: {
      'click .js-signup-submit': 'onSubmit'
    },

    initialize: function() {
      this.template = template;
      this.expectAuth = false;
      this.render();

      this.inputs = {};
      _.each(['login', 'password', 'email'], function(classEnd) {
        this.inputs[classEnd] = this.$el.find('.js-signup-' + classEnd);
      }.bind(this));

      this.button = this.$el.find('.js-signup-submit');
    },

    render: function() {
      var html = this.template();
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
    },

    clearErrors: function() {
      _.each(this.inputs, function(item) {
        item.removeClass('user-signup__field_error');
      });
    },

    handleError: function(error) {
      if(this.inputs[error.field] !== undefined) {
        this.inputs[error.field].addClass('user-signup__field_error');
        alertify.error(error.error);
      }
    },

    blockButton: function(block) {
      this.button.prop('disabled', block);
    },

    onSubmit: function(e) {
      e.preventDefault();

      var uData = {
        login: this.inputs.login.val(),
        password: this.inputs.password.val(),
        email: this.inputs.email.val()
      };

      this.clearErrors();

      var user = app.getUser();
      var errors = user.validate(uData);

      if(errors != undefined && errors.length) {
        _.each(errors, this.handleError.bind(this));
      }
      else {
        this.blockButton(true);
        user.once('register', (function(result) {
          this.blockButton(false);
          if(!result.result) {
            if(result.error) {
              this.handleError(result.error);
            }
            else {
              alertify.error('Не удалось зарегистрироваться. Может быть, поиграете офлайн?');
            }
          }
          else {
            this.expectAuth = true;
          }
        }).bind(this));

        user.register(uData);
      }
    },

    onAuth: function(result, userView) {
      if(result.isAuth && this.expectAuth) {
        this.expectAuth = false;
        this.clear();
        userView.returnToPage();
      }
    }
  });

  return UserSignup;
});

