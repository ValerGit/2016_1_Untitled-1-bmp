define(function(require) {
  var Backbone = require('backbone');

  var router = require('router');
  var app = require('app');

  var cache = require('cache');

  app.start(function() {
    router.init();
    Backbone.history.start();
  });
});
