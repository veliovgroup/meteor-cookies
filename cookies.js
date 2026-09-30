import { Meteor } from 'meteor/meteor';
import * as helpers from './helpers.js';

let fetch;
let WebApp;

if (Meteor.isServer) {
  WebApp = require('meteor/webapp').WebApp;
} else {
  fetch = require('meteor/fetch').fetch;
}

const NoOp = () => {};
const urlRE = /\/___cookie___\/set\/?$/;
const rootUrl = Meteor.isServer ? process.env.ROOT_URL : (window.__meteor_runtime_config__?.ROOT_URL || window.__meteor_runtime_config__?.meteorEnv?.ROOT_URL || false);
const mobileRootUrl = Meteor.isServer ? process.env.MOBILE_ROOT_URL : (window.__meteor_runtime_config__?.MOBILE_ROOT_URL || window.__meteor_runtime_config__?.meteorEnv?.MOBILE_ROOT_URL || false);

/**
 * @function
 * @private
 * @name escapeRegExp
 * @param {string} str
 * @returns {string}
 * @summary Escape string for safe RegExp construction
 */
const escapeRegExp = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * @function
 * @private
 * @name normalizeOrigin
 * @param {string|boolean} url
 * @returns {string|boolean}
 * @summary Normalize URL string to origin
 */
const normalizeOrigin = (url) => {
  if (typeof url !== 'string') {
    return false;
  }

  const match = url.match(/^https?:\/\/[^/]+/i);
  return match ? match[0].replace(/\/+$/, '') : false;
};

/**
 * @function
 * @private
 * @name buildOriginRegExp
 * @param {string|boolean} root
 * @param {string|boolean} mobileRoot
 * @returns {RegExp|boolean}
 * @summary Build allowed origin RegExp from Meteor root URLs
 */
const buildOriginRegExp = (root, mobileRoot) => {
  const origins = [normalizeOrigin(root), normalizeOrigin(mobileRoot)].filter(Boolean);
  if (!origins.length) {
    return false;
  }

  return new RegExp(`^(?:${origins.map(escapeRegExp).join('|')})$`, 'i');
};

const originRE = buildOriginRegExp(rootUrl, mobileRootUrl);

/**
 * @function
 * @private
 * @name isSameOriginRequest
 * @param {object} headers - Request headers
 * @returns {boolean}
 * @summary Check that request comes from the server's own origin: `Origin` host equals `Host`, or no `Origin` and not a cross-site `Sec-Fetch-Site`
 */
const isSameOriginRequest = (headers) => {
  if (!headers.origin) {
    return headers['sec-fetch-site'] !== 'cross-site' && headers['sec-fetch-site'] !== 'same-site';
  }

  return typeof headers.host === 'string' && headers.origin.replace(/^https?:\/\//i, '').toLowerCase() === headers.host.toLowerCase();
};

/**
 * @function
 * @private
 * @name getQueryStringCookies
 * @param {IncomingMessage|object} req
 * @param {string} requestPath
 * @returns {string|boolean}
 * @summary Read decoded Cordova cookie payload from parsed query or request path
 */
const getQueryStringCookies = (req, requestPath) => {
  // `req.query` VALUES ARE ALREADY DECODED BY THE QUERY PARSER
  const query = req.query || {};
  let queryCookies = query.___cookies___;
  if (helpers.isArray(queryCookies)) {
    queryCookies = queryCookies[0];
  }

  if (typeof queryCookies === 'string') {
    return queryCookies;
  }

  const queryStart = requestPath.indexOf('?');
  if (queryStart === -1) {
    return false;
  }

  const pairs = requestPath.slice(queryStart + 1).split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const eqIndex = pair.indexOf('=');
    const key = eqIndex === -1 ? pair : pair.slice(0, eqIndex);

    if (key === '___cookies___') {
      return eqIndex === -1 ? '' : helpers.tryDecode(pair.slice(eqIndex + 1), decodeURIComponent);
    }
  }

  return false;
};

/**
 * @function
 * @private
 * @name parseQueryStringCookies
 * @param {string|boolean} queryCookies
 * @returns {object}
 * @summary Parse decoded Cordova cookie payload
 */
