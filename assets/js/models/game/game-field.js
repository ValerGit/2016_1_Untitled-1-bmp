define(function(require) {
  var Backbone = require('backbone');

  var GameField = Backbone.Model.extend({
    initialize: function(props) {
      this.props = props;
      this.ships = [];
      this.cells = [];
    },

    getProps: function() {
      return this.props;
    },

    addShip: function(x, y, length, isVertical) {
      if(this.checkShip(x, y, length, isVertical)) {
        this.ships.push([x, y, length, isVertical]);
        return true;
      }

      return false;
    },

    removeShip: function(x, y) {
      for(var i = 0; i < this.ships.length; i++) {
        if(this.ships[i][0] == x && this.ships[i][1] == y) {
          this.ships.splice(i, 1);
          return true;
        }
      }

      return false;
    },

    moveShip: function(x, y, _x, _y) {
      if(!this.checkMoveShip(x, y, _x, _y)) {
        return false;
      }

      for(var i = 0; i < this.ships.length; i++) {
        if(this.ships[i][0] == x && this.ships[i][1] == y) {
          this.ships[i][0] = _x;
          this.ships[i][1] = _y;
          return true;
        }
      }

      return false;
    },

    checkMoveShip: function(x, y, _x, _y) {
      var ships = this.ships.slice(0);

      var oldShip = null;

      for(var i = 0; i < ships.length; i++) {
        if(ships[i][0] == x && ships[i][1] == y) {
          oldShip = ships[i];
          ships.splice(i, 1);
          break;
        }
      }

      if(oldShip === null) {
        return false;
      }

      var length = oldShip[2],
          isVertical = oldShip[3];

      var is = this.props.getMaxDeck() >= length
                && _x > 0 && _x <= this.props.getSize()
                && _y > 0 && _y <= this.props.getSize()
                && (isVertical ? _y : _x) + length - 1 <= this.props.getSize();

      if(!is) {
        return false;
      }

      return undefined == _.find(ships, function(ship) {
        return GameField.intersectsShip(ship[0], ship[1], ship[2], ship[3], _x, _y, oldShip[2], oldShip[3]);
      }, this);
    },

    rotateShip: function(x, y) {
      if(!this.checkRotateShip(x, y)) {
        return false;
      }

      for(var i = 0; i < this.ships.length; i++) {
        if(this.ships[i][0] == x && this.ships[i][1] == y) {
          this.ships[i][3] = !this.ships[i][3]
          return true;
        }
      }

      return false;
    },

    checkRotateShip: function(x, y) {
      var ships = this.ships.slice(0);

      var oldShip = null;

      for(var i = 0; i < ships.length; i++) {
        if(ships[i][0] == x && ships[i][1] == y) {
          oldShip = ships[i];
          ships.splice(i, 1);
          break;
        }
      }

      if(oldShip === null) {
        return false;
      }

      var x = oldShip[0],
          y = oldShip[1],
          length = oldShip[2],
          isVertical = !oldShip[3];

      var is = this.props.getMaxDeck() >= length
                && x > 0 && x <= this.props.getSize()
                && y > 0 && y <= this.props.getSize()
                && (isVertical ? y : x) + length - 1 <= this.props.getSize();

      if(!is) {
        return false;
      }

      return undefined == _.find(ships, function(ship) {
        return GameField.intersectsShip(ship[0], ship[1], ship[2], ship[3], x, y, oldShip[2], !oldShip[3]);
      }, this);
    },

    checkShip: function(x, y, length, isVertical) {
      var is = this.props.getMaxDeck() >= length
                && x > 0 && x <= this.props.getSize()
                && y > 0 && y <= this.props.getSize()
                && (isVertical ? y : x) + length - 1 <= this.props.getSize();

      if(!is) {
        return false;
      }

      return undefined == _.find(this.ships, function(ship) {
        return GameField.intersectsShip(ship[0], ship[1], ship[2], ship[3], x, y, length, isVertical);
      }, this);
    },

    getShips: function() {
      return this.ships.slice(0);
    },

    countShips: function(length) {
      return _.reduce(this.ships, function(res, ship) {
        return res + (ship[2] == length ? 1 : 0);
      }, 0);
    },

    isReady: function() {
      for(var length = 1; length < this.props.getMaxDeck() + 1; length++) {
        if(this.props.getShips(length) != this.countShips(length)) {
          return false;
        }
      }

      return true;
    },

    clear: function() {
      this.ships = [];
      this.cells = [];
    },


    getCells: function() {
      return this.cells.slice(0);
    },

    getCell: function(x, y) {
      for(var i = 0; i < this.cells.length; i++) {
        if(this.cells[i].x === x && this.cells[i].y === y) {
          return this.cells[i].state;
        }
      }

      if(this.findShipByCell(x, y)) {
        return GameField.STATE_SHIP;
      }

      return GameField.STATE_EMPTY;
    },

    setCell: function(x, y, state) {
      for(var i = 0; i < this.cells.length; i++) {
        if(this.cells[i].x === x && this.cells[i].y === y) {
          this.cells[i].state = state;
          return;
        }
      }

      this.cells.push({ x: x, y: y, state: state});
    },

    findShipByCell: function(x, y) {
      return _.find(this.ships, function(ship) {
        if(GameField.intersectsCell(ship[0], ship[1], ship[2], ship[3], x, y)) {
          return true;
        }
      });
    },

    isShipKilled: function(x, y) {
      var ship = this.findShipByCell(x, y);
      var cells = GameField.getShipCells.apply(GameField, ship);
      var notKilled = _.find(cells, function(cell) {
        var cellState = this.getCell(cell[0], cell[1]);
        if(cellState === GameField.STATE_SHIP) {
          return true;
        }
      }, this);

      return !notKilled;
    },

    isKilled: function() {
      var notKilledShip = _.find(this.ships, function(ship) {
        return !this.isShipKilled(ship[0], ship[1]);
      }, this);
      return !notKilledShip;
    }
  });

  GameField.STATE_EMPTY = 'empty';
  GameField.STATE_SHIP = 'ship';
  GameField.STATE_SHIP_WOUND = 'ship_wound';
  GameField.STATE_MISS = 'miss';

  GameField.intersectsShip = function(x, y, length, isVertical, _x, _y, _length, _isVertical) {
    var minX = x - 1,
        minY = y - 1,
        lengthX = isVertical ? 3 : length + 2,
        lengthY = isVertical ? length + 2 : 3,
        maxX = minX + lengthX - 1,
        maxY = minY + lengthY - 1;

    for(var i = 0; i < _length; i++) {
      var curX = _isVertical ? _x : _x + i,
          curY = _isVertical ? _y + i : _y;

      if(  minX <= curX && maxX >= curX
        && minY <= curY && maxY >= curY) {
          return true;
      }
    }

    return false;
  };

  GameField.intersectsCell = function(x, y, length, isVertical, _x, _y) {
    return !!_.find(GameField.getShipCells(x, y, length, isVertical), function(cell) {
      if(cell[0] == _x && cell[1] == _y) {
        return true;
      }
    });
  };

  GameField.getShipCells = function(x, y, length, isVertical) {
    var cells = [];

    for(var i = 0; i < length; i++) {
      cells.push([x + (isVertical ? 0 : i), y + (isVertical ? i : 0)]);
    }

    return cells;
  };

  GameField.getShipNearCells = function(x, y, length, isVertical, props) {
    var cells = [];

    if(isVertical) {
      for(var _y = y - 1; _y <= y + length; _y++) {
        if(_y > 0 && _y <= props.getSize()) {
          if(x > 1) {
            cells.push([x - 1, _y]);
          }
          if(x < props.getSize()) {
            cells.push([x + 1, _y]);
          }
          if(_y == y - 1 || _y == y + length) {
            cells.push([x, _y]);
          }
        }
      }
    } else {
      for(var _x = x - 1; _x <= x + length; _x++) {
        if(_x > 0 && _x <= props.getSize()) {
          if(y > 1) {
            cells.push([_x, y - 1]);
          }
          if(y < props.getSize()) {
            cells.push([_x, y + 1]);
          }
          if(_x == x - 1 || _x == x + length) {
            cells.push([_x, y]);
          }
        }
      }
    }
    return cells;
  };

  GameField.generateRandomField = function(props) {
    var maxDeck = props.getMaxDeck();
    var size = props.getSize();

    var field = new GameField(props);
    var busyCells = {};

    var cellKey = function(x, y) {
      return String(x) + '-' + String(y);
    };

    for(var decks = maxDeck; decks > 0; decks--) {
      var maxShips = props.getShips(decks);
      for(var ships = 0; ships < maxShips; ships++) {
        while(true) {
          var x = Math.floor(Math.random() * size) + 1;
          var y = Math.floor(Math.random() * size) + 1;

          if(busyCells[cellKey(x, y)] !== undefined) {
            continue;
          }

          var isVertical = Math.random() > 0.49;

          if(field.addShip(x, y, decks, isVertical)
            || field.addShip(x, y, decks, isVertical = !isVertical)) {
              _.each(
                _.union(
                  GameField.getShipCells(x, y, decks, isVertical),
                  GameField.getShipNearCells(x, y, decks, isVertical, props)
                ), function(deck) {
                busyCells[cellKey(deck[0], deck[1])] = true;
              });
              break;
          }
        }
      }
    }

    return field;
  };

  return GameField;
});
