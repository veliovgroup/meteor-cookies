utid = ""
Meteor.startup ->
  Meteor.cookie.init false

  if Meteor.isServer
    WebApp.connectHandlers.use (req, res, next) ->
      Meteor.cookie.init 
        request: req
        response: res
        next: next

      for cookie in _.uniq Meteor.cookie.cookiesToSet[utid]
        res.setHeader 'Set-Cookie', cookie

      Meteor.cookie.cookiesToSet[utid] = []
      next()

    Meteor.setInterval ->
      for key, value of Meteor.cookie.cookieString
        timestamp = key.split('-')[1]
        if (timestamp + Meteor.cookie.serverTTL) >= +(new Date)
          delete Meteor.cookie.cookiesToSet[key]
          delete Meteor.cookie.cookieString[key]
    ,
      60000

###*
@namespace Meteor
@name cookie
@type {Object} - Implement boilerplate cookie functions
###
Meteor.cookie =
  cookieString: {}
  cookiesToSet: {}
  serverTTL: 60 * 3

  setServerCookie: (value) ->
    if utid
      @cookieString[utid] = '' if not @cookieString[utid]
      @cookiesToSet[utid].push value 
      @cookiesToSet[utid] = _.uniq @cookiesToSet[utid]
      _cookie             = value.split(';')[0].trim()
      if @cookieString[utid]
        @cookieString[utid] = @cookieString[utid].split('; ').map((c)->
          c.trim()
        ).concat(_cookie).join('; ').trim()
      else
        @cookieString[utid] = _cookie

  removeServerCookie: (cookieName, value) ->
    if utid
      @cookieString[utid] = '' if not @cookieString[utid]
      @cookiesToSet[utid].push value 
      @cookiesToSet[utid] = _.uniq @cookiesToSet[utid]
      _cookies = @cookieString[utid].split('; ').map((c)->
        c.trim()
      ).filter (cookie) ->
        if cookie
          name = cookie.split('=')[0]
          if name isnt cookieName
            true
          else
            false
        else
          false

      @cookieString[utid] = _cookies.join('; ').trim()

  init: (http) ->
    utid = ""
    if Meteor.isServer and http
      _cookie = http.request.headers.cookie
    else if Meteor.isClient
      _cookie = document.cookie
    else
      _cookie = ''

    if not utid or not @get '___cookies_utid___', _cookie
      if _cookie and _cookie.length > 0 and @has '___cookies_utid___', _cookie
        utid = @get '___cookies_utid___', _cookie
      else if Meteor.isServer and http
        utid = "#{Random.id()}-#{+(new Date)}"
        http.response.setHeader 'Set-Cookie', "___cookies_utid___=#{utid}; path=/" if Meteor.isServer and http

    if utid
      @cookieString[utid] = _cookie
      @cookiesToSet[utid] ?= []
      @http               = http if Meteor.isServer and http


  http: {}
  
  ###*
  @function
  @namespace Meteor.cookie
  @name get
  @param {String} key   - The name of the cookie to read
  @param {String} _tmp  - Parsed string instead of user's cookies
  @description Read a cookie. If the cookie doesn't exist a null value will be returned.
  ###
  get: (key, _tmp = undefined) ->
    _cs = _tmp || @cookieString[utid]
    if not key or not _cs
      null 
    else 
      decodeURIComponent(_cs.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) or null

  
  ###*
  @function
  @namespace Meteor.cookie
  @name set
  @param {String}  key      - The name of the cookie to create/overwrite
  @param {String}  value    - The value of the cookie
  @param {Number}  expires  - [Optional] The max-age in seconds (e.g. 31536e3
  for a year, Infinity for a never-expires cookie), or the expires date in
  GMTString format or as Date object; if not specified the cookie will
  expire at the end of session (number – finite or Infinity – string, Date object or null).
  @param {String}  path     - [Optional] The path from where the cookie will be
  readable. E.g., "/", "/mydir"; if not specified, defaults to the current
  path of the current document location (string or null). The path must be
  absolute (see RFC 2965). For more information on how to use relative paths
  in this argument, see: https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter
  @param {String}  domain   - [Optional] The domain from where the cookie will
  be readable. E.g., "example.com", ".example.com" (includes all subdomains)
  or "subdomain.example.com"; if not specified, defaults to the host portion
  of the current document location (string or null).
  @param {boolean} secure   - [Optional] The cookie will be transmitted only
  over secure protocol as https (boolean or null).
  @description Create/overwrite a cookie.
  ###
  set: (key, value, expires, path, domain, secure) ->
    return false  if not key or /^(?:expires|max\-age|path|domain|secure)$/i.test(key)
    expiration = ""
    if expires
      switch expires.constructor
        when Number
          expiration = (if expires is Infinity then ";expires=Fri, 31 Dec 9999 23:59:59 GMT" else ";max-age=" + expires)
        when String
          expiration = ";expires=" + expires
        when Date
          expiration = ";expires=" + expires.toUTCString()
    newCookie = encodeURIComponent(key) + "=" + encodeURIComponent(value) + expiration + ((if domain then ";domain=" + domain else "")) + ((if path then ";path=" + path else "")) + ((if secure then ";secure" else ""))

    if Meteor.isClient
      document.cookie = newCookie
      @cookieString[utid] = document.cookie
    else
      @setServerCookie newCookie
    true

  
  ###*
  @function
  @namespace Meteor.cookie
  @name remove
  @param {String}  key      - The name of the cookie to create/overwrite
  @param {String}  path     - [Optional] The path from where the cookie will be
  readable. E.g., "/", "/mydir"; if not specified, defaults to the current
  path of the current document location (string or null). The path must be
  absolute (see RFC 2965). For more information on how to use relative paths
  in this argument, see: https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter
  @param {String}  domain   - [Optional] The domain from where the cookie will
  be readable. E.g., "example.com", ".example.com" (includes all subdomains)
  or "subdomain.example.com"; if not specified, defaults to the host portion
  of the current document location (string or null).
  @description Remove a cookie.
  ###
  remove: (key, path, domain) ->
    if key
      return false  unless @has(key)
      newCookie = encodeURIComponent(key) + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT" + ((if domain then ";domain=" + domain else "")) + ((if path then "; path=" + path else ""))

      if Meteor.isClient
        document.cookie = newCookie
        @cookieString[utid] = document.cookie
      else
        @removeServerCookie key, newCookie
      true
    else if @keys().length > 0 and @keys()[0] isnt ""
      @remove k for k in @keys()
      true
    else
      false

  
  ###*
  @function
  @namespace Meteor.cookie
  @name has
  @param {String} key  - The name of the cookie to create/overwrite
  @param {String} _tmp - Parsed string instead of user's cookies
  @description Check whether a cookie exists in the current position.
  @returns {boolean}
  ###
  has: (key, _tmp) ->
    _cs = _tmp || @cookieString[utid]
    if not key or not _cs
      false
    else 
      new RegExp("(?:^|;\\s*)" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=").test(_cs)

  
  ###*
  @function
  @namespace Meteor.cookie
  @name keys
  @description Returns an array of all readable cookies from this location.
  @returns {[String]}
  ###
  keys: ->
    keys = @cookieString[utid].replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/).filter (c) ->
      !!c
    l = keys.length
    i = 0

    while i < l
      keys[i] = decodeURIComponent(keys[i])
      i++
    keys