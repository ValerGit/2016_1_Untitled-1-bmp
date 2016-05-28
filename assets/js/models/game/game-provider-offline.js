define(function(require) {
  var Backbone = require('backbone');

  var GameField = require('models/game/game-field');

  var cache = require('cache');

  var CACHE_OFFLINE_GAME_STATE = 'offline-game-state';
  var animals = [ 'camel', 'chupacabra', 'giraffe', 'monkey', 'grizzly', 'chameleon', 'elephant', 'hyena', 'frog', 'sheep', 'turtle', 'iguana', 'lemur', 'hippo', 'coyote', 'wolf', 'panda', 'python' ];

  var GameProviderOffline = Backbone.Model.extend({
    _state: undefined,

    initialize: function(props) {
      this.props = props;
    },

    getProps: function() {
      return this.props;
    },

    connect: function() {
      this.trigger('connection', {
        open: true
      });
    },

    sendMessage: function(type, data) {
      data = data || {};
      this.trigger('message', _.extend(data, { type: type }));
    },

    requestStatus: function() {
      if(!this.exists()) {
        this.sendMessage('game_status', { ok: false });
        return;
      }

      var state = this._getState();

      var ships = state.field.getShips();
      var shoots = _.map(state.field.getCells(), function(cell) {
        return [cell.x, cell.y, cell.state === GameField.STATE_SHIP_WOUND];
      });

      var opponentShoots = _.map(state.opponentField.getCells(), function(cell) {
        return [cell.x, cell.y, cell.state === GameField.STATE_SHIP_WOUND];
      });

      var info = {
        ok: true,
        started: true,
        ships: ships,
        killedShips: [],
        shoots: shoots,
        opponentName: state.opponentName,
        opponentShips: [],
        opponentShoots: opponentShoots,
        turn: state.turn
      };

      this.sendMessage('game_status', info);
    },

    requestInit: function(ships, mode, id) {
      if(this.exists()) {
        return;
      }

      var currentField = new GameField(this.props);
      _.each(ships, function(ship) {
        currentField.addShip.apply(currentField, ship);
      }, this);
      var opponentName = 'Anonymous ' + animals[Math.floor(Math.random() * animals.length)];
      var opponentField = GameField.generateRandomField(this.props);

      var state = {
        field: currentField,
        opponentName: opponentName,
        opponentField: opponentField,
        turn: Math.random() > 0.5,
        latestShoots: []
      };
      this._setState(state);

      this.sendMessage('game_init', { ok: true });
      this.sendMessage('game_start', { ok: true, opponentName: opponentName });
      this.requestStatus();

      this.makeTurn();
    },

    requestShoot: function(x, y) {
      if(!this.exists()) {
        return;
      }

      var state = this._getState();

      if(!state.turn) {
        return;
      }

      var cellState = state.opponentField.getCell(x, y);

      if(cellState === GameField.STATE_MISS || cellState === GameField.STATE_SHIP_WOUND) {
        return;
      }

      if(cellState == GameField.STATE_EMPTY) {
        state.opponentField.setCell(x, y, GameField.STATE_MISS);
        this._setState(state);
        state.turn = false;
        this._setState(state);
        this.sendMessage('shoot_result', { ok: false, x: x, y: y, status: 'miss' });
        _.defer(function() { this.makeTurn(); }.bind(this));
      }
      else if(cellState == GameField.STATE_SHIP) {
        state.opponentField.setCell(x, y, GameField.STATE_SHIP_WOUND);
        state.turn = true;
        var isKilled = state.opponentField.isShipKilled(x, y);

        var info = {
          ok: false,
          x: x,
          y: y
        };
        if(isKilled) {
          var ship = state.opponentField.findShipByCell(x, y);
          info.status = 'killed';
          info.startX = ship[0];
          info.startY = ship[1];
          info.length = ship[2];
          info.isVertical = ship[3];

          _.each(GameField.getShipNearCells(ship[0], ship[1], ship[2], ship[3], this.props), function(cell) {
            state.opponentField.setCell(cell[0], cell[1], GameField.STATE_MISS);
          }, this);
        }
        else {
          info.status = 'wound';
        }
        this._setState(state);
        this.sendMessage('shoot_result', info);
        _.defer(function() { this.makeTurn(); }.bind(this));
      }
    },

    requestGiveUp: function() {
      if(!this.exists()) {
        return;
      }

      this._finish(false);
    },

    checkGameOver: function() {
      if(!this.exists()) {
        return;
      }

      var state = this._getState();

      var field = state.field;
      var opponentField = state.opponentField;

      if(field.isKilled()) {
        this._finish(false);
        return true;
      }

      if(opponentField.isKilled()) {
        this._finish(true);
        return true;
      }

      return false;
    },

    makeTurn: function() {
      if(!this.exists()) {
        return;
      }

      var state = this._getState();

      if(this.checkGameOver()) {
        return;
      }

      this.sendMessage('game_turn', { ok: state.turn });

      if(state.turn) {
        return;
      }

      var validator = function(x, y) {
        return !(x > this.props.getSize() || y > this.props.getSize() || x < 1 || y < 1)
        && state.field.getCell(x, y) != GameField.STATE_MISS && state.field.getCell(x, y) != GameField.STATE_SHIP_WOUND;
      }.bind(this);

      var iter = 0;
      while(true) {
        if(++iter > 10000) {
          return;
        }

        var x, y;
        var shoots = state.latestShoots;
        if(!shoots || shoots.length == 0) {
          x = Math.floor(Math.random() * this.props.getSize()) + 1;
          y = Math.floor(Math.random() * this.props.getSize()) + 1;
        }
        else {
          var availableShoots = [];
          if(shoots.length == 1) {
            var shoot = shoots[0];
            availableShoots.push([shoot.x, shoot.y - 1]);
            availableShoots.push([shoot.x, shoot.y + 1]);
            availableShoots.push([shoot.x - 1, shoot.y]);
            availableShoots.push([shoot.x + 1, shoot.y]);
          }
          else {
            var isVertical = (shoots[0].x === shoots[1].x);
            var min = this.props.getSize();
            var max = 0;

            _.each(shoots, function(shoot) {
              if(isVertical) {
                if(shoot.y < min)
                  min = shoot.y;
                if(shoot.y > max) {
                  max = shoot.y;
                }
              }
              else {
                if(shoot.x < min)
                  min = shoot.x;
                if(shoot.x > max) {
                  max = shoot.x;
                }
              }
            }, this);

            var constVar = isVertical ? shoots[0].x : shoots[0].y;
            availableShoots.push([isVertical ? constVar : min - 1, isVertical ? min - 1 : constVar]);
            availableShoots.push([isVertical ? constVar : max + 1, isVertical ? max + 1 : constVar]);
          }

          var realShoots = availableShoots.filter(function(cell) {
            return validator(cell[0], cell[1]);
          });

          var index = Math.floor(Math.random() * realShoots.length);
          if(index >= realShoots.length) {
            continue;
          }

          var realShoot = realShoots[index];
          x = realShoot[0];
          y = realShoot[1];
        }

        if(!validator(x, y)) {
          continue;
        }

        var cellState = state.field.getCell(x, y);

        if(cellState == GameField.STATE_EMPTY) {
          state.field.setCell(x, y, GameField.STATE_MISS);
          state.turn = true;
          this._setState(state);
          this.sendMessage('shoot_result', { ok: true, x: x, y: y, status: 'miss' });
          _.defer(function() { this.makeTurn(); }.bind(this));
          break;
        }
        else if(cellState == GameField.STATE_SHIP) {
          state.field.setCell(x, y, GameField.STATE_SHIP_WOUND);
          state.latestShoots.push({ x: x, y: y});
          state.turn = false;
          var isKilled = state.field.isShipKilled(x, y);

          var info = {
            ok: true,
            x: x,
            y: y
          };
          if(isKilled) {
            state.latestShoots = [];
            var ship = state.field.findShipByCell(x, y);
            info.status = 'killed';
            info.startX = ship[0];
            info.startY = ship[1];
            info.length = ship[2];
            info.isVertical = ship[3];

            _.each(GameField.getShipNearCells(ship[0], ship[1], ship[2], ship[3], this.props), function(cell) {
              state.field.setCell(cell[0], cell[1], GameField.STATE_MISS);
            }, this);
          }
          else {
            info.status = 'wound';
          }
          this._setState(state);
          this.sendMessage('shoot_result', info);
          _.defer(function() { this.makeTurn(); }.bind(this));
          break;
        }
      }
    },

    exists: function() {
      return !!cache.get(CACHE_OFFLINE_GAME_STATE);
    },

    _getState: function() {
      if(!this._state) {
        var state = cache.get(CACHE_OFFLINE_GAME_STATE);

        var currentField = new GameField(this.props);
        _.each(state.ships, function(ship) {
          currentField.addShip.apply(currentField, ship);
        }, this);
        _.each(state.shoots, function(shoot) {
          currentField.setCell(shoot.x, shoot.y, shoot.state);
        }, this);

        var opponentField = new GameField(this.props);
        _.each(state.opponentShips, function(ship) {
          opponentField.addShip.apply(opponentField, ship);
        }, this);
        _.each(state.opponentShoots, function(shoot) {
          opponentField.setCell(shoot.x, shoot.y, shoot.state);
        }, this);

        this._state = {
          field: currentField,
          opponentName: state.opponentName,
          opponentField: opponentField,
          turn: state.turn,
          latestShoots: state.latestShoots
        };
      }

      return this._state;
    },

    _setState: function(state) {
      this._state = state;
      var _state = {
        ships: state.field.getShips(),
        shoots: state.field.getCells(),
        opponentName: state.opponentName,
        opponentShips: state.opponentField.getShips(),
        opponentShoots: state.opponentField.getCells(),
        turn: state.turn,
        latestShoots: state.latestShoots
      };
      cache.set(CACHE_OFFLINE_GAME_STATE, _state);
    },

    _finish: function(win) {
      var score = require('app').getUser().get('score');
      if(win) {
        score++;
        cache.set('user-is-offline-score', score);
      }
      this.sendMessage('game_over', { ok: !!win, score: score });
      cache.remove(CACHE_OFFLINE_GAME_STATE);
    }
  });

  GameProviderOffline.getModes = function() {
    return {
      bot: {
        text: 'Бот офлайн',
        desciption: ''
      }
    };
  };

  return GameProviderOffline;
});
