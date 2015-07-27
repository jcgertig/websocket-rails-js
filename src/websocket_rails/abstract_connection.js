'use strict';

/*
 Abstract Interface for the WebSocketRails client.
 */

var WebSocketEvent = require('./event');

var AbstractConnection = function(url, dispatcher) {
  this.dispatcher = dispatcher;
  this.messageQueue = [];
};

AbstractConnection.prototype.close = function() {};

AbstractConnection.prototype.trigger = function(event) {
  if (this.dispatcher.state !== 'connected') {
    return this.messageQueue.push(event);
  } else {
    return this.sendEvent(event);
  }
};

AbstractConnection.prototype.sendEvent = function(event) {
  if (this.connectionId !== null) {
    var attr = 'connection_id';
    event[attr] = this.connectionId;
    return event[attr];
  }
};

AbstractConnection.prototype.onClose = function(event) {
  var closeEvent;
  if (this.dispatcher && this.dispatcher._conn === this) {
    closeEvent = new WebSocketEvent(['connection_closed', event]);
    this.dispatcher.state = 'disconnected';
    return this.dispatcher.dispatch(closeEvent);
  }
};

AbstractConnection.prototype.onError = function(event) {
  var errorEvent;
  if (this.dispatcher && this.dispatcher._conn === this) {
    errorEvent = new WebSocketEvent(['connection_error', event]);
    this.dispatcher.state = 'disconnected';
    return this.dispatcher.dispatch(errorEvent);
  }
};

AbstractConnection.prototype.onMessage = function(eventData) {
  if (this.dispatcher && this.dispatcher._conn === this) {
    return this.dispatcher.newMessage(eventData);
  }
};

AbstractConnection.prototype.setConnectionId = function(connectionId) {
  this.connectionId = connectionId;
};

AbstractConnection.prototype.flushQueue = function() {
  var event, _i, _len, _ref;
  _ref = this.messageQueue;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    event = _ref[_i];
    this.trigger(event);
  }
  this.messageQueue = [];
  return this.messageQueue;
};

module.exports = AbstractConnection;
