'use strict';
/* global WebSocketRails */

/*
WebSocket Interface for the WebSocketRails client.
 */

module.exports = (function() {
  var __hasProp = {}.hasOwnProperty,
      __extends = function(child, parent) {
        for (var key in parent) {
          if (__hasProp.call(parent, key)) {
            child[key] = parent[key];
          }
        }

        function Ctor() {
          this.constructor = child;
        }

        Ctor.prototype = parent.prototype;
        child.prototype = new Ctor();
        child.__super__ = parent.prototype;
        return child;
      };

  WebSocketRails.WebSocketConnection = (function(_super) {
    __extends(WebSocketConnection, _super);

    WebSocketConnection.prototype.connection_type = 'websocket';

    function WebSocketConnection(url, dispatcher) {
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
    }

    WebSocketConnection.prototype.close = function() {
      return this._conn.close();
    };

    WebSocketConnection.prototype.sendEvent = function(event) {
      WebSocketConnection.__super__.sendEvent.apply(this, arguments);
      return this._conn.send(event.serialize());
    };

    return WebSocketConnection;

  })(WebSocketRails.AbstractConnection);

}).call(this);
