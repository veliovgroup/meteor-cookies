import { Meteor } from 'meteor/meteor';

let fetch;
let WebApp;

if (Meteor.isServer) {
  WebApp = require('meteor/webapp').WebApp;
} else {
  fetch = require('meteor/fetch').fetch;
}

const NoOp  = () => {};
const urlRE = /\/___cookie___\/set/;
const rootUrl = Meteor.isServer ? process.env.ROOT_URL : (window.__meteor_runtime_config__?.ROOT_URL || window.__meteor_runtime_config__?.meteorEnv?.ROOT_URL || false);
const mobileRootUrl = Meteor.isServer ? process.env.MOBILE_ROOT_URL : (window.__meteor_runtime_config__?.MOBILE_ROOT_URL || window.__meteor_runtime_config__?.meteorEnv?.MOBILE_ROOT_URL || false);

const helpers = {
  isUndefined(obj) {
    return obj === void 0;
  },
  isArray(obj) {
    return Array.isArray(obj);
  },
  clone(obj) {
    if (!this.isObject(obj)) {
      return obj;
    }
    return this.isArray(obj) ? [...obj] : { ...obj };
  },
  isNumber(obj) {
    return Object.prototype.toString.call(obj) === '[object Number]';
  },
  isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
  },
  isFunction(obj) {
    if (this.isUndefined(obj)) {
      return false;
    }
    const type = Object.prototype.toString.call(obj);
    return type === '[object Function]' || type === '[object AsyncFunction]';
  },
};

/**
 * @function
 * @name customEscape
 * @param {string} str
 * @returns {string}
 * @summary Custom implementation for deprecated `escape` function
 * @private
 */
const customEscape = (str) => {
  return String(str).replace(/[^A-Za-z0-9@*\_\+\-\.\/]/g, (ch) => {
    const code = ch.charCodeAt(0);
    if (code < 256) {
      let hex = code.toString(16).toUpperCase();
      return '%' + (hex.length === 1 ? '0' + hex : hex);
    }

    let hex = code.toString(16).toUpperCase();
    // Ensure 4-digit hexadecimal
    while (hex.length < 4) {
      hex = '0' + hex;
    }
    return '%u' + hex;
  });
};

/**
 * @function
 * @name customUnescape
 * @param {string} str
 * @returns {string}
 * @summary Custom implementation for deprecated `unescape` function
 * @private
 */
const customUnescape = (str) => {
  return String(str).replace(/(%u[0-9A-Fa-f]{4})|(%[0-9A-Fa-f]{2})/g, (match) => {
    if (match.startsWith('%u')) {
      return String.fromCharCode(parseInt(match.slice(2), 16));
    }

    return String.fromCharCode(parseInt(match.slice(1), 16));
  });
};

/**
 * @url https://github.com/jshttp/cookie/blob/master/index.js
 * @name cookie
 * @author jshttp
 * @license
 * (The MIT License)
 *
 * Copyright (c) 2012-2014 Roman Shtylman <shtylman@gmail.com>
 * Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
const decode = decodeURIComponent;
const encode = encodeURIComponent;
const cookieSplitRegExp = /; */;
const setCookieSplitRegExp = /, */;

/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */
const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

/**
 * @function
 * @name tryDecode
 * @param {string} str
 * @param {function} d
 * @summary Try decoding a string using a decoding function.
 * @private
 */
const tryDecode = (str, d) => {
  try {
    return d(str);
  } catch (_e) {
    return str;
  }
};

/**
 * @function
 * @name parse
 * @param {string} str
 * @param { setCookie: boolean, decode: function } [options]
 * @returns {[key: string]: unknown}
 * @summary
 * Parse a cookie header.
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 * @private
 */
const parse = (str, options) => {
  if (typeof str !== 'string') {
    throw new Meteor.Error(404, 'argument str must be a string');
  }
  const obj = {};
  const opt = options || { setCookie: false };
  let val;
  let key;
  let eqIndx;

  str.split(opt.setCookie ? setCookieSplitRegExp : cookieSplitRegExp).forEach((_pair) => {
    let pair = _pair;
    if (opt.setCookie) {
      pair = pair.split(cookieSplitRegExp)[0];
    }

    eqIndx = pair.indexOf('=');
    if (eqIndx < 0) {
      return;
    }

    key = pair.slice(0, eqIndx).trim();
    key = tryDecode(customUnescape(key), (opt.decode || decode));
    val = pair.slice(++eqIndx).trim();
    if (val[0] === '"') {
      val = val.slice(1, -1);
    }

    if (void 0 === obj[key]) {
      obj[key] = tryDecode(val, (opt.decode || decode));
    }
  });
  return obj;
};

