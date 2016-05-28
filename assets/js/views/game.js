define(function(require) {
  var View = require('views/base');
  var template = require('templates/game');
  var fieldView = require('views/game-field');

  var scene = require('features/scene-chaos');

  var alertify = require('alertify');

  var cache = require('cache');

  var CACHE_LAST_SHOOT = 'game-last-shoot';

  var CONNECTION_TRIES_MAX = 15;

  var GameView = View.Page.extend({

    events: {
      'click .js-giveup': 'onClickGiveUp',
      'click .js-reload': 'onClickReload'
    },

    messages: {
      'game_init': 'onMessageInit',
      'game_start': 'onMessageStart',
      'game_turn': 'onMessageTurn',
      'game_over': 'onMessageOver',
      'shoot_result': 'onMessageShoot',
      'error': 'onMessageError',
      'game_status': 'onMessageStatus',
      'opponent_online': 'onMessageOpponent',
      'game_too_long': 'onMessageTooLong'
    },

    gameSession: undefined,

    connectionTries: 0,

    initialize: function() {
      this.template = template;
      this.fieldView = fieldView;
    },

    setGameSession: function(gameSession) {
      this.gameSession = gameSession;

      this.listenTo(this.gameSession, 'connection', this.onConnection.bind(this));
      this.listenTo(this.gameSession, 'message', this.onMessage.bind(this));

      this.render();
    },

    render: function() {
      var html = this.template();
      this.$el.html(html);

      this.fieldViewMy = new this.fieldView(this.gameSession.getProps());
      this.fieldViewMy.show();
      this.fieldViewMy.setCaption('Твое поле');
      this.fieldViewOpponent = new this.fieldView(this.gameSession.getProps());
      this.fieldViewOpponent.show();
      this.fieldViewOpponent.setCaption('Поле соперника');

      this.fieldViewOpponent.on('shoot', this.onShoot.bind(this));

      this.$el.find('.js-field-my').empty().append(this.fieldViewMy.$el);
      this.$el.find('.js-field-opponent').empty().append(this.fieldViewOpponent.$el);

      this.$status = this.$el.find('.js-status');
      this.setStatus('Загрузка...');

      this.scene = scene(this.$el.find('.scene-chaos'));

      this.isRendered = true;
    },

    show: function(loader) {
      if(this.isShown) return;

      loader(function(cb) {
        this.trigger('show');

        if(!this.isRendered) this.render();

        this.scene.start();

        this.$el.show();
        this.isShown = true;
        cb();
      }.bind(this));
    },

    hide: function() {
      this.$el.hide();
      this.isShown = false;

      if(this.scene) {
        this.scene.stop();
      }
    },

    setStatus: function(status) {
      this.$status.html(status);
    },

    onClickGiveUp: function(e) {
      e.preventDefault();

      alertify.confirm('Сдаться',
                      'Игра будет считаться проигранной. Вы уверены, что хотите сдаться?',
                      function() {
                        this.gameSession.giveUp();
                      }.bind(this), function() {
                      });
    },

    onClickReload: function(e) {
      e.preventDefault();
      location.reload();
    },

    onConnection: function(res) {
      if(!res.open) {
        if(++this.connectionTries >= CONNECTION_TRIES_MAX) {
          alertify.error('Соединение с сервером разорвано. Для продолжения игры обновите страницу.');
          var $a = $('<a/>').attr('href', '#').text('обновите страницу');
          this.setStatus($('<div/>').append('Соединение с сервером разорвано. Для продолжения игры ', $a).html());
          this.stopListening(this.gameSession);
          this.gameSession.stop();
        }
        else {
          this.setStatus('Соединение с сервером потеряно. Пытаемся восстановить...');
          _.debounce(this.gameSession.connect.bind(this.gameSession), 1000)();
        }
      }
      else {
        if(this.connectionTries > 0) {
          this.setStatus('Соединение с сервером восстановлено. Восстанавливаем игру...');
          this.connectionTries = 0;
          this.gameSession.getStatus();
        }
      }
    },

    onMessage: function(msg) {
      if(msg && msg.type) {
        var method = this.messages[msg.type];
        if(typeof this[method] === 'function') {
          this[method].call(this, msg);
        }
      }
    },

    onMessageInit: function(msg) {
      cache.remove(CACHE_LAST_SHOOT);
      if(msg.ok) {
        this.setStatus('Ожидаем соперника...');
      }
      else {
        var $a = $('<a/>').attr('href', '#').text('Вернуться в главное меню');
        this.setStatus($('<div/>').append('Не удалось начать игру. ', $a).html());
      }
    },

    onMessageStart: function(msg) {
      this.setStatus('Начинаем игру...');
      if(msg.opponentName) {
        this.fieldViewOpponent.setCaption('Поле ' + msg.opponentName);
      }
    },

    onMessageTurn: function(msg) {
      if(this.scene) this.scene.action();
      this.fieldViewOpponent.setActive(msg.ok);
      this.$el.find('.js-field-my').toggleClass('page-game__field_active', !msg.ok);
      this.$el.find('.js-field-opponent').toggleClass('page-game__field_active', msg.ok);
      if(msg.ok) {
        this.setStatus('Твой ход');

        var cell = cache.get(CACHE_LAST_SHOOT);
        if(cell) {
          this.fieldViewOpponent.getCell(cell.x, cell.y).click();
        }
      }
      else {
        this.setStatus('Ход соперника');
      }
    },

    onMessageOver: function(msg) {
      this.stopListening(this.gameSession);
      this.gameSession.stop();

      cache.remove(CACHE_LAST_SHOOT);

      var result = msg.ok ? 'Вы победили!' : 'Вы проиграли!';
      var router = require('router');

      alertify.alert('Конец игры', result,
                    function() {
                      router.go('');
                    }.bind(this));

      if(msg.score) {
        var app = require('app');
        app.getUser().set('score', msg.score);
      }
    },

    onMessageShoot: function(msg) {
      var field = msg.ok ? this.fieldViewMy : this.fieldViewOpponent;

      if(!msg.ok) {
        cache.remove(CACHE_LAST_SHOOT);
      }

      var letters = 'АБВГДЕЖЗИКЛМНОПРСТ'.split('');
      var cellName = letters[msg.x - 1] + '' + msg.y;
      var shootResult = '';

      if(msg.status == 'killed') {
        field.setCellsShip(msg.startX, msg.startY, msg.length, msg.isVertical, true);
        shootResult = 'убил';
      }
      else if(msg.status == 'wound') {
        field.setCellWound(msg.x, msg.y);
        shootResult = 'ранил';
      }
      else if(msg.status == 'miss') {
        field.setCellMiss(msg.x, msg.y);
        shootResult = 'промазал';
      }

      var who = msg.ok ? 'Соперник' : 'Ты';
      this.setStatus(who + ' ' + shootResult + ': ' + cellName);
    },

    onMessageError: function(msg) {
    },

    onMessageStatus: function(msg) {
      if(msg.opponentName) {
        this.fieldViewOpponent.setCaption('Поле ' + msg.opponentName);
      }

      if(msg.ships) {
        _.each(msg.ships, function(ship) {
          this.fieldViewMy.setCellsShip.apply(this.fieldViewMy, ship);
        }, this);
      }

      if(msg.killedShips) {
        _.each(msg.killedShips, function(ship) {
          var args = ship.splice(0);
          args.push(true);
          this.fieldViewMy.setCellsShip.apply(this.fieldViewMy, args);
        }, this);
      }

      if(msg.shoots) {
        _.each(msg.shoots, function(shoot) {
          var isWound = shoot[2];
          this.fieldViewMy[isWound ? 'setCellWound' : 'setCellMiss'](shoot[0], shoot[1]);
        }, this);
      }

      if(msg.opponentShips) {
        _.each(msg.opponentShips, function(ship) {
          var args = ship.splice(0);
          args.push(true);
          this.fieldViewOpponent.setCellsShip.apply(this.fieldViewOpponent, args);
        }, this);
      }

      if(msg.opponentShoots) {
        _.each(msg.opponentShoots, function(shoot) {
          var isWound = shoot[2];
          this.fieldViewOpponent[isWound ? 'setCellWound' : 'setCellMiss'](shoot[0], shoot[1]);
        }, this);
      }

      if(!msg.started) {
        this.setStatus('Ожидаем соперника...');
      }
      else {
        this.onMessageTurn({ ok: msg.turn });
      }
    },

    onMessageOpponent: function(msg) {
      this.fieldViewOpponent.setCaptionInfo(msg.ok ? 'онлайн' : 'офлайн');
    },

    onMessageTooLong: function(msg) {
    },

    onShoot: function(data) {
      var x = data.x;
      var y = data.y;

      this.fieldViewOpponent.setInactive();

      this.gameSession.shoot(x, y);

      cache.set(CACHE_LAST_SHOOT, { x: x, y: y });
    },

    showUserPanel: function() {
      return false;
    }
  });

  return GameView;
});
