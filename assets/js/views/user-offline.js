define(function(require) {
  var View = require('views/base');

  var app = require('app');

  var template = require('templates/user-offline');

  var UserOffline = View.Simple.extend({
    events: {
      'click .js-login-offline': 'onClickLogin'
    },

    initialize: function() {
      this.template = template;
      this.render();
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

    onClickLogin: function() {
      this.expectAuth = true;
      var session = app.getSession();
      session.setOffline();
    },

    onAuth: function(result, userView) {
      if(result.isAuth && this.expectAuth) {
        this.expectAuth = false;
        userView.returnToPage();
      }
    }
  });

  return UserOffline;
});
