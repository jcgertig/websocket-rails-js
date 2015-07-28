###
 HTTP Interface for the WebSocketRails client.
###
class WebSocketRails.HttpConnection extends WebSocketRails.AbstractConnection

  constructor: (url, @dispatcher) ->
    super
    @_url          = "http://#{url}"
    @_conn         = @_createXMLHttpObject()
    @last_pos      = 0
    @_conn.onreadystatechange = => @_parse_stream()
    @_conn.addEventListener("load", @on_close, false)
    @_conn.open "GET", @_url, true
    @_conn.send()

  connection_type: 'http'

  _httpFactories: -> [
    -> new XMLHttpRequest(),
    -> new ActiveXObject("Msxml2.XMLHTTP"),
    -> new ActiveXObject("Msxml3.XMLHTTP"),
    -> new ActiveXObject("Microsoft.XMLHTTP")
  ]

  close: ->
    @_conn.abort()

  send_event: (event) ->
    super
    @_post_data event.serialize()

  _post_data: (payload) ->
    $.ajax @_url,
      type: 'POST'
      data:
        client_id: @connection_id
        data: payload
      success: ->

  _createXMLHttpObject: ->
    xmlhttp   = false
    factories = @_httpFactories()
    for factory in factories
      try
        xmlhttp = factory()
      catch e
        continue
      break
    xmlhttp

  _parse_stream: ->
    if @_conn.readyState == 3
      data         = @_conn.responseText.substring @last_pos
      @last_pos    = @_conn.responseText.length
      data = data.replace( /\]\]\[\[/g, "],[" )
      event_data = JSON.parse data
      @on_message(event_data)