const parseQueryStringCookies = (queryCookies) => {
  if (typeof queryCookies !== 'string' || !queryCookies) {
    return {};
  }

  return helpers.parse(queryCookies);
};

/**
 * @locus Anywhere
 * @class CookiesCore
 * @param {object} [opts] - Options (configuration) object
 * @param {string} [opts.name='COOKIES_CORE'] - Name property for instance identification
 * @param {object|string} opts._cookies - Current cookies as String or Object
 * @param {number|boolean} opts.TTL - Default cookies expiration time (max-age) in milliseconds, by default - session (false)
 * @param {boolean} opts.runOnServer - Expose Cookies class to Server
 * @param {boolean} opts.setCookie - Set to `true` when `_cookies` option derives from `Set-Cookie` header
 * @param {http.ServerResponse|object} opts.response - This object is created internally by a HTTP server
 * @param {boolean} opts.allowQueryStringCookies - Allow passing Cookies in a query string (in URL). Primary should be used only in Cordova environment
 * @param {RegExp|boolean} opts.allowedCordovaOrigins - [Server] Allow setting Cookies from that specific origin which in Meteor/Cordova is localhost:12XXX (^http://localhost:12[0-9]{3}$)
 * @summary Internal Class
 */
class CookiesCore {
  constructor(opts = {}) {
    this.NAME = opts.name || 'COOKIES_CORE';
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
    } else if (!helpers.isRegExp(this.allowedCordovaOrigins)) {
      this.allowedCordovaOrigins = false;
    }

    this.originRE = originRE;