/**
 * @function
 * @name antiCircular
 * @param data {object} - Circular or any other object which needs to be non-circular
 * @returns {string}
 * @private
 */
const antiCircular = (_obj) => {
  const object = helpers.clone(_obj);
  const cache = new WeakMap();
  return JSON.stringify(object, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.get(value)) {
        return void 0;
      }
      cache.set(value, true);
    }
    return value;
  });
};

/**
 * @function
 * @private
 * @name serialize
 * @param {string} name
 * @param {string} val
 * @param {object} [options]
 * @returns { cookieString: string, sanitizedValue: unknown }
 * @summary
 * Serialize data into a cookie header.
 * Serialize the a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
 * serialize('foo', 'bar', { httpOnly: true }) => "foo=bar; httpOnly"
 */
const serialize = (key, val, opt = {}) => {
  let name;

  if (!fieldContentRegExp.test(key)) {
    name = customEscape(key);
  } else {
    name = key;
  }

  let sanitizedValue = val;
  let value = val;
  if (!helpers.isUndefined(value)) {
    if (helpers.isObject(value) || helpers.isArray(value)) {
      const stringified = antiCircular(value);
      value = encode(`JSON.parse(${stringified})`);
      sanitizedValue = JSON.parse(stringified);
    } else {
      value = encode(value);
      if (value && !fieldContentRegExp.test(value)) {
        value = customEscape(value);
      }
    }
  } else {
    value = '';
  }

  const pairs = [`${name}=${value}`];

  if (helpers.isNumber(opt.maxAge)) {
    pairs.push(`Max-Age=${opt.maxAge}`);
  }

  if (opt.domain && typeof opt.domain === 'string') {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new Meteor.Error(404, 'option domain is invalid');
    }
    pairs.push(`Domain=${opt.domain}`);
  }

  if (opt.path && typeof opt.path === 'string') {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new Meteor.Error(404, 'option path is invalid');
    }
    pairs.push(`Path=${opt.path}`);
  } else {
    pairs.push('Path=/');
  }

  opt.expires = opt.expires || opt.expire || false;
  if (opt.expires === Infinity) {
    pairs.push('Expires=Fri, 31 Dec 9999 23:59:59 GMT');
  } else if (opt.expires instanceof Date) {
    pairs.push(`Expires=${opt.expires.toUTCString()}`);
  } else if (opt.expires === 0) {
    pairs.push('Expires=0');
  } else if (helpers.isNumber(opt.expires)) {
    pairs.push(`Expires=${(new Date(opt.expires)).toUTCString()}`);
  }

  if (opt.httpOnly) {
    pairs.push('HttpOnly');
  }

  if (opt.secure) {
    pairs.push('Secure');
  }

  if (opt.firstPartyOnly) {
    pairs.push('First-Party-Only');
  }

  if (opt.sameSite) {
    pairs.push(opt.sameSite === true ? 'SameSite' : `SameSite=${opt.sameSite}`);
  }

  return { cookieString: pairs.join('; '), sanitizedValue };
};

const isStringifiedRegEx = /JSON\.parse\((.*)\)/;
const isTypedRegEx = /false|true|null/;
const deserialize = (string) => {
  if (typeof string !== 'string') {
    return string;
  }

  if (isStringifiedRegEx.test(string)) {
    let obj = string.match(isStringifiedRegEx)[1];
    if (obj) {
      try {
        return JSON.parse(decode(obj));
      } catch (e) {
        Meteor._debug('[ostrio:cookies] [.get()] [deserialize()] Exception:', e, string, obj);
        return string;
      }
    }
    return string;
  } else if (isTypedRegEx.test(string)) {
    try {
      return JSON.parse(string);
    } catch (_e) {
      return string;
    }
  }
  return string;
};

/**
 * @locus Anywhere
 * @class CookiesCore
 * @param {object} opts - Options (configuration) object
 * @param {object|string} opts._cookies - Current cookies as String or Object
 * @param {number|boolean} opts.TTL - Default cookies expiration time (max-age) in milliseconds, by default - session (false)
 * @param {boolean} opts.runOnServer - Expose Cookies class to Server
 * @param {boolean} opts.setCookie - Set to `true` when `_cookies` option derivative of `Set-Cookie` header
 * @param {http.ServerResponse|object} opts.response - This object is created internally by a HTTP server
 * @param {boolean} opts.allowQueryStringCookies - Allow passing Cookies in a query string (in URL). Primary should be used only in Cordova environment
 * @param {Regex|boolean} opts.allowedCordovaOrigins - [Server] Allow setting Cookies from that specific origin which in Meteor/Cordova is localhost:12XXX (^http://localhost:12[0-9]{3}$)
 * @summary Internal Class
 */
