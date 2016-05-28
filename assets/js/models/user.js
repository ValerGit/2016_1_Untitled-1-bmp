define(function(require) {
  var Backbone = require('backbone');

  var User = Backbone.Model.extend({
    defaults: {
      login: '',
      email: '',
      isAnonymous: false
    },

    urlRoot: '/api/user',

    initialize: function() {
    },

    validate: function(attrs, options) {
      var errors = [];

      var fields = [];
      if(attrs.isAnonymous === undefined || !attrs.isAnonymous) {
        fields.push('login');
        fields.push('email');
      }

      var emailRegexp = /^[-a-z0-9!#$%&'*+/=?^_`{|}~]+(\.[-a-z0-9!#$%&'*+/=?^_`{|}~]+)*@([a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?\.)*(aero|arpa|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|[a-z][a-z])$/;

      _.each(fields, function(v) {
        if(attrs[v] === undefined) {
          attrs[v] =  '';
        }
        attrs[v] = $.trim(attrs[v]);

        if(v === 'login') {
          if(attrs.login === '') {
            errors.push({
              field: 'login',
              error: 'Вы не указали логин'
            });
          }
        }
        else if(v == 'email') {
          if(attrs.email === '') {
            errors.push({
              field: 'email',
              error: 'Вы не указали email'
            });
          }
          else if(!emailRegexp.test(attrs.email)) {
            errors.push({
              field: 'email',
              error: 'Вы указали некорректный email'
            });
          }
        }
      });

      // password is optional
      if(attrs.password != undefined) {
        if(attrs.password.length < 6) {
          errors.push({
            field: 'password',
            error: 'Пароль слишком короткий'
          });
        }
      }

      if(errors.length) {
        return errors;
      }
    },

    register: function(attrs) {
      if(!this.isNew()) {
        return;
      }

      this.save(attrs, {
        success: (function(obj, result) {
          this.trigger('register', {
            result: true,
            id: result.id
          });
        }).bind(this),
        error: (function(obj, result) {
          this.trigger('register', {
            result: false,
            error: result.responseJSON
          });
        }).bind(this)
      });
    }
  });

  return User;
});
