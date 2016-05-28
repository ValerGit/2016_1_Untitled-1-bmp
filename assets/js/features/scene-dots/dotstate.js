define(function (require) {
  var props = ['x', 'y', 'radius', 'alpha'];

  var DotState = function(args) {
    _.each(props, (function(prop) {
      this[prop] = args[prop];
    }).bind(this));
  };

  DotState.distance = function(state1, state2) {
    var dx = state1.x - state2.x;
    var dy = state1.y - state2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  DotState.diff = function(state1, state2) {
    var diff = {};
    _.each(props, (function(prop) {
      diff[prop] = state1[prop] - state2[prop];
    }));
    diff.distance = DotState.distance(state1, state2);
    return diff;
  };

  DotState.prototype = {
    // if some fields are missing, get them from current
    defaults: function(current) {
      _.each(props, (function(prop) {
        this[prop] = this[prop] || current[prop];
      }).bind(this));
    },

    // extend current with news
    set: function(news) {
      _.extend(this, news);
    },

    distance: function(state) {
      return DotState.distance(this, state);
    },

    diff: function(state) {
      return DotState.diff(this, state);
    },

    clone: function() {
      return new DotState(this);
    }
  };

  return DotState;
});
