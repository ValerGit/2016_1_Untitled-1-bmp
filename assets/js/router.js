define(function (require) {
  var Backbone = require('backbone');
  var app = require('app');
  var alertify = require('alertify');
  var MainView = require('views/main'),
      ScoreboardView = require('views/scoreboard'),
      UserView = require('views/user'),
      RulesView = require('views/rules'),
      GameStartView = require('views/game-start'),
      GameView = require('views/game'),
      GameInitView = require('views/game-init');

  var viewManager;

  var mainView = new MainView();
  var scoreboardView = new ScoreboardView();
  var userView = new UserView();
  var rulesView = new RulesView();
  var gameStartView = new GameStartView();

  var gameProvider = require('models/game/game-provider');

  var loader = require('loader');

  var Router = Backbone.Router.extend({
    routes: {
      'scoreboard': 'scoreboardAction',
      'rules': 'rulesAction',
      'user/:tab': 'userAction',
      'game': 'gameAction',
      '*default': 'defaultAction',
    },

    init: function() {
      viewManager = require('views/manager');

      _.each([mainView,
             scoreboardView,
             userView,
             rulesView,
             gameStartView
      ], function(view) {
        viewManager.addView(view);
      });
    },

    go: function(where) {
      return this.navigate(where, { trigger: true });
    },

    goSilent: function(where) {
      return this.navigate(where, { trigger: false });
    },

    defaultAction: function() {
      mainView.show(loader);
    },

    scoreboardAction: function() {
      scoreboardView.show(loader);
    },

    rulesAction: function() {
      rulesView.show(loader);
    },

    userAction: function(tab) {
      if(app.getAuthData().isAuth) {
        this.go('');
        alertify.error('Вы уже авторизованы, мой дорогой!');
        return;
      }
      userView.show(loader);
      userView.tab(tab);
    },

    gameAction: function() {
      if(!app.getAuthData().isAuth) {
        userView.setReturnPage('game');
        this.go('user/login');
        alertify.message('Авторизуйтесь, чтобы начать игру');
      }
      else {
        var gameInitView = new GameInitView();
        gameInitView.show(loader);
        viewManager.addView(gameInitView);
      }
    },

    gameStartAction: function() {
      gameStartView.show(loader);
    }
  });

  return new Router();
});
