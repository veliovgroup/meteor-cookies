###
@url https://github.com/jshttp/cookie/blob/master/index.js
@name cookie
@author jshttp
@license
(The MIT License)

Copyright (c) 2012-2014 Roman Shtylman <shtylman@gmail.com>
Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
###

decode = decodeURIComponent
encode = encodeURIComponent
pairSplitRegExp = /; */

###
# RegExp to match field-content in RFC 7230 sec 3.2
#
# field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
# field-vchar   = VCHAR / obs-text
# obs-text      = %x80-FF
###

fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/

###
# Parse a cookie header.
#
# Parse the given cookie header string into an object
# The object has the various cookies as keys(names) => values
#
# @param {string} str
# @param {object} [options]
# @return {object}
# @public
###

parse = (str, options) ->
  if typeof str != 'string'
    throw new TypeError('argument str must be a string')
  obj = {}
  opt = options or {}
  pairs = str.split(pairSplitRegExp)
  dec = opt.decode or decode
  pairs.forEach (pair) ->
    eq_idx = pair.indexOf('=')
    # skip things that don't look like key=value
    if eq_idx < 0
      return
    key = pair.substr(0, eq_idx).trim()
    val = pair.substr(++eq_idx, pair.length).trim()
    # quoted values
    if '"' == val[0]
      val = val.slice(1, -1)
    # only assign once
    if undefined == obj[key]
      obj[key] = tryDecode(val, dec)
    return
  obj

###
# Serialize data into a cookie header.
#
# Serialize the a name value pair into a cookie string suitable for
# http headers. An optional options object specified cookie parameters.
#
# serialize('foo', 'bar', { httpOnly: true })
#   => "foo=bar; httpOnly"
#
# @param {string} name
# @param {string} val
# @param {object} [options]
# @return {string}
# @public
###

serialize = (name, val, options) ->
  opt = options or {}
  enc = opt.encode or encode
  if !fieldContentRegExp.test(name)
    throw new TypeError('argument name is invalid')
  if val
    value = enc(val) 
    if value and !fieldContentRegExp.test(value)
      throw new TypeError('argument val is invalid')
  else
    value = ''
  pairs = [ name + '=' + value ]
  if opt.maxAge
    maxAge = opt.maxAge - 0
    if isNaN(maxAge)
      throw new Error('maxAge should be a Number')
    pairs.push 'Max-Age=' + maxAge
  if opt.domain
    if !fieldContentRegExp.test(opt.domain)
      throw new TypeError('option domain is invalid')
    pairs.push 'Domain=' + opt.domain
  else
    pairs.push 'Domain='
  if opt.path
    if !fieldContentRegExp.test(opt.path)
      throw new TypeError('option path is invalid')
    pairs.push 'Path=' + opt.path
  else
    pairs.push 'Path=/'
  opt.expires = opt.expires or opt.expire
  if opt.expires
    if opt.expires is Infinity
      pair.push 'Expires=Fri, 31 Dec 9999 23:59:59 GMT'
    else if opt.expires instanceof Date
      pairs.push 'Expires=' + opt.expires.toUTCString()
    else if _.isNumber opt.expires
      pairs.push 'Expires=' + (new Date(opt.expires)).toUTCString()
  if opt.httpOnly
    pairs.push 'HttpOnly'
  if opt.secure
    pairs.push 'Secure'
  if opt.firstPartyOnly
    pairs.push 'First-Party-Only'
  pairs.join '; '

###
# Try decoding a string using a decoding function.
#
# @param {string} str
# @param {function} decode
# @private
###

tryDecode = (str, decode) ->
  try
    return decode(str)
  catch e
    return str
  return


if Meteor.isServer
  bound = Meteor.bindEnvironment (callback) -> callback()