    if (helpers.isObject(opts._cookies)) {
      this.cookies = opts._cookies;
    } else if (typeof opts._cookies === 'string') {
      this.cookies = helpers.parse(opts._cookies, { setCookie: opts.setCookie });
    } else {
      this.cookies = {};
    }
  }

  /**
   * @locus Anywhere
   * @memberOf CookiesCore
   * @name get
   * @param {string} key - The name of the cookie to read
   * @param {string} _tmp - Unparsed string instead of user's cookies
   * @summary Read a cookie. If the cookie doesn't exist an undefined value will be returned.
   * @returns {string|void}
   */
  get(key, _tmp) {
    const cookieString = typeof _tmp === 'string' ? helpers.parse(_tmp) : this.cookies;
    if (!key || !cookieString) {
      return void 0;
    }

    if (helpers.hasOwn(cookieString, key)) {
      return helpers.deserialize(cookieString[key]);
    }

    return void 0;
  }

  /**
   * @locus Anywhere
   * @memberOf CookiesCore
   * @name set
   * @param {string} key - The name of the cookie to create/overwrite
   * @param {string} value - The value of the cookie
   * @param {CookieOptions} opts - [Optional] Cookie options (see readme docs)
   * @summary Create/overwrite a cookie.
   * @returns {boolean}
   */
  set(key, value, opts = {}) {
    if (key && !helpers.isUndefined(value)) {
      const cookieOpts = helpers.isObject(opts) ? { ...opts } : {};
      if (helpers.isNumber(this.TTL) && cookieOpts.expires === undefined) {
        cookieOpts.expires = new Date(+new Date() + this.TTL);
      }
      const { cookieString, sanitizedValue } = helpers.serialize(key, value, cookieOpts);

      this.cookies[key] = sanitizedValue;
      if (Meteor.isClient) {
        document.cookie = cookieString;
      } else if (this.response) {
        this.__setCookieHeader(cookieString);
      }
      return true;
    }
    return false;
  }

  /**
   * @locus Anywhere
   * @memberOf CookiesCore
   * @name remove
   * @param {string} [key] - The name of the cookie to remove; omit to remove all cookies
   * @param {string} path - [Optional] The path from where the cookie will be
   * readable. E.g., "/", "/mydir"; if not specified, defaults to `/`.
   * The path must be
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
    if (key && helpers.hasOwn(this.cookies, key)) {
      const { cookieString } = helpers.serialize(key, '', {
        domain,
        path,
        expires: new Date(0)
      });

      delete this.cookies[key];
      if (Meteor.isClient) {
        document.cookie = cookieString;
      } else if (this.response) {
        this.__setCookieHeader(cookieString);
      }
      return true;
    }

    // ONLY `.remove()` WITHOUT ARGUMENTS REMOVES ALL COOKIES
    // EMPTY STRING, `null`, OR OTHER FALSY KEY IS A NO-OP
    if (key === void 0) {
      const keys = this.keys().filter(Boolean);
      for (let i = 0; i < keys.length; i++) {
        this.remove(keys[i]);
      }
      return keys.length > 0;
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
    const cookieString = typeof _tmp === 'string' ? helpers.parse(_tmp) : this.cookies;
    if (!key || !cookieString) {
      return false;
    }

    return helpers.hasOwn(cookieString, key);
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
   * @summary Send all cookies over fetch to server.
   * @returns {void}
   */
  send(cb = NoOp) {
    if (Meteor.isServer) {
      cb(new Meteor.Error(400, 'Client only: `.send()` cannot be used on the Server'));
      return void 0;
    }

    if (this.runOnServer) {
      const { path, query } = this.__prepareSendData();

      fetch(`${path}${query}`, {
        credentials: 'include',
        mode: 'cors'
      }).then((response) => {
        this.cookies = helpers.parse(document.cookie);
        cb(void 0, response);
      }, cb);
    } else {
      cb(new Meteor.Error(400, 'Can\'t send cookies on server when `runOnServer` is false.'));
    }
    return void 0;
  }

  /**
   * @locus Client
   * @memberOf CookiesCore
   * @name sendAsync
   * @summary Send all cookies over fetch to server.
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

    const response = await fetch(`${path}${query}`, {
      credentials: 'include',
      mode: 'cors'
    });

    this.cookies = helpers.parse(document.cookie);
    return response;
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
        const { cookieString } = helpers.serialize(cookiesKeys[i], this.get(cookiesKeys[i]));
        const pair = cookieString.split('; ')[0];
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

  /**
   * @locus Server
   * @memberOf CookiesCore
   * @name __setCookieHeader
   * @param {string} cookieString
   * @summary Append a Set-Cookie header value to current response
   * @returns {void}
   * @private
   */
  __setCookieHeader(cookieString) {
    if (!this.response || !helpers.isFunction(this.response.setHeader)) {
      return;
    }

    // RE-READ HEADER ON EACH CALL TO KEEP `Set-Cookie` VALUES WRITTEN BY OTHER CODE
    if (helpers.isFunction(this.response.getHeader)) {
      const currentHeader = this.response.getHeader('Set-Cookie');
      if (helpers.isArray(currentHeader)) {
        this.__pendingCookies = currentHeader.slice();
      } else if (currentHeader) {
        this.__pendingCookies = [currentHeader];
      } else {
        this.__pendingCookies = [];
      }
    }

    this.__pendingCookies.push(cookieString);
    this.response.setHeader('Set-Cookie', this.__pendingCookies);
  }
}

