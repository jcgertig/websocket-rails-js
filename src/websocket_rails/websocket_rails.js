'use strict';

/*
WebsocketRails JavaScript Client

Setting up the dispatcher:
  var dispatcher = new WebSocketRails('localhost:3000/websocket');
  dispatcher.on_open = function() {
    // trigger a server event immediately after opening connection
    dispatcher.trigger('new_user',{user_name: 'guest'});
  })

Triggering a new event on the server
  dispatcherer.trigger('event_name',object_to_be_serialized_to_json);

Listening for new events from the server
  dispatcher.bind('event_name', function(data) {
    console.log(data.user_name);
  });

Stop listening for new events from the server
  dispatcher.unbind('event')
 */

var __extends = function(child, parent) {
      for (var key in parent.prototype) {
        if (!child.prototype.hasOwnProperty(key)) {
          child.prototype[key] = parent.prototype[key];
        }
      }

      function Ctor() {
        this.constructor = child;
      }

      Ctor.prototype = child.prototype;
      child.prototype = new Ctor();
      child.__super__ = parent.prototype;
      return child;
    };

var AbstractConnection = require('./abstract_connection');
var WebSocketChannel = require('./channel');
var WebSocketEvent = require('./event');
var HttpConnection = require('./http_connection');
var WebSocketConnection = require('./websocket_connection');
__extends(HttpConnection, AbstractConnection);
__extends(WebSocketConnection, AbstractConnection);

var WebSocketRails = function(url, useWebsockets) {
  this.url = url;
  this.useWebsockets = typeof useWebsockets !== 'undefined' ? useWebsockets : true;
  this.connectionStale = this.connectionStale.bind(this);
  this.supportsWebsockets = this.supportsWebsockets.bind(this);
  this.dispatchChannel = this.dispatchChannel.bind(this);
  this.unsubscribe = this.unsubscribe.bind(this);
  this.subscribePrivate = this.subscribePrivate.bind(this);
  this.subscribe = this.subscribe.bind(this);
  this.dispatch = this.dispatch.bind(this);
  this.triggerEvent = this.triggerEvent.bind(this);
  this.trigger = this.trigger.bind(this);
  this.bind = this.bind.bind(this);
  this.connectionEstablished = this.connectionEstablished.bind(this);
  this.newMessage = this.newMessage.bind(this);
  this.reconnect = this.reconnect.bind(this);
  this.callbacks = {};
  this.channels = {};
  this.queue = {};
  this.connect();
};

WebSocketRails.prototype.connect = function() {
  this.state = 'connecting';
  if (!(this.supportsWebsockets() && this.useWebsockets)) {
    this._conn = new HttpConnection(this.url, this);
  } else {
    this._conn = new WebSocketConnection(this.url, this);
  }
  this._conn.newMessage = this.newMessage;
  return this._conn;
};

WebSocketRails.prototype.disconnect = function() {
  if (this._conn) {
    this._conn.close();
    delete this._conn._conn;
    delete this._conn;
  }
  this.state = 'disconnected';
  return this.state;
};

WebSocketRails.prototype.reconnect = function() {
  var event, id, oldConnectionId, _ref, _ref1;
  oldConnectionId = (_ref = this._conn) !== null ? _ref.connectionId : void 0;
  this.disconnect();
  this.connect();
  _ref1 = this.queue;
  for (id in _ref1) {
    event = _ref1[id];
    if (event.connectionId === oldConnectionId && !event.isResult()) {
      this.triggerEvent(event);
    }
  }
  return this.reconnectChannels();
};

WebSocketRails.prototype.newMessage = function(data) {
  var event, _ref;
  event = new WebSocketEvent(data);
  if (event.isResult()) {
    if ((_ref = this.queue[event.id]) !== null) {
      _ref.runCallbacks(event.success, event.data);
    }
    this.queue[event.id] = null;
  } else if (event.isChannel()) {
    this.dispatchChannel(event);
  } else {
    this.dispatch(event);
  }
  if (this.state === 'connecting' && event.name === 'client_connected') {
    return this.connectionEstablished(event);
  }
};

WebSocketRails.prototype.connectionEstablished = function(event) {
  this.state = 'connected';
  this._conn.setConnectionId(event.connectionId);
  this._conn.flushQueue();
  if (this.onOpen !== null) {
    return this.onOpen(event.data);
  }
};

WebSocketRails.prototype.bind = function(eventName, callback) {
  var _base;
  if ((_base = this.callbacks)[eventName] === null) {
    _base[eventName] = [];
  }
  return this.callbacks[eventName].push(callback);
};

WebSocketRails.prototype.trigger = function(eventName, data, successCallback, failureCallback) {
  var event;
  event = new WebSocketEvent([
    eventName, data, {
      'connection_id': this.connectionId
    }
  ], successCallback, failureCallback);
  this.queue[event.id] = event;
  return this._conn.trigger(event);
};

WebSocketRails.prototype.triggerEvent = function(event) {
  var _base, _name;
  if ((_base = this.queue)[_name = event.id] === null) {
    _base[_name] = event;
  }
  this._conn.trigger(event);
  return event;
};

WebSocketRails.prototype.dispatch = function(event) {
  var callback, _i, _len, _ref, _results;
  console.log(event.name);
  if (this.callbacks[event.name] === null) {
    return;
  }
  _ref = this.callbacks[event.name];
  _results = [];
  if (_ref) {
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      callback = _ref[_i];
      _results.push(callback(event.data));
    }
  }
  return _results;
};

WebSocketRails.prototype.subscribe = function(channelName, successCallback, failureCallback) {
  var channel;
  if (this.channels[channelName] === null) {
    channel = new WebSocketChannel(channelName, this, false, successCallback, failureCallback);
    this.channels[channelName] = channel;
    return channel;
  } else {
    return this.channels[channelName];
  }
};

WebSocketRails.prototype.subscribePrivate = function(channelName, successCallback, failureCallback) {
  var channel;
  if (this.channels[channelName] === null) {
    channel = new WebSocketChannel(channelName, this, true, successCallback, failureCallback);
    this.channels[channelName] = channel;
    return channel;
  } else {
    return this.channels[channelName];
  }
};

WebSocketRails.prototype.unsubscribe = function(channelName) {
  if (this.channels[channelName] === null) {
    return;
  }
  this.channels[channelName].destroy();
  return delete this.channels[channelName];
};

WebSocketRails.prototype.dispatchChannel = function(event) {
  if (typeof this.channels[event.channel] === 'undefined' || this.channels[event.channel] === null) {
    return;
  }
  return this.channels[event.channel].dispatch(event.name, event.data);
};

WebSocketRails.prototype.supportsWebsockets = function() {
  return typeof window.WebSocket === 'function' || typeof window.WebSocket === 'object';
};

WebSocketRails.prototype.connectionStale = function() {
  return this.state !== 'connected';
};

WebSocketRails.prototype.reconnectChannels = function() {
  var callbacks, channel, name, _ref, _results;
  _ref = this.channels;
  _results = [];
  for (name in _ref) {
    channel = _ref[name];
    callbacks = channel._callbacks;
    channel.destroy();
    delete this.channels[name];
    channel = channel.isPrivate ? this.subscribePrivate(name) : this.subscribe(name);
    channel._callbacks = callbacks;
    _results.push(channel);
  }
  return _results;
};

module.exports = WebSocketRails;
