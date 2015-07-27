'use strict';

/*
WebSocket Interface for the WebSocketRails client.
 */

  var WebSocketConnection = function(url, dispatcher) {
    this.url = url;
    this.dispatcher = dispatcher;
    WebSocketConnection.__super__.constructor.apply(this, arguments);
    if (this.url.match(/^wss?:\/\//)) {
      console.log('WARNING: Using connection urls with protocol specified is depricated');
    } else if (window.location.protocol === 'https:') {
      this.url = 'wss://' + this.url;
    } else {
      this.url = 'ws://' + this.url;
    }
    this._conn = new WebSocket(this.url);
    this._conn.onmessage = (function(_this) {
      return function(event) {
        var eventData;
        eventData = JSON.parse(event.data);
        return _this.onMessage(eventData);
      };
    })(this);
    this._conn.onclose = (function(_this) {
      return function(event) {
        return _this.onClose(event);
      };
    })(this);
    this._conn.onerror = (function(_this) {
      return function(event) {
        return _this.onError(event);
      };
    })(this);
  };

  WebSocketConnection.prototype.connectionType = 'websocket';

  WebSocketConnection.prototype.close = function() {
    return this._conn.close();
  };

  WebSocketConnection.prototype.sendEvent = function(event) {
    WebSocketConnection.__super__.sendEvent.apply(this, arguments);
    return this._conn.send(event.serialize());
  };

  module.exports = WebSocketConnection;
