define(function(require) {
  var View = require('views/base');

  var GameField = require('models/game/game-field');

  var template = require('templates/game-field');

  var GameFieldView = View.Simple.extend({

    events: {
      'mouseover .js-cell-game': 'onMouseOverCell',
      'mouseout .js-cell-game': 'onMouseOutCell',
      'click .js-cell-active': 'onClickCell'
    },

    initialize: function(props) {
      this.props = props;
      this.model = new GameField(props);
    },

    render: function() {
      var html = template({
        letters: 'АБВГДЕЖЗИКЛМНОПРСТ'.split(''),
        size: this.props.getSize(),
        caption: '',
        captionInfo: ''
      });
      this.$el.html(html);

      this.$caption = this.$el.find('.js-caption');
      this.$captionInfo = this.$el.find('.js-caption-info');
    },

    setCaption: function(text) {
      this.$caption.html(text);
    },

    setCaptionInfo: function(text) {
      this.$captionInfo.html(text);
    },

    getCell: function(x, y) {
      return this.$el.find('[data-x=' + x + '][data-y=' + y + ']');
    },

    canAddShip: function(x, y, length, isVertical) {
      return this.model.checkShip(x, y, length, isVertical);
    },

    addShip: function(x, y, length, isVertical) {
      if(this.model.addShip(x, y, length, isVertical)) {
        var $cell = this.getCell(x, y);
        $cell.empty();

        var classes = [
          'js-ship',
          'page-game-start__ship',
          'page-game-start__ship_' + length
        ];

        if(isVertical) {
          classes.push('page-game-start__ship_vertical');
        }

        $cell.append($('<div />').addClass(classes.join(' ')).attr('data-decks', length));
        return true;
      }

      return false;
    },

    canMoveShip: function(x, y, _x, _y) {
      return this.model.checkMoveShip(x, y, _x, _y);
    },

    moveShip: function(x, y, _x, _y) {
      return this.model.moveShip(x, y, _x, _y);
    },

    removeShip: function(x, y) {
      if(this.model.removeShip(x, y)) {
        var $cell = this.getCell(x, y);
        $cell.empty();
        return true;
      }

      return false;
    },

    rotateShip: function(x, y) {
      if(this.model.rotateShip(x, y)) {
        var $cell = this.getCell(x, y);
        $cell.find('.js-ship').toggleClass('page-game-start__ship_vertical');
        return true;
      }

      return false;
    },

    clear: function() {
      this.$el.find('.page-game-start__ship').remove();
      this.model.clear();
    },

    setRandom: function() {
      this.clear();

      var newField = GameField.generateRandomField(this.props);
      _.each(newField.getShips(), function(ship) {
        this.addShip(ship[0], ship[1], ship[2], ship[3]);
      }, this);
    },

    isReady: function() {
      return this.model.isReady();
    },

    getShipsData: function() {
      return this.model.getShips();
    },

    setCell: function(x, y, state) {
      var $cell = this.getCell(x, y);

      var classShip = 'game-field__cell_ship';
      var classWound = 'game-field__cell_wound';
      var classMiss = 'game-field__cell_miss';
      var classWait = 'game-field__cell_wait';

      this.model.setCell(x, y, state);

      $cell.removeClass(classShip);
      $cell.removeClass(classWound);
      $cell.removeClass(classMiss);
      $cell.removeClass(classWait);

      $cell.trigger('mouseout');

      switch(state) {
          case 'wait':
              $cell.addClass(classWait);
              break;
          case GameField.STATE_SHIP:
              $cell.addClass(classShip);
              break;
          case GameField.STATE_SHIP_WOUND:
              $cell.addClass(classWound);
              break;
          case GameField.STATE_MISS:
              $cell.addClass(classMiss);
              break;
          case GameField.STATE_EMPTY:
          default:
              break;
      }
    },

    setCellWait: function(x, y) {
      return this.setCell(x, y, 'wait');
    },

    setCellShip: function(x, y) {
      return this.setCell(x, y, GameField.STATE_SHIP);
    },

    setCellWound: function(x, y) {
      return this.setCell(x, y, GameField.STATE_SHIP_WOUND);
    },

    setCellMiss: function(x, y) {
      return this.setCell(x, y, GameField.STATE_MISS);
    },

    setCellEmpty: function(x, y) {
      return this.setCell(x, y, GameField.STATE_EMPTY);
    },

    setCellsShip: function(x, y, length, isVertical, asKilled) {
      asKilled = asKilled || false;

      var cells = GameField.getShipCells(x, y, length, isVertical);

      _.each(cells, function(cell) {
        this.setCell(cell[0], cell[1], asKilled ? GameField.STATE_SHIP_WOUND : GameField.STATE_SHIP);
      }, this);

      if(asKilled) {
        cells = GameField.getShipNearCells(x, y, length, isVertical, this.props);

        _.each(cells, function(cell) {
          this.setCellMiss(cell[0], cell[1]);
        }, this);
      }
    },

    setActive: function(active) {
      if(active === undefined) {
        active = true;
      }

      var classShip = 'game-field__cell_ship';
      var classWound = 'game-field__cell_wound';
      var classMiss = 'game-field__cell_miss';
      var classActive = 'game-field__cell_active js-cell-active';

      this.$el.find('.js-cell-game').each(function(i, el) {
        $(el).toggleClass(classActive,
                          active && !($(el).hasClass(classShip) || $(el).hasClass(classWound) || $(el).hasClass(classMiss))
                         );
      });
    },

    setInactive: function() {
      return this.setActive(false);
    },

    onMouseOverCell: function(e) {
      var $cell = $(e.target);
      var x = $cell.data('x');
      var y = $cell.data('y');

      var hoverClass = 'game-field__cell_hover';

      this.$el.find('.js-cell-game').each(function(i, el) {
        $(el).toggleClass(hoverClass, $(el).data('x') == x || $(el).data('y') == y);
      });
    },

    onMouseOutCell: function(e) {
      var $cell = $(e.target);
      var x = $cell.data('x');
      var y = $cell.data('y');

      var hoverClass = 'game-field__cell_hover';

      this.$el.find('.js-cell-game').each(function(i, el) {
        if($(el).data('x') == x || $(el).data('y') == y) {
          $(el).removeClass(hoverClass);
        }
      });
    },

    onClickCell: function(e) {
      var $cell = $(e.target);
      var x = $cell.data('x');
      var y = $cell.data('y');

      this.setCellWait(x, y);

      this.trigger('shoot', {
        x: x,
        y: y
      });
    },

    show: function() {
      this.render();
      this.$el.show();
    },

    hide: function() {
      this.$el.hide();
    }
  });

  return GameFieldView;
});
