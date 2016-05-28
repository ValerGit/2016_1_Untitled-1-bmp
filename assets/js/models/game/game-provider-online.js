define(function(require) {
  var Backbone = require('backbone');

  var GameProviderOnline = Backbone.Model.extend({
    initialize: function(props) {
      this.props = props;
    },

    getProps: function() {
      return this.props;
    },

    connect: function() {
      if(this.isOpen()) {
        this.trigger('connection', {
          open: true
        });
        return;
      }

      try {
        var proto = window.location.protocol.indexOf("https:") == -1 ? 'ws' : 'wss';
        this.ws = new WebSocket(proto + '://' + window.location.host + '/gameplay');
        this.ws.onopen = this._onOpen.bind(this);
        this.ws.onclose = this._onClose.bind(this);
        this.ws.onmessage = this._onMessage.bind(this);
        this.ws.onerror = function() {
          this.trigger('connection', {
            open: false
          });
        }.bind(this);
      }
      catch(e) {
        this.trigger('connection', {
          open: false
        });
      }
    },

    isOpen: function() {
      return !!(this.ws && this.ws.readyState == WebSocket.OPEN);
    },

    _onOpen: function() {
      this.trigger('connection', {
        open: true
      });
    },

    _onClose: function() {
      this.ws.onopen = this.ws.onclose = this.ws.onerror = this.ws.onmessage = function() {};
      this.trigger('connection', {
        open: false,
        close: true
      });
    },

    _onMessage: function(e) {
      this.trigger('message', JSON.parse(e.data));
    },

    send: function(action, data) {
      var _action = function() {
        data = data || {};
        try {
          this.ws.send(
            JSON.stringify(_.extend(data, { action: action }))
          );
          return true;
        }
        catch(e) {
          return false;
        }
      }.bind(this);

      if(this.isOpen()) {
        this.once('connection', function(res) {
          if(res.open) {
            _action();
          }
        }, this);
        this.connect();
      }
      else {
        _action();
      }
    },

    requestStatus: function() {
      return this.send('getGameStatus');
    },

    requestInit: function(ships, mode, id) {
      var info = {
        mode: mode,
        ships: ships
      };

      if(id) {
        info.id = id;
      }

      return this.send('initNewGame', info);
    },

    requestShoot: function(x, y) {
      return this.send('shoot', { x: x, y: y });
    },

    requestGiveUp: function() {
      return this.send('giveUp');
    }
  });

  GameProviderOnline.getModes = function() {
    return {
      random: {
        text: 'Случайный противник',
        description: ''
      },
      bot: {
        text: 'Бот',
        desciption: ''
      }/*,
      friend: {
        text: 'С другом',
        description: ''
      }*/
    };
  };

  return GameProviderOnline;
});