class CookiesCore {
  constructor(opts) {
    this.NAME = 'COOKIES_CORE';
    this.id = Symbol(this.NAME);

    this.__pendingCookies = [];
    this.TTL = opts.TTL || false;
    this.response = opts.response || false;
    this.setCookie = opts.setCookie || false;
    this.runOnServer = opts.runOnServer || false;
    this.allowQueryStringCookies = opts.allowQueryStringCookies || false;
    this.allowedCordovaOrigins = opts.allowedCordovaOrigins || false;

    if (this.allowedCordovaOrigins === true) {
      this.allowedCordovaOrigins = /^http:\/\/localhost:12[0-9]{3}$/;
    }

    this.originRE = new RegExp(`^https?:\/\/(${rootUrl ? rootUrl : ''}${mobileRootUrl ? ('|' + mobileRootUrl) : ''})$`);

    if (helpers.isObject(opts._cookies)) {
      this.cookies = opts._cookies;
    } else {
      this.cookies = parse(opts._cookies, { setCookie: opts.setCookie });
    }
  }

  /**
   * @locus Anywhere
   * @memberOf CookiesCore
   * @name get
   * @param {string} key - The name of the cookie to read
   * @param {string} _tmp - Unparsed string instead of user's cookies
   * @summary Read a cookie. If the cookie doesn't exist a undefined value will be returned.
   * @returns {string|void}
   */
  get(key, _tmp) {
    const cookieString = _tmp ? parse(_tmp) : this.cookies;
    if (!key || !cookieString) {
      return void 0;
    }

    if (cookieString.hasOwnProperty(key)) {
      return deserialize(cookieString[key]);
    }

    return void 0;
  }

  /**
   * @locus Anywhere
   * @memberOf CookiesCore
   * @name set
   * @param {string} key   - The name of the cookie to create/overwrite
   * @param {string} value - The value of the cookie
   * @param {object} opts  - [Optional] Cookie options (see readme docs)
   * @summary Create/overwrite a cookie.
   * @returns {boolean}
   */
  set(key, value, opts = {}) {
    if (key && !helpers.isUndefined(value)) {
      if (helpers.isNumber(this.TTL) && opts.expires === undefined) {
        opts.expires = new Date(+new Date() + this.TTL);
      }
      const { cookieString, sanitizedValue } = serialize(key, value, opts);

      this.cookies[key] = sanitizedValue;
      if (Meteor.isClient) {
        document.cookie = cookieString;
      } else if (this.response) {
        this.__pendingCookies.push(cookieString);
        this.response.setHeader('Set-Cookie', this.__pendingCookies);
      }
      return true;
    }
    return false;
  }

  /**
   * @locus Anywhere
   * @memberOf CookiesCore
   * @name remove
   * @param {string} key - The name of the cookie to create/overwrite
   * @param {string} path - [Optional] The path from where the cookie will be
   * readable. E.g., "/", "/mydir"; if not specified, defaults to the current
   * path of the current document location (string or null). The path must be
   * absolute (see RFC 2965). For more information on how to use relative paths
   * in this argument, see: https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter
   * @param {string} domain - [Optional] The domain from where the cookie will
   * be readable. E.g., "example.com", ".example.com" (includes all subdomains)
   * or "subdomain.example.com"; if not specified, defaults to the host portion
   * of the current document location (string or null).
   * @summary Remove a cookie(s).
   * @returns {boolean}
   */
  remove(key, path = '/', domain = '') {
    if (key && this.cookies.hasOwnProperty(key)) {
      const { cookieString } = serialize(key, '', {
        domain,
        path,
        expires: new Date(0)
      });

      delete this.cookies[key];
      if (Meteor.isClient) {
        document.cookie = cookieString;
      } else if (this.response) {
        this.response.setHeader('Set-Cookie', cookieString);
      }
      return true;
    }

    if (!key && this.keys().length > 0 && this.keys()[0] !== '') {
      const keys = Object.keys(this.cookies);
      for (let i = 0; i < keys.length; i++) {
        this.remove(keys[i]);
      }
      return true;
    }

    return false;
  }

