'use strict';

/*
WebSocket Interface for the WebSocketRails client.
 */

    var WebSocketEvent = require('./event');

    var Connection = function(url, dispatcher) {
      this.url = url;
      this.dispatcher = dispatcher;
      this.messageQueue = [];
      this.state = 'connecting';
      this.connectionId = null;
      if (!(this.url.match(/^wss?:\/\//) || this.url.match(/^ws?:\/\//))) {
        if (window.location.protocol === 'https:') {
          this.url = 'wss://' + this.url;
        } else {
          this.url = 'ws://' + this.url;
        }
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

    Connection.prototype.onMessage = function(event) {
      return this.dispatcher.newMessage(event);
    };

    Connection.prototype.onClose = function(event) {
      var data;
      this.dispatcher.state = 'disconnected';
      data = (event !== null ? event.data : void 0) ? event.data : event;
      return this.dispatcher.dispatch(new WebSocketEvent(['connection_closed', data]));
    };

    Connection.prototype.onError = function(event) {
      this.dispatcher.state = 'disconnected';
      return this.dispatcher.dispatch(new WebSocketEvent(['connection_error', event.data]));
    };

    Connection.prototype.trigger = function(event) {
      if (this.dispatcher.state !== 'connected') {
        return this.messageQueue.push(event);
      } else {
        return this.sendEvent(event);
      }
    };

    Connection.prototype.close = function() {
      return this._conn.close();
    };

    Connection.prototype.setConnectionId = function(connectionId) {
      this.connectionId = connectionId;
      return this.connectionId;
    };

    Connection.prototype.sendEvent = function(event) {
      return this._conn.send(event.serialize());
    };

    Connection.prototype.flushQueue = function() {
      var event, _i, _len, _ref;
      _ref = this.messageQueue;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        event = _ref[_i];
        this.trigger(event);
      }
      this.messageQueue = [];
      return this.messageQueue;
    };

    module.exports = Connection;
