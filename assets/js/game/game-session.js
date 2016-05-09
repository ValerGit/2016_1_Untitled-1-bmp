define(function(require) {
  var Backbone = require('Backbone');
  var _ = require('underscore');

  var app = require('app');

  var GameSession = Backbone.Model.extend({
    initialize: function(props) {
      this.set('state', GameSession.STATE_NOT_STARTED);
      this.props = props;
    },

    getGameFieldProperties: function() {
      return this.props;
    },

    isNotStarted: function() {
      return this.get('state') == GameSession.STATE_NOT_STARTED;
    },

    isStarted: function() {
      return this.get('state') == GameSession.STATE_STARTED;
    },

    isFinished: function() {
      return this.get('state') == GameSession.STATE_FINISHED;
    },

    getCurrentUser: function() {
      return this.currentUser;
    },

    getCurrentField: function() {
      return this.currentUser.getField();
    },

    getOpponentUser: function() {
      return this.opponentUser;
    },

    getOpponentField: function() {
      return this.opponentUser.getField();
    },

    isCurrentTurn: function() {
    },

    shoot: function(x, y) {
    },

    giveUp: function() {
    },

    onGameStart: function() {
    },

    onGameTurn: function() {
    },

    onGameOver: function() {
    },

    onShootResult: function() {
    },

    onGameStatus: function() {
    },

    onOpponentOnline: function() {
    },

    onError: function() {
    }
  });

  GameSession.STATE_NOT_STARTED = 'not_started';
  GameSession.STATE_STARTED = 'started';
  GameSession.STATE_FINISHED = 'finished';

  return GameSession;
});
