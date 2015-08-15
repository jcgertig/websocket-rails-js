'use strict';

/*
 Abstract Interface for the WebSocketRails client.
 */

var WebSocketEvent = require('./event');

var AbstractConnection = f(url, dispatcher) {
  this.dispatcher = dispatcher;
  this.message_queue = [];
};

AbstractConnection.prototype.close = function() {};

AbstractConnection.prototype.trigger = function(event) {
  if (this.dispatcher.state !== 'connected') {
    return this.message_queue.push(event);
  } else {
    return this.send_event(event);
  }
};

AbstractConnection.prototype.send_event = function(event) {
  if (this.connection_id != null) {
    return event.connection_id = this.connection_id;
  }
};

AbstractConnection.prototype.on_close = function(event) {
  var close_event;
  if (this.dispatcher && this.dispatcher._conn === this) {
    close_event = new WebSocketEvent(['connection_closed', event]);
    this.dispatcher.state = 'disconnected';
    return this.dispatcher.dispatch(close_event);
  }
};

AbstractConnection.prototype.on_error = function(event) {
  var error_event;
  if (this.dispatcher && this.dispatcher._conn === this) {
    error_event = new WebSocketEvent(['connection_error', event]);
    this.dispatcher.state = 'disconnected';
    return this.dispatcher.dispatch(error_event);
  }
};

AbstractConnection.prototype.on_message = function(event_data) {
  if (this.dispatcher && this.dispatcher._conn === this) {
    return this.dispatcher.new_message(event_data);
  }
};

AbstractConnection.prototype.setConnectionId = function(connection_id) {
  this.connection_id = connection_id;
};

AbstractConnection.prototype.flush_queue = function() {
  var event, i, len, ref;
  ref = this.message_queue;
  for (i = 0, len = ref.length; i < len; i++) {
    event = ref[i];
    this.trigger(event);
  }
  return this.message_queue = [];
};

module.exports = AbstractConnection;
