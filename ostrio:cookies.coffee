###*
@namespace Meteor
@name cookie
@type {Object} - Implement boilerplate cookie functions
###
Meteor.cookie =
  
  ###*
  @function
  @namespace Meteor.cookie
  @name get
  @param {string} key   - The name of the cookie to read
  @description Read a cookie. If the cookie doesn't exist a null value will be returned.
  ###
  get: (key) ->
    (if (not key) then (null) else (decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) or null))

  
  ###*
  @function
  @namespace Meteor.cookie
  @name set
  @param {string}  key      - The name of the cookie to create/overwrite
  @param {string}  value    - The value of the cookie
  @param {int}     expires  - [Optional] The max-age in seconds (e.g. 31536e3
  for a year, Infinity for a never-expires cookie), or the expires date in
  GMTString format or as Date object; if not specified the cookie will
  expire at the end of session (number – finite or Infinity – string, Date object or null).
  @param {string}  path     - [Optional] The path from where the cookie will be
  readable. E.g., "/", "/mydir"; if not specified, defaults to the current
  path of the current document location (string or null). The path must be
  absolute (see RFC 2965). For more information on how to use relative paths
  in this argument, see: https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter
  @param {string}  domain   - [Optional] The domain from where the cookie will
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
          expiration = (if expires is Infinity then "; expires=Fri, 31 Dec 9999 23:59:59 GMT" else "; max-age=" + expires)
        when String
          expiration = "; expires=" + expires
        when Date
          expiration = "; expires=" + expires.toUTCString()
    document.cookie = encodeURIComponent(key) + "=" + encodeURIComponent(value) + expiration + ((if domain then "; domain=" + domain else "")) + ((if path then "; path=" + path else "")) + ((if secure then "; secure" else ""))
    true

  
  ###*
  @function
  @namespace Meteor.cookie
  @name remove
  @param {string}  key      - The name of the cookie to create/overwrite
  @param {string}  path     - [Optional] The path from where the cookie will be
  readable. E.g., "/", "/mydir"; if not specified, defaults to the current
  path of the current document location (string or null). The path must be
  absolute (see RFC 2965). For more information on how to use relative paths
  in this argument, see: https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter
  @param {string}  domain   - [Optional] The domain from where the cookie will
  be readable. E.g., "example.com", ".example.com" (includes all subdomains)
  or "subdomain.example.com"; if not specified, defaults to the host portion
  of the current document location (string or null).
  @description Remove a cookie.
  ###
  remove: (key, path, domain) ->
    if key
      return false  unless @has(key)
      document.cookie = encodeURIComponent(key) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ((if domain then "; domain=" + domain else "")) + ((if path then "; path=" + path else ""))
    else if @keys().length > 0 and @keys()[0] isnt ""
      @remove k for k in @keys()
      true
    else
      false

  
  ###*
  @function
  @namespace Meteor.cookie
  @name has
  @param {string}  key      - The name of the cookie to create/overwrite
  @description Check whether a cookie exists in the current position.
  @returns {boolean}
  ###
  has: (key) ->
    (if (not key) then (false) else ((new RegExp("(?:^|;\\s*)" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie)))

  
  ###*
  @function
  @namespace Meteor.cookie
  @name keys
  @description Returns an array of all readable cookies from this location.
  @returns {array}
  ###
  keys: ->
    keys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/)
    l = keys.length
    i = 0

    while i < l
      keys[i] = decodeURIComponent(keys[i])
      i++
    keys