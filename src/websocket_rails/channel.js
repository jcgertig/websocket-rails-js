'use strict';

/*
The channel object is returned when you subscribe to a channel.

For instance:
  var dispatcher = new WebSocketRails('localhost:3000/websocket');
  var awesome_channel = dispatcher.subscribe('awesome_channel');
  awesome_channel.bind('event', function(data) { console.log('channel event!'); });
  awesome_channel.trigger('awesome_event', awesome_object);
 */

var WebSocketEvent = require('./event');
var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

var Channel = function(name, _dispatcher, is_private, on_success, on_failure) {
  var event, event_name, ref;
  this.name = name;
  this._dispatcher = _dispatcher;
  this.is_private = is_private;
  this.on_success = on_success;
  this.on_failure = on_failure;
  this._failure_launcher = bind(this._failure_launcher, this);
  this._success_launcher = bind(this._success_launcher, this);
  if (this.is_private) {
    event_name = 'websocket_rails.subscribe_private';
  } else {
    event_name = 'websocket_rails.subscribe';
  }
  this.connection_id = (ref = this._dispatcher._conn) != null ? ref.connection_id : void 0;
  event = new WebSocketEvent([
    event_name, {
      channel: this.name
    }, {
      connection_id: this.connection_id
    }
  ], this._success_launcher, this._failure_launcher);
  this._dispatcher.trigger_event(event);
  this._callbacks = {};
  this._token = void 0;
  this._queue = [];
};

Channel.prototype.is_public = function() {
  return !this.is_private;
};

Channel.prototype.destroy = function() {
  var event, event_name, ref;
  if (this.connection_id === ((ref = this._dispatcher._conn) != null ? ref.connection_id : void 0)) {
    event_name = 'websocket_rails.unsubscribe';
    event = new WebSocketEvent([
      event_name, {
        channel: this.name
      }, {
        connection_id: this.connection_id,
        token: this._token
      }
    ]);
    this._dispatcher.trigger_event(event);
  }
  return this._callbacks = {};
};

Channel.prototype.bind = function(event_name, callback) {
  var base;
  if ((base = this._callbacks)[event_name] == null) {
    base[event_name] = [];
  }
  return this._callbacks[event_name].push(callback);
};

Channel.prototype.unbind = function(event_name) {
  return delete this._callbacks[event_name];
};

Channel.prototype.trigger = function(event_name, message) {
  var event;
  event = new WebSocketEvent([
    event_name, message, {
      connection_id: this.connection_id,
      channel: this.name,
      token: this._token
    }
  ]);
  if (!this._token) {
    return this._queue.push(event);
  } else {
    return this._dispatcher.trigger_event(event);
  }
};

Channel.prototype.dispatch = function(event_name, message) {
  var callback, event, i, j, len, len1, ref, ref1, results;
  if (event_name === 'websocket_rails.channel_token') {
    this._token = message['token'];
    ref = this._queue;
    for (i = 0, len = ref.length; i < len; i++) {
      event = ref[i];
      this._dispatcher.trigger_event(event);
    }
    return this._queue = [];
  } else {
    if (this._callbacks[event_name] == null) {
      return;
    }
    ref1 = this._callbacks[event_name];
    results = [];
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      callback = ref1[j];
      results.push(callback(message));
    }
    return results;
  }
};

Channel.prototype._success_launcher = function(data) {
  if (this.on_success != null) {
    return this.on_success(data);
  }
};

Channel.prototype._failure_launcher = function(data) {
  if (this.on_failure != null) {
    return this.on_failure(data);
  }
};

module.exports = Channel;
