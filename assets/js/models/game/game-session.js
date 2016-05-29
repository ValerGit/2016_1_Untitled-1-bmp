define(function(require) {
  var Backbone = require('backbone');

  var Queue = require('models/queue');

  var GameSession = Backbone.Model.extend({
    initialize: function(provider) {
      this.provider = provider;
      this.listenTo(this.provider, 'connection', this._onConnection.bind(this));
      this.listenTo(this.provider, 'message', this._onMessage.bind(this));

      this.queue = new Queue(700);
      this.listenTo(this.queue, 'handle', this._onHandle.bind(this));

      this.gameOver = false;
    },

    getProps: function() {
      return this.provider.getProps();
    },

    connect: function() {
      return this.provider.connect();
    },

    getStatus: function() {
      return this.provider.requestStatus();
    },

    shoot: function(x, y) {
      return this.provider.requestShoot(x, y);
    },

    giveUp: function() {
      return this.provider.requestGiveUp();
    },

    _onConnection: function(res) {
      console.log('gameSession: connection', res);
      if(!this.gameOver) {
        this.trigger('connection', {
          open: res.open
        });
      }
    },

    _onMessage: function(msg) {
      if(msg.type == 'game_over') {
        this.gameOver = true;
      }
      this.queue.push(msg);
    },

    _onHandle: function(msg) {
      console.log('gameSession: handle', msg);
      this.trigger('message', msg);
    },

    stop: function() {
      this.stopListening();
    }
  });

  return GameSession;
});