/**
 * @locus Anywhere
 * @class Cookies
 * @extends CookiesCore
 * @param {object} [opts]
 * @param {string} [opts.name='COOKIES'] - Name property for instance identification
 * @param {number} opts.TTL - Default cookies expiration time (max-age) in milliseconds, by default - session (false)
 * @param {boolean} opts.auto - [Server] Auto-bind in middleware as `req.Cookies`, by default `true`
 * @param {function} opts.handler - [Server] Custom Middleware handler that receives a CookiesCore instance
 * @param {function} opts.onCookies - [Server] Hook/Callback called when cookies are received via `.send` and `.sendAsync` methods from server
 * @param {boolean} opts.runOnServer - Expose Cookies class to Server
 * @param {boolean} opts.allowQueryStringCookies - Allow passing Cookies in a query string (in URL). Primary should be used only in Cordova environment
 * @param {RegExp|boolean} opts.allowedCordovaOrigins - [Server] Allow setting Cookies from that specific origin which in Meteor/Cordova is localhost:12XXX (^http://localhost:12[0-9]{3}$)
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
   * @summary __instances - Live server instances with `runOnServer: true`, candidates to take over middleware
   * @type {Set<Cookies>}
   * @static
   */
  static __instances = new Set();

  /**
   * @summary __owner - Instance which middleware logic currently runs
   * @type {Cookies|null}
   * @static
   */
  static __owner = null;

  /**
   * @summary __isDispatcherAttached - `true` after `Cookies.__dispatch` was passed to `WebApp.connectHandlers.use()`
   * @type {boolean}
   * @static
   */
  static __isDispatcherAttached = false;

  /**
   * @summary __dispatch - Single `WebApp` middleware, delegates to current auto-middleware owner
   * @type {function(req: IncomingMessage, res: ServerResponse, next: NextFunction): void | Promise<void>}
   * @static
   */
  static __dispatch = (req, res, next) => {
    const owner = Cookies.__owner;
    if (!owner || owner.__isManual) {
      next();
      return void 0;
    }
    return owner.__autoMiddleware(req, res, next);
  };

  constructor(_opts = {}) {
    const opts = { ..._opts };
    opts.name = typeof opts.name === 'string' ? opts.name : 'COOKIES';
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
      this._coreInstancesCount = 0;
      this.isDestroyed = false;
      this.hasMiddleware = false;
      this.__isManual = false;

      if (helpers.isFunction(opts.onCookies)) {
        // `onCookies` HOOK REQUIRES AT LEAST ONE REGISTERED MIDDLEWARE
        // PREVIOUSLY REGISTERED MIDDLEWARES ARE CHECKED VIA Cookies.isMiddlewareRegistered
        // AND IF `opts.auto: true` WE KNOW THAT NEW MIDDLEWARE WILL BE REGISTERED
        if ((!opts.auto && !Cookies.isMiddlewareRegistered)) {
          Meteor._debug('[ostrio:cookies] [WARNING] {onCookies} has no effect when {auto: false}. `onCookies` hook would not run!', this.NAME);
        } else {
          Cookies.__hooks.set(this.id, opts.onCookies);
        }
      }

      if (helpers.isFunction(opts.handler)) {
        Cookies.__handlers.set(this.id, opts.handler);
      }

      if (opts.runOnServer) {
        Cookies.__instances.add(this);
      }

      // IF `new Cookies()` CALLED MULTIPLE TIMES ON THE SERVER
      // ONLY ONE INSTANCE OWNS MIDDLEWARE; WHEN IT'S DESTROYED
      // ANOTHER LIVE INSTANCE TAKES OVER, SEE `.destroy()`
      if (opts.runOnServer && opts.auto && !Cookies.isMiddlewareRegistered) {
        this.__takeOver();
      }
    }
  }

  /**
   * @locus Server
   * @memberOf Cookies
   * @name __takeOver
   * @param {boolean} [isManual=false] - `true` when middleware is returned from `.middleware()`
   * @summary Make this instance the middleware owner, attach `Cookies.__dispatch` once
   * @returns {void}
   * @private
   */
  __takeOver(isManual = false) {
    if (Cookies.__owner) {
      Cookies.__owner.hasMiddleware = false;
    }

    Cookies.__owner = this;
    Cookies.isMiddlewareRegistered = true;
    this.hasMiddleware = true;
    this.__isManual = isManual;

    if (!isManual && !Cookies.__isDispatcherAttached) {
      Cookies.__isDispatcherAttached = true;
      WebApp.connectHandlers.use(Cookies.__dispatch);
    }
  }

  /**
   * @locus Server
   * @memberOf Cookies
   * @name middleware
   * @summary Get CookiesCore instance into callback
   * @throws {Meteor.Error}
   * @returns {function(req: IncomingMessage, res: ServerResponse, next: NextFunction): void | Promise<void>}
   */
  middleware() {
    if (!Meteor.isServer) {
      throw new Meteor.Error(500, 'Server only: `.middleware()` cannot be used on the Client');
    }

    if (!this.opts.runOnServer) {
      throw new Meteor.Error(400, 'Can\'t use middleware when `runOnServer` is false.');
    }

    if (Cookies.isMiddlewareRegistered) {
      Meteor._debug('[ostrio:cookies] [WARNING] Middleware already registered! All subsequent middleware registration will have no effect as it will execute same logic and call the same hooks/callbacks', this.NAME);
      return this.__blankMiddleware.bind(this);
    }

    this.__takeOver(true);

    return async (req, res, next) => {
      if (Cookies.__owner !== this) {
        next();
        return;
      }

      req.Cookies = this.__getCookiesCore(req, res);
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

    Cookies.__instances.delete(this);
    if (Cookies.__owner === this) {
      Cookies.__owner = null;
      Cookies.isMiddlewareRegistered = false;
      this.hasMiddleware = false;

      // HAND MIDDLEWARE OVER TO ANOTHER LIVE INSTANCE, PREFER `{auto: true}`
      let successor = null;
      for (const instance of Cookies.__instances) {
        if (instance.opts.auto) {
          successor = instance;
          break;
        }
        successor = successor || instance;
      }

      if (successor) {
        successor.__takeOver();
      }
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
        cookiesCore = this.__getCookiesCore(req, res);
      }

      for (const [_id, handler] of map) {
        try {
          await handler(cookiesCore);
        } catch (error) {
          Meteor._debug('[ostrio:cookies] Error in `handler` callback or `onCookies` hook', this.NAME, _id, error);
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

    const requestPath = (req._parsedUrl && req._parsedUrl.path) || req.url || '';
    const queryStart = requestPath.indexOf('?');

    if (urlRE.test(queryStart === -1 ? requestPath : requestPath.slice(0, queryStart))) {
      res.statusCode = 200;

      const headers = req.headers || {};
      const matchedCordovaOrigin = !!headers.origin
        && this.allowedCordovaOrigins
        && this.allowedCordovaOrigins.test(headers.origin);

      const matchedOrigin = matchedCordovaOrigin
        || (!!headers.origin && this.originRE && this.originRE.test(headers.origin));

      // REJECT CROSS-SITE REQUESTS, SO OTHER WEBSITES CAN'T TRIGGER `onCookies` HOOKS
      if (!matchedOrigin && !isSameOriginRequest(headers)) {
        res.statusCode = 403;
        res.end();
        return;
      }

      if (matchedOrigin) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', headers.origin);
      }

      // ONLY CORDOVA/DESKTOP QUERY-STRING COOKIES ARE SET ON THE SERVER ORIGIN
      // REQUEST `Cookie` HEADER IS NEVER ECHOED BACK, AS IT WOULD STRIP
      // ORIGINAL ATTRIBUTES (HttpOnly, Secure, SameSite, Expires)
      if (matchedCordovaOrigin && this.opts.allowQueryStringCookies) {
        const cookiesObject = parseQueryStringCookies(getQueryStringCookies(req, requestPath));
        const cookiesKeys = Object.keys(cookiesObject);
        if (cookiesKeys.length) {
          const cookiesArray = [];
          for (let i = 0; i < cookiesKeys.length; i++) {
            cookiesArray.push(helpers.serialize(cookiesKeys[i], cookiesObject[cookiesKeys[i]]).cookieString);
          }
          res.setHeader('Set-Cookie', cookiesArray);

          req.Cookies = this.__getCookiesCore(req, res);
          Object.assign(req.Cookies.cookies, cookiesObject);
        }
      }

      await this.__execute(req, res, Cookies.__hooks);
      res.setHeader('Content-Type', 'text/plain');
      res.end();
    } else {
      req.Cookies = this.__getCookiesCore(req, res);
      await this.__execute(req, res, Cookies.__handlers);
      next();
    }
  }

  /**
   * @locus Server
   * @memberOf Cookies
   * @summary Creates new CookiesCore instance
   * @param {IncomingMessage} request
   * @param {ServerResponse} response
   * @returns {CookiesCore}
   * @private
   */
  __getCookiesCore(request, response) {
    let _cookies = {};

    if (request.headers && request.headers.cookie) {
      _cookies = helpers.parse(request.headers.cookie);
    }

    this._coreInstancesCount++;
    return new CookiesCore({
      _cookies,
      TTL: this.opts.TTL,
      runOnServer: this.opts.runOnServer,
      response,
      allowQueryStringCookies: this.opts.allowQueryStringCookies,
      name: `CORE_${this._coreInstancesCount}_BY_${this.NAME}`,
    });
  }
}

/* Export the Cookies and CookiesCore classes */
export { Cookies, CookiesCore };
