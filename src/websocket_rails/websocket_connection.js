'use strict';

/*
WebSocket Interface for the WebSocketRails client.
 */

var WebSocketConnection = function(url, dispatcher) {
  this.url = url;
  this.dispatcher = dispatcher;
  WebSocketConnection.__super__.constructor.apply(this, arguments);
  if (this.url.match(/^wss?:\/\//)) {
    console.log("WARNING: Using connection urls with protocol specified is depricated");
  } else if (window.location.protocol === 'https:') {
    this.url = "wss://" + this.url;
  } else {
    this.url = "ws://" + this.url;
  }
  this._conn = new WebSocket(this.url);
  this._conn.onmessage = (function(_this) {
    return function(event) {
      var event_data;
      event_data = JSON.parse(event.data);
      return _this.on_message(event_data);
    };
  })(this);
  this._conn.onclose = (function(_this) {
    return function(event) {
      return _this.on_close(event);
    };
  })(this);
  this._conn.onerror = (function(_this) {
    return function(event) {
      return _this.on_error(event);
    };
  })(this);
}

WebSocketConnection.prototype.connection_type = 'websocket';

WebSocketConnection.prototype.close = function() {
  return this._conn.close();
};

WebSocketConnection.prototype.send_event = function(event) {
  WebSocketConnection.__super__.send_event.apply(this, arguments);
  return this._conn.send(event.serialize());
};

module.exports = WebSocketConnection;