  /**
   * @locus Anywhere
   * @memberOf CookiesCore
   * @name has
   * @param {string} key - The name of the cookie to create/overwrite
   * @param {string} _tmp - Unparsed string instead of user's cookies
   * @summary Check whether a cookie exists in the current position.
   * @returns {boolean}
   */
  has(key, _tmp) {
    const cookieString = _tmp ? parse(_tmp) : this.cookies;
    if (!key || !cookieString) {
      return false;
    }

    return cookieString.hasOwnProperty(key);
  }

  /**
   * @locus Anywhere
   * @memberOf CookiesCore
   * @name keys
   * @summary Returns an array of all readable cookies from this location.
   * @returns {string[]}
   */
  keys() {
    if (this.cookies) {
      return Object.keys(this.cookies);
    }
    return [];
  }

  /**
   * @locus Client
   * @memberOf CookiesCore
   * @name send
   * @param cb {function} - Callback
   * @summary Send all cookies over XHR to server.
   * @returns {void}
   */
  send(cb = NoOp) {
    if (Meteor.isServer) {
      cb(new Meteor.Error(400, 'Client only: `.send()` cannot be used on the Server'));
    }

    if (this.runOnServer) {
      const { path, query } = this.__prepareSendData();

      fetch(`${path}${query}`, {
        credentials: 'include',
        type: 'cors'
      }).then((response) => {
        cb(void 0, response);
      }).catch(cb);
    } else {
      cb(new Meteor.Error(400, 'Can\'t send cookies on server when `runOnServer` is false.'));
    }
    return void 0;
  }

  /**
   * @locus Client
   * @memberOf CookiesCore
   * @name sendAsync
   * @summary Send all cookies over XHR to server.
   * @throws {Meteor.Error|TypeError}
   * @returns {Promise<Response>}
   */
  async sendAsync() {
    if (Meteor.isServer) {
      throw new Meteor.Error(400, 'Client only: `.sendAsync()` cannot be used on the Server');
    }

    if (!this.runOnServer) {
      throw new Meteor.Error(400, 'Can\'t send cookies on server when `runOnServer` is false.');
    }

    const { path, query } = this.__prepareSendData();

    return await fetch(`${path}${query}`, {
      credentials: 'include',
      type: 'cors'
    });
  }

  /**
   * @locus Client
   * @memberOf CookiesCore
   * @name __prepareSendData
   * @summary Prepare `path` and `query` for `.send()` and `.sendAsync()` methods
   * @returns { path: string, query: string }
   * @private
   */
  __prepareSendData() {
    let path = `${window.__meteor_runtime_config__?.ROOT_URL_PATH_PREFIX || window.__meteor_runtime_config__?.meteorEnv?.ROOT_URL_PATH_PREFIX || ''}/___cookie___/set`;
    let query = '';

    if ((Meteor.isCordova || Meteor.isDesktop) && this.allowQueryStringCookies) {
      const cookiesKeys = this.keys();
      const cookiesArray = [];
      for (let i = 0; i < cookiesKeys.length; i++) {
        const { sanitizedValue } = serialize(cookiesKeys[i], this.get(cookiesKeys[i]));
        const pair = `${cookiesKeys[i]}=${sanitizedValue}`;
        if (!cookiesArray.includes(pair)) {
          cookiesArray.push(pair);
        }
      }

      if (cookiesArray.length) {
        path = Meteor.absoluteUrl('___cookie___/set');
        query = `?___cookies___=${encodeURIComponent(cookiesArray.join('; '))}`;
      }
    }

    return { path, query };
  }
}

/**
 * @locus Anywhere
 * @class Cookies
 * @extends CookiesCore
 * @param {object} opts
 * @param {number} opts.TTL - Default cookies expiration time (max-age) in milliseconds, by default - session (false)
 * @param {boolean} opts.auto - [Server] Auto-bind in middleware as `req.Cookies`, by default `true`
 * @param {function} opts.handler - [Server] Custom Middleware handler
 * @param {function} opts.onCookies - [Server] Hook/Callback that called when cookies are received via `.send` and `.sendAsync` methods from server
 * @param {boolean} opts.runOnServer - Expose Cookies class to Server
 * @param {boolean} opts.allowQueryStringCookies - Allow passing Cookies in a query string (in URL). Primary should be used only in Cordova environment
 * @param {Regex|boolean} opts.allowedCordovaOrigins - [Server] Allow setting Cookies from that specific origin which in Meteor/Cordova is localhost:12XXX (^http://localhost:12[0-9]{3}$)
 * @summary Main Cookies class; Private methods have `__` prefix
 */
