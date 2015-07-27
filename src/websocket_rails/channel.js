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
  var __bind = function(fn, me){
                return function(){
                  return fn.apply(me, arguments);
                };
              };

  var Channel = function(name, _dispatcher, isPrivate, onSuccess, onFailure) {
    var event, eventName, _ref;
    this.name = name;
    this._dispatcher = _dispatcher;
    this.isPrivate = isPrivate;
    this.onSuccess = onSuccess;
    this.onFailure = onFailure;
    this._failureLauncher = __bind(this._failureLauncher, this);
    this._successLauncher = __bind(this._successLauncher, this);
    if (this.isPrivate) {
      eventName = 'websocket_rails.subscribe_private';
    } else {
      eventName = 'websocket_rails.subscribe';
    }
    this.connectionId = (_ref = this._dispatcher._conn) !== null ? _ref.connectionId : void 0;
    event = new WebSocketEvent([
      eventName, {
        'channel': this.name
      }, {
        'connection_id': this.connectionId
      }
    ], this._successLauncher, this._failureLauncher);
    this._dispatcher.triggerEvent(event);
    this._callbacks = {};
    this._token = void 0;
    this._queue = [];
  };

  Channel.prototype.isPublic = function() {
    return !this.isPrivate;
  };

  Channel.prototype.destroy = function() {
    var event, eventName, _ref;
    if (this.connectionId === ((_ref = this._dispatcher._conn) !== null ? _ref.connectionId : void 0)) {
      eventName = 'websocket_rails.unsubscribe';
      event = new WebSocketEvent([
        eventName, {
          'channel': this.name
        }, {
          'connection_id': this.connectionId,
          'token': this._token
        }
      ]);
      this._dispatcher.triggerEvent(event);
    }
    this._callbacks = {};
    return this._callbacks;
  };

  Channel.prototype.bind = function(eventName, callback) {
    var _base;
    if ((_base = this._callbacks)[eventName] === null) {
      _base[eventName] = [];
    }
    return this._callbacks[eventName].push(callback);
  };

  Channel.prototype.unbind = function(eventName) {
    return delete this._callbacks[eventName];
  };

  Channel.prototype.trigger = function(eventName, message) {
    var event;
    event = new WebSocketEvent([
      eventName, message, {
        'connection_id': this.connectionId,
        'channel': this.name,
        'token': this._token
      }
    ]);
    if (!this._token) {
      return this._queue.push(event);
    } else {
      return this._dispatcher.triggerEvent(event);
    }
  };

  Channel.prototype.dispatch = function(eventName, message) {
    var callback, event, _i, _j, _len, _len1, _ref, _ref1, _results;
    if (eventName === 'websocket_rails.channel_token') {
      this._token = message.token;
      _ref = this._queue;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        event = _ref[_i];
        this._dispatcher.triggerEvent(event);
      }
      this._queue = [];
      return this._queue;
    } else {
      if (this._callbacks[eventName] === null) {
        return;
      }
      _ref1 = this._callbacks[eventName];
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        callback = _ref1[_j];
        _results.push(callback(message));
      }
      return _results;
    }
  };

  Channel.prototype._successLauncher = function(data) {
    if (this.onSuccess !== null) {
      return this.onSuccess(data);
    }
  };

  Channel.prototype._failureLauncher = function(data) {
    if (this.onFailure !== null) {
      return this.onFailure(data);
    }
  };

  module.exports = Channel;
