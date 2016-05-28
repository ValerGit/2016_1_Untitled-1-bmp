define(function(require) {
  var Dot = require('./dot');
  var DotState = require('./dotstate');
  var DotConst = require('./dotconst');

  var Shape = function(drawer) {
    this.drawer = drawer;
    this.dots = [];
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;

    this.lastShapeBuilder = null;
    this.resizeTimeout = null;
  };

  Shape.prototype = {
    center: function() {
      var area = this.drawer.getArea();
      this.x = (area.width - this.width) / 2;
      this.y = (area.height - this.height) / 2;
    },

    shuffle: function() {
      var area = this.drawer.getArea();

      _.each(
        _.filter(this.dots, function(dot) {
          return !dot.static;
        }),
        function(dot) {
          dot.queueState(
            new DotState({
              x: Math.random() * area.width,
              y: Math.random() * area.height
            })
          );
        });
    },

    resize: function() {
      if(this.resizeTimeout != null) {
        clearTimeout(this.resizeTimeout);
      }

      this.resizeTimeout = setTimeout((function() {
        this.change(this.lastShapeBuilder, true);
      }).bind(this), 300);
    },

    change: function(shapeBuilder, fast) {
      if(typeof shapeBuilder != 'function') {
        return;
      }

      var shape = shapeBuilder();
      this.lastShapeBuilder = shapeBuilder;

      var area = this.drawer.getArea();

      this.width = shape.width;
      this.height = shape.height;

      this.center();

      if(this.dots.length < shape.dots.length) {
        var add = shape.dots.length - this.dots.length;
        for(var i = 0; i < add; i++) {
          this.dots.push(
            new Dot(
              area.width / 2,
              area.height / 2,
              this.drawer
            )
          );
        }
      }

      var staticDots = shape.dots.length;

      _.find(this.dots, (function(dot) {
        var newDot = shape.dots[Math.floor(Math.random() * shape.dots.length)];

        dot.speed = fast ? DotConst.SPEED_FAST : DotConst.SPEED_NORMAL;

        if(dot.static) {
          dot.queueState(
            new DotState({
              radius: Math.random() * 10 + 10,
              alpha: Math.random()
            })
          );
        } else {
          dot.queueState(
            new DotState({
              radius: Math.random() * 5 + 5
            })
          );
        }

        dot.static = true;
        dot.queueState(
          new DotState({
            x: newDot.x + this.x,
            y: newDot.y + this.y,
            alpha: DotConst.ALPHA_DEFAULT,
            radius: DotConst.RADIUS_DEFAULT
          })
        );

        shape.dots = _.without(shape.dots, newDot);

        return shape.dots.length == 0;
      }).bind(this));

      _.each(_.rest(this.dots, staticDots), function(dot) {
        if(dot.static) {
          dot.queueState(
            new DotState({
              radius: Math.random() * 20 + 20,
              alpha: Math.random()
            })
          );

          dot.static = false;
          dot.speed = DotConst.SPEED_SLOW;

          dot.queueState(
            new DotState({
              x: Math.random() * area.width,
              y: Math.random() * area.height,
              radius: Math.random() * DotConst.RADIUS_NON_STATIC,
              alpha: DotConst.ALPHA_NOT_STATIC
            })
          );
        }
      });
    },

    render: function() {
      _.each(this.dots, function(dot) {
        dot.render();
      });
    }
  };

  return Shape;
});