class Cookies extends CookiesCore {
  /**
   * @summary __handlers - Map with all registered `handler` callbacks
   * @type {Map<string, function(cookies: CookiesCore): void>}
   * @static
   */
  static __handlers = new Map();

  /**
   * @summary __hooks - Map with all registered `onCookies` hooks
   * @type {Map<string, function(req: IncomingMessage, res: ServerResponse, next: function(): void): void>}
   * @static
   */
  static __hooks = new Map();

  /**
   * @summary isMiddlewareRegistered - Check if at least single global middleware was registered
   * @type {boolean}
   * @static
   */
  static isMiddlewareRegistered = false;

  /**
   * @function
   * @locus Server
   * @summary Creates new CookiesCore instance
   * @param {IncomingMessage} request
   * @param {ServerResponse} response
   * @param { runOnServer: boolean, allowQueryStringCookies: boolean, TTL: number|boolean } opts
   * @returns {CookiesCore}
   * @throws {Meteor.Error}
   * @static
   */
  static __getCookiesCore = (request, response, opts) => {
    let _cookies = {};
    if (!opts.runOnServer) {
      throw new Meteor.Error(400, 'Can\'t use middleware when `runOnServer` is false.');
    }

    if (request.headers && request.headers.cookie) {
      _cookies = parse(request.headers.cookie);
    }

    return new CookiesCore({
      _cookies,
      TTL: opts.TTL,
      runOnServer: opts.runOnServer,
      response,
      allowQueryStringCookies: opts.allowQueryStringCookies
    });
  };

  constructor(opts = {}) {
    opts.TTL = helpers.isNumber(opts.TTL) ? opts.TTL : false;
    opts.runOnServer = (opts.runOnServer !== false) ? true : false;
    opts.allowQueryStringCookies = (opts.allowQueryStringCookies !== true) ? false : true;

    if (Meteor.isClient) {
      opts._cookies = document.cookie;
      super(opts);
    } else {
      opts._cookies = {};
      super(opts);
      opts.auto = (opts.auto !== false) ? true : false;
      this.opts = opts;
      this.isDestroyed = false;
      this.hasMiddleware = false;

      if (helpers.isFunction(opts.onCookies)) {
        // `onCokies` HOOK REQUIRES AT LEAST ONE REGISTERED MIDDLEWARE
        // PREVIOUSLY REGISTERED MIDDLEWARES ARE CHECKED VIA Cookies.isMiddlewareRegistered
        // AND IF `opts.auto: true` WE KNOW THAT NEW MIDDLEWARE WILL BE REGISTERED
        if ((!opts.auto && !Cookies.isMiddlewareRegistered)) {
          Meteor._debug('[ostrio:cookies] [WARNING] {onCookies} has no effect when {auto: false}. `onCookies` hook would not run!');
        } else {
          Cookies.__hooks.set(this.id, opts.onCookies);
        }
      }

      if (helpers.isFunction(opts.handler)) {
        Cookies.__handlers.set(this.id, opts.handler);
      }

      // IF `new Cookies()` CALLED MULTIPLE TIMES ON THE SERVER
      // WE LIMIT REGISTERED MIDDLEWARES TO 1
      // IF ORIGINAL Cookies INSTANCE HAS CALLED .destroy()
      // WE ALLOW NEW MIDDLEWARE REGISTRATIONS BY FLAGGING
      // Cookies.isMiddlewareRegistered AS false
      if (opts.runOnServer && opts.auto && !Cookies.isMiddlewareRegistered) {
        this.hasMiddleware = true;
        Cookies.isMiddlewareRegistered = true;
        WebApp.connectHandlers.use(this.__autoMiddleware.bind(this));
      }
    }
  }

  /**
   * @locus Server
   * @memberOf Cookies
   * @name middleware
   * @summary Get Cookies instance into callback
   * @throws {Meteor.Error}
   * @returns {function(req: IncomingMessage, res: ServerResponse, next: NextFunction): void}
   */
  middleware() {
    if (!Meteor.isServer) {
      throw new Meteor.Error(500, 'Server only: `.middleware()` cannot be used on the Client');
    }

    if (Cookies.isMiddlewareRegistered) {
      Meteor._debug('[ostrio:cookies] [WARNING] Middleware already registered! All consequent middleware registration will have no effect as it will execute same logic and call the same hooks/callbacks');
      return this.__blankMiddleware.bind(this);
    }

    this.hasMiddleware = true;
    Cookies.isMiddlewareRegistered = true;

    return async (req, res, next) => {
      if (this.isDestroyed) {
        next();
        return;
      }

      req.Cookies = Cookies.__getCookiesCore(req, res, this.opts);
      await this.__execute(req, res, Cookies.__handlers);
      next();
    };
  }

