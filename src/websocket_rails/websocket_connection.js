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
  } else {
    this.url = window.location.protocol === 'https:' ? 'wss://'+this.url : 'ws://'+this.url;
  }

  this._conn = new window.WebSocket(this.url);
  this._conn.onmessage = function(event) {
      var eventData;
      eventData = JSON.parse(event.data);
      return this.onMessage(eventData);
    }.bind(this);
  this._conn.onclose = function(event) {
      return this.onClose(event);
    }.bind(this);
  this._conn.onerror = function(event) {
      return this.onError(event);
    }.bind(this);
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
