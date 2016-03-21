define(function(require) {
  var Backbone = require('backbone');
  var template = require('templates/main');

  var MainView = Backbone.View.extend({
    initialize: function() {
      this.template = template;
      this.render();
    },

    render: function() {
      var html = this.template();
      this.$el.html(html);
    },

    show: function(parent) {
      this.trigger('show')
      parent.html(this.el);
    },

    hide: function() {
    }
  });

  return MainView;
});
