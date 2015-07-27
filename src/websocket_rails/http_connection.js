'use strict';
/* global ActiveXObject, $ */

/*
 HTTP Interface for the WebSocketRails client.
 */
     var HttpConnection;

     HttpConnection.prototype.connectionType = 'http';

     HttpConnection.prototype._httpFactories = function() {
       return [
         function() {
           return new XMLHttpRequest();
         }, function() {
           return new ActiveXObject('Msxml2.XMLHTTP');
         }, function() {
           return new ActiveXObject('Msxml3.XMLHTTP');
         }, function() {
           return new ActiveXObject('Microsoft.XMLHTTP');
         }
       ];
     };

     HttpConnection.prototype._createXMLHttpObject = function() {
       var e, factories, factory, xmlhttp, _i, _len;
       xmlhttp = false;
       factories = this._httpFactories();
       for (_i = 0, _len = factories.length; _i < _len; _i++) {
         factory = factories[_i];
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

     HttpConnection = function(url, dispatcher) {
      this.dispatcher = dispatcher;
      HttpConnection.__super__.constructor.apply(this, arguments);
      this._url = 'http://' + url;
      this._conn = this._createXMLHttpObject();
      this.lastPos = 0;
      this._conn.onreadystatechange = (function(_this) {
        return function() {
          return _this._parseStream();
        };
      })(this);
      this._conn.addEventListener('load', this.onClose, false);
      this._conn.open('GET', this._url, true);
      this._conn.send();
    };

    HttpConnection.prototype.close = function() {
      return this._conn.abort();
    };

    HttpConnection.prototype.sendEvent = function(event) {
      HttpConnection.__super__.sendEvent.apply(this, arguments);
      return this._postData(event.serialize());
    };

    HttpConnection.prototype._postData = function(payload) {
      return $.ajax(this._url, {
        type: 'POST',
        data: {
          'client_id' : this.connectionId,
          'data' : payload
        },
        success: function() {}
      });
    };

    HttpConnection.prototype._parseStream = function() {
      var data, eventData;
      if (this._conn.readyState === 3) {
        data = this._conn.responseText.substring(this.lastPos);
        this.lastPos = this._conn.responseText.length;
        data = data.replace(/\]\]\[\[/g, '],[');
        eventData = JSON.parse(data);
        return this.onMessage(eventData);
      }
    };

    module.exports = HttpConnection;
