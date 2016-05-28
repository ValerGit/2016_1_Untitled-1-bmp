define(function(require) {
  var Drawer = require('./scene-dots/drawer');
  var Shape = require('./scene-dots/shape');
  var shapeBuilder = require('./scene-dots/shapebuilder');

  return (function(elem) {
    var drawer = new Drawer(elem);
    var shape = new Shape(drawer);

    drawer.setLoopFunction(function() {
      shape.render();
    });

    drawer.loop();

    $(window).resize(function() {
      shape.resize();
    });

    return {
      word: function(what) {
        shape.change(shapeBuilder('word', [what]));
      }
    };
  });
});