  /**
   * @locus Server
   * @memberOf Cookies
   * @name Destroy
   * @summary Unregister hooks, callbacks, and middleware
   * @throws {Meteor.Error}
   * @returns {boolean}
   */
  destroy() {
    if (!Meteor.isServer) {
      throw new Meteor.Error(500, 'Server only: `.destroy()` cannot be used on the Client');
    }

    if (this.isDestroyed) {
      return false;
    }

    if (this.hasMiddleware) {
      Cookies.isMiddlewareRegistered = false;
    }

    this.isDestroyed = true;
    Cookies.__hooks.delete(this.id);
    Cookies.__handlers.delete(this.id);
    this.opts = null;
    this.response = null;
    this.cookies = null;
    this.__pendingCookies = null;
    return true;
  }

  /**
   * @locus Server
   * @memberOf Cookies
   * @name __execute
   * @param {IncomingMessage} req
   * @param {ServerResponse} res
   * @param {Map} map
   * @summary Execute globally registered handlers or hooks
   * @returns {Promise<boolean>}
   * @private
   */
  async __execute(req, res, map) {
    let cookiesCore = req.Cookies;
    if (map.size) {
      if (!cookiesCore) {
        cookiesCore = Cookies.__getCookiesCore(req, res, this.opts);
      }

      for (const [_id, handler] of map) {
        try {
          await handler(cookiesCore);
        } catch (error) {
          Meteor._debug('[ostrio:cookies] Error in `handler` or `onCookies` hook', _id, error);
        }
      }
      return true;
    }
    return false;
  }

  /**
   * @locus Server
   * @memberOf Cookies
   * @name __blankMiddleware
   * @param {IncomingMessage} _req
   * @param {ServerResponse} _res
   * @param {NextFunction} next
   * @summary Blank middleware that instantly calls NextFunction;
   * @returns {void}
   * @private
   */
  __blankMiddleware(_req, _res, next) {
    next();
  }

  /**
   * @locus Server
   * @memberOf Cookies
   * @name __autoMiddleware
   * @param {IncomingMessage} req
   * @param {ServerResponse} res
   * @param {NextFunction} next
   * @summary Default middleware that used when `{auto: true}` (default option)
   * @returns {Promise<void>}
   * @private
   */
  async __autoMiddleware(req, res, next) {
    if (this.isDestroyed) {
      next();
      return;
    }

    if (urlRE.test(req._parsedUrl.path)) {
      const matchedCordovaOrigin = !!req.headers.origin
        && this.allowedCordovaOrigins
        && this.allowedCordovaOrigins.test(req.headers.origin);
      const matchedOrigin = matchedCordovaOrigin
        || (!!req.headers.origin && this.originRE.test(req.headers.origin));

      if (matchedOrigin) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      }

      const cookiesArray = [];
      let cookiesObject = {};
      if (matchedCordovaOrigin && this.opts.allowQueryStringCookies && req.query.___cookies___) {
        cookiesObject = parse(decodeURIComponent(req.query.___cookies___));
      } else if (req.headers.cookie) {
        cookiesObject = parse(req.headers.cookie);
      }

      const cookiesKeys = Object.keys(cookiesObject);
      if (cookiesKeys.length) {
        for (let i = 0; i < cookiesKeys.length; i++) {
          const { cookieString } = serialize(cookiesKeys[i], cookiesObject[cookiesKeys[i]]);
          if (!cookiesArray.includes(cookieString)) {
            cookiesArray.push(cookieString);
          }
        }

        if (cookiesArray.length) {
          res.setHeader('Set-Cookie', cookiesArray);
        }
      }

      await this.__execute(req, res, Cookies.__hooks);
      res.writeHead(200);
      res.end('');
    } else {
      req.Cookies = Cookies.__getCookiesCore(req, res, this.opts);
      await this.__execute(req, res, Cookies.__handlers);
      next();
    }
  }
}

/* Export the Cookies and CookiesCore classes */
export { Cookies, CookiesCore };
