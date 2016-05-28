define(function(require) {

  var app = require('app');
  var loader = require('loader');

  var View = require('views/base');
  var GameProps = require('models/game/game-props');
  var GameFieldView = require('views/game-field');

  var GameView = require('views/game');

  var template = require('templates/game-start');

  var gameProvider = require('models/game/game-provider');

  var alertify = require('alertify');
  var dragula = require('dragula');

  var GameStartView = View.Page.extend({
    events: {
      'click .js-field .page-game-start__ship': 'onClickShip',
      'click .js-button-ready': 'onClickReady',
      'click .js-button-clear': 'onClickClear',
      'click .js-button-random': 'onClickRandom',
      'click .js-mode': 'onSelectMode'
    },

    initialize: function() {
      this.props = GameProps.get();
      this.template = template;
      this.fieldView = new GameFieldView(this.props);
    },

    render: function() {
      var ships = [];
      for(var i = 1; i <= this.props.getMaxDeck(); i++) {
        ships.push({ decks: i, count: this.props.getShips(i) });
      }

      var html = this.template({
        ships: ships,
        modes: _.map(gameProvider.getModes(), function(mode, k) {
          return _.extend(mode, { mode: k });
        })
      });
      this.$el.html(html);

      this.$el.find('.js-field').append(this.fieldView.$el);
      this.fieldView.show();
      this.fieldView.setCaption('Ваше поле');

      this.$cloneShips = this.$el.find('.js-ships').clone();

      this.$buttonReady = this.$el.find('.js-button-ready');
      this.$buttonRandom = this.$el.find('.js-button-random');
      this.$buttonClear = this.$el.find('.js-button-clear');

      this.blockReady();

      this.$el.find('.js-mode').first().click();

      this.isRendered = true;

      this.initDragula();
    },

    initDragula: function() {
      if(this.dragula) return;

      this.dragula = dragula({
        isContainer: function(el) {
          return $(el).hasClass('js-ship-line') || $(el).is('.game-field__cell[data-x][data-y]');
        },
        accepts: function(el, target, source, sibling) {
          var targetX = $(target).data('x');
          var targetY = $(target).data('y');
          var isTargetCell = targetX && targetY;

          var sourceX = $(source).data('x');
          var sourceY = $(source).data('y');
          var isSourceCell = sourceX && sourceY;

          if(!isTargetCell) {
            // remove
            return true;
          }

          if(!isSourceCell) {
            // add
            return this.fieldView.canAddShip(targetX, targetY, $(el).data('decks'), false);
          }
          else {
            // move
            return this.fieldView.canMoveShip(sourceX, sourceY, targetX, targetY);
          }

          return false;
        }.bind(this)
      }).on('drop', function(el, target, source, sibling) {
          var targetX = $(target).data('x');
          var targetY = $(target).data('y');
          var isTargetCell = targetX && targetY;

          var sourceX = $(source).data('x');
          var sourceY = $(source).data('y');
          var isSourceCell = sourceX && sourceY;

          if(!isTargetCell) {
            // remove
            $(el).removeClass('page-game-start__ship_vertical');
            this.fieldView.removeShip(sourceX, sourceY);
          }
          else if(isSourceCell) {
            // move
            this.fieldView.moveShip(sourceX, sourceY, targetX, targetY);
          }
          else {
            // add
            this.fieldView.addShip(targetX, targetY, $(el).data('decks'), false);
          }

          this.blockReady();
      }.bind(this))
      .on('cloned', function(clone, original) {
        if($(original).hasClass('page-game-start__ship_vertical')) {
          $(clone).css('transform', 'rotate(0deg)');
        }
      });
    },

    show: function(loader) {
      if(this.isShown) return;

      loader(function(cb) {
        this.trigger('show');

        if(!this.isRendered) this.render();

        this.$el.show();
        this.isShown = true;
        cb();
      }.bind(this));
    },

    hide: function() {
      this.$el.hide();
      if(this.isRendered && this.isShown) {
        this.fieldView.clear();
        this.$el.find('.js-ships').empty().append(this.$cloneShips.html());
        this.blockReady();
      }
      this.isShown = false;
    },

    onClickShip: function(e) {
      var $el = $(e.target);
      var $cell = $el.parent();
      var x = $cell.data('x');
      var y = $cell.data('y');

      this.fieldView.rotateShip(x, y);
    },

    blockReady: function(block) {
      block = block || !this.fieldView.isReady();
      this.$buttonReady.prop('disabled', block);
    },

    onClickReady: function(e) {
      if(!this.fieldView.isReady()) {
        return;
      }

      loader(function(hide) {
        gameProvider.once('startGame', function(res) {
          if(res.result) {
            var view = new GameView();
            view.setGameSession(res.session);
            var viewManager = require('views/manager');
            viewManager.addView(view);
            view.show(loader);
          }
          else {
            hide(function() {
              alertify.error('Не удалось начать игру');
            });
          }
        });

        var ships = this.fieldView.getShipsData();
        var mode = this.activeMode.data('mode');
        gameProvider[app.isOffline() ? 'startOfflineGame' : 'startOnlineGame'](ships, mode);
      }.bind(this));
    },

    onClickClear: function(e) {
      this.fieldView.clear();
      this.$el.find('.js-ships').empty().append(this.$cloneShips.html());
      this.blockReady();
    },

    onClickRandom: function(e) {
      this.fieldView.setRandom();
      this.$el.find('.js-ships .js-ship').remove();
      this.blockReady();
    },

    onSelectMode: function(e) {
      e.preventDefault();
      var $mode = $(e.target);
      this.$el.find('.page-game-start__mode_active').removeClass('page-game-start__mode_active');
      $mode.addClass('page-game-start__mode_active');
      this.activeMode = $mode;
      return false;
    }
  });

  return GameStartView;
});

