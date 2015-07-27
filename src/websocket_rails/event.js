'use strict';

/*
The WebsocketEvent object stores all the relevant event information.
 */

var WebsocketEvent = function(message, successCallback, failureCallback) {
  var options;
  this.successCallback = successCallback;
  this.failureCallback = failureCallback;
  this.name = message[0];
  this.data = message[1];
  options = message[2];
  if (typeof options !== 'undefined' && options !== null) {
    this.id = options.id !== null ? options.id : (((1 + Math.random()) * 0x10000) | 0);
    this.channel = options.channel;
    this.token = options.token;
    this.connectionId = options.connectionId;
    if (options.success !== null) {
      this.result = true;
      this.success = options.success;
    }
  }
};

WebsocketEvent.prototype.isChannel = function() {
  return this.channel !== null;
};

WebsocketEvent.prototype.isResult = function() {
  return typeof this.result !== 'undefined';
};

WebsocketEvent.prototype.isPing = function() {
  return this.name === 'websocket_rails.ping';
};

WebsocketEvent.prototype.serialize = function() {
  return JSON.stringify([this.name, this.data, this.metaData()]);
};

WebsocketEvent.prototype.metaData = function() {
  return {
    'id': this.id,
    'connection_id': this.connectionId,
    'channel': this.channel,
    'token': this.token
  };
};

WebsocketEvent.prototype.runCallbacks = function(success, result) {
  this.success = success;
  this.result = result;
  if (this.success === true) {
    return typeof this.successCallback === 'function' ? this.successCallback(this.result) : void 0;
  } else {
    return typeof this.failureCallback === 'function' ? this.failureCallback(this.result) : void 0;
  }
};

module.exports = WebsocketEvent;
