'use strict';
/* global ActiveXObject, $ */

/*
 HTTP Interface for the WebSocketRails client.
 */

var HttpConnection = function(url, dispatcher) {
  var e;
  this.dispatcher = dispatcher;
  HttpConnection.__super__.constructor.apply(this, arguments);
  this._url = "http://" + url;
  this._conn = this._createXMLHttpObject();
  this.last_pos = 0;
  try {
    this._conn.onreadystatechange = (function(_this) {
      return function() {
        return _this._parse_stream();
      };
    })(this);
    this._conn.addEventListener("load", this.on_close, false);
  } catch (_error) {
    e = _error;
    this._conn.onprogress = (function(_this) {
      return function() {
        return _this._parse_stream();
      };
    })(this);
    this._conn.onload = this.on_close;
    this._conn.readyState = 3;
  }
  this._conn.open("GET", this._url, true);
  this._conn.send();
}

HttpConnection.prototype.connection_type = 'http';

HttpConnection.prototype._httpFactories = function() {
  return [
    function() {
      return new XDomainRequest();
    }, function() {
      return new XMLHttpRequest();
    }, function() {
      return new ActiveXObject("Msxml2.XMLHTTP");
    }, function() {
      return new ActiveXObject("Msxml3.XMLHTTP");
    }, function() {
      return new ActiveXObject("Microsoft.XMLHTTP");
    }
  ];
};

HttpConnection.prototype.close = function() {
  return this._conn.abort();
};

HttpConnection.prototype.send_event = function(event) {
  HttpConnection.__super__.send_event.apply(this, arguments);
  return this._post_data(event.serialize());
};

HttpConnection.prototype._post_data = function(payload) {
  return $.ajax(this._url, {
    type: 'POST',
    data: {
      client_id: this.connection_id,
      data: payload
    },
    success: function() {}
  });
};

HttpConnection.prototype._createXMLHttpObject = function() {
  var e, factories, factory, i, len, xmlhttp;
  xmlhttp = false;
  factories = this._httpFactories();
  for (i = 0, len = factories.length; i < len; i++) {
    factory = factories[i];
    try {
      xmlhttp = factory();
    } catch (_error) {
      e = _error;
      continue;
    }
    break;
  }
  return xmlhttp;
};

HttpConnection.prototype._parse_stream = function() {
  var data, e, event_data;
  if (this._conn.readyState === 3) {
    data = this._conn.responseText.substring(this.last_pos);
    this.last_pos = this._conn.responseText.length;
    data = data.replace(/\]\]\[\[/g, "],[");
    try {
      event_data = JSON.parse(data);
      return this.on_message(event_data);
    } catch (_error) {
      e = _error;
    }
  }
};

module.exports = HttpConnection;
