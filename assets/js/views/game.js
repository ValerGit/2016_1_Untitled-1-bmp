define(function(require) {
  var Backbone = require('backbone');

  var GameView = Backbone.View.extend({
    initialize: function() {
      this.template = require('templates/game');
      this.render();
    },

    render: function() {
      var html = this.template({
        size: 10
      });
      this.$el.html(html);
    }
  });

  return new GameView();
});