class __cookies
  constructor: (_cookies, @collection, @TTL) ->
    if _.isObject _cookies
      @cookies = _cookies
    else
      @cookies = parse _cookies

  ###
  @function
  @namespace __cookies
  @name get
  @param {String} key   - The name of the cookie to read
  @param {String} _tmp  - Unparsed string instead of user's cookies
  @description Read a cookie. If the cookie doesn't exist a null value will be returned.
  ###
  get: (key, _tmp) ->
    if _tmp 
      _cs = parse _tmp
    else
      _cs = @cookies

    if not key or not _cs
      null
    else 
      if _cs?[key] then _cs[key] else null

  
  ###
  @function
  @namespace __cookies
  @name set
  @param {String}  key          - The name of the cookie to create/overwrite
  @param {String}  value        - The value of the cookie
  @param {Number}  opts.expires - [Optional] The max-age in seconds (e.g. 31536e3
  for a year, Infinity for a never-expires cookie), or the expires date in
  GMTString format or as Date object; if not specified the cookie will
  expire at the end of session (number – finite or Infinity – string, Date object or null).
  @param {String}  opts.path    - [Optional] The path from where the cookie will be
  readable. E.g., "/", "/mydir"; if not specified, defaults to the current
  path of the current document location (string or null). The path must be
  absolute (see RFC 2965). For more information on how to use relative paths
  in this argument, see: https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter
  @param {String}  opts.domain   - [Optional] The domain from where the cookie will
  be readable. E.g., "example.com", ".example.com" (includes all subdomains)
  or "subdomain.example.com"; if not specified, defaults to the host portion
  of the current document location (string or null).
  @param {Boolean} opts.secure  - [Optional] The cookie will be transmitted only
  over secure protocol as https (boolean or null).
  @description Create/overwrite a cookie.
  ###
  set: (key, value, opts = {}) ->
    if key and value
      opts.expires ?= new Date (+new Date) + @TTL
      opts.path    ?= '/'
      opts.domain  ?= ''
      opts.secure  ?= ''
      
      newCookie = serialize key, value, opts
      @cookies[key] = value

      if Meteor.isClient
        document.cookie = newCookie
      else
        @collection.update {_id: @cookies['___utid___']}, $addToSet: toSet: newCookie
      true
    else
      false

  
  ###
  @function
  @namespace __cookies
  @name remove
  @param {String} key      - The name of the cookie to create/overwrite
  @param {String} path     - [Optional] The path from where the cookie will be
  readable. E.g., "/", "/mydir"; if not specified, defaults to the current
  path of the current document location (string or null). The path must be
  absolute (see RFC 2965). For more information on how to use relative paths
  in this argument, see: https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter
  @param {String} domain   - [Optional] The domain from where the cookie will
  be readable. E.g., "example.com", ".example.com" (includes all subdomains)
  or "subdomain.example.com"; if not specified, defaults to the host portion
  of the current document location (string or null).
  @description Remove a cookie(s).
  ###
  remove: (key, path = '/', domain = '') ->
    if key
      newCookie = serialize key, '', {domain, path, expires: new Date(0)}
      return false unless @has(key)

      delete @cookies[key]
      if Meteor.isClient
        document.cookie = newCookie
      else
        @collection.update {_id: @cookies['___utid___']}, $addToSet: toSet: newCookie
      true
    else if @keys().length > 0 and @keys()[0] isnt ""
      @remove k for k in @keys() when k isnt '___utid___'
      true
    else
      false

  
  ###
  @function
  @namespace __cookies
  @name has
  @param {String} key  - The name of the cookie to create/overwrite
  @param {String} _tmp - Parsed string instead of user's cookies
  @description Check whether a cookie exists in the current position.
  @returns {boolean}
  ###
  has: (key, _tmp) ->
    if _tmp 
      _cs = parse _tmp
    else
      _cs = @cookies

    if not key or not _cs
      return false
    else 
      !!_cs?[key]

  
  ###
  @function
  @namespace __cookies
  @name keys
  @description Returns an array of all readable cookies from this location.
  @returns {[String]}
  ###
  keys: -> if @cookies then _.without Object.keys(@cookies), '___utid___' else []

  ###
  @function
  @namespace __cookies
  @name apply
  @description Send all cookies over XHR to server.
  @returns {void}
  ###
  apply: -> HTTP.get '/___cookie___/set', () -> return

CookiesTTL = 1000 * 60 * 60 * 24 * 31
Cookies = {}
if Meteor.isServer
  bound ->
    cookiesCollection = new Mongo.Collection '___cookies___'
    cookiesCollection._ensureIndex {expire: 1}, {expireAfterSeconds: 0, background: true}
    cookiesCollection.deny
      insert: -> true
      update: -> true
      remove: -> true

    WebApp.connectHandlers.use (req, res, next) ->
      if req._parsedUrl.path is '/___cookie___/set'
        res.end 'true'
      else
        if req.headers?.cookie
          _cookies = parse req.headers.cookie
        else
          _cookies = {}

        if _cookies['___utid___']
          _storedCookies = cookiesCollection.findOne _cookies['___utid___']
          unless _storedCookies
            cookiesCollection.insert 
              _id:    _cookies['___utid___']
              toSet:  []
              expire: (+new Date) + CookiesTTL
          else
            cookiesCollection.update {_id: _cookies['___utid___']}, $set: expire: (+new Date) + CookiesTTL
            _cookies = _.extend parse(_storedCookies.value), _cookies if _storedCookies?.value
            if _storedCookies.toSet
              for cookie in _storedCookies.toSet
                res.setHeader 'Set-Cookie', cookie 
                _cookie = parse cookie

              cookiesCollection.update {_id: _cookies['___utid___']}, $set: toSet: []
        else
          expire = (+new Date) + CookiesTTL
          _id = cookiesCollection.insert {expire}
          res.setHeader 'Set-Cookie', serialize '___utid___', _id, expires: new Date expire
          _cookies = _.extend _cookies, ___utid___: _id
        
        req.Cookies = new __cookies _cookies, cookiesCollection, CookiesTTL
        next()
else
  Cookies = {}
  Cookies = new __cookies document.cookie, null, CookiesTTL
  Cookies.set '___utid___', Random.id(), expires: new Date 253402300799000 unless Cookies.has '___utid___'