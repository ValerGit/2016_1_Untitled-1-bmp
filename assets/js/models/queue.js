define(function(require) {
  var Backbone = require('backbone');

  var MAX_HANDLING_NO_ITEM = 6;

  var Queue = Backbone.Model.extend({
    initialize: function(timeout) {
      this.data = [];
      this.offset = 0;

      this.timeout = timeout || 1000;
      this.handling = false;
      this.handlingId = undefined;
      this.handlingNoItem = 0;
    },

    _handle: function() {
      var item = this.pop();
      if(item) {
        this.trigger('handle', item);

        this.handlingNoItem = 0;
        if(!this.handling) {
          // start handling
          this.handlingId = setInterval(this._handle.bind(this), this.timeout);
          this.handling = true;
        }
      }
      else if(this.handling && ++this.handlingNoItem >= MAX_HANDLING_NO_ITEM) {
          // reset timeout because the queue is empty for a long time
          clearInterval(this.handlingId);
          this.handlingId = undefined;
          this.handling = false;
      }
    },

    getLength: function() {
      return this.data.length - this.offset;
    },

    push: function(obj) {
      this.data.push(obj);

      if(!this.handling) {
        this._handle();
      }
    },

    pop: function() {
      if(this.data.length == 0) {
        return undefined;
      }

      var item = this.data[this.offset++];

      if(this.data.length <= this.offset * 2) {
        this.data = this.data.slice(this.offset);
        this.offset = 0;
      }

      return item;
    },

    peek: function() {
      return this.data.length > 0 ? this.data[this.offset] : undefined;
    }
  });

  return Queue;
});
