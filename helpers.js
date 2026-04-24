const isStringifiedRegEx = /^JSON\.parse\((.*)\)$/;
const isTypedRegEx = /^(false|true|null)$/;
const cookiePairStartRegExp = /^[^=;,]+=/;

/**
 * @function
 * @private
 * @name isNumber
 * @param {unknown} obj
 * @returns {boolean}
 * @summary Check if `obj` is Number
 */
export const isNumber = (obj) => {
  return Object.prototype.toString.call(obj) === '[object Number]';
};

/**
 * @function
 * @private
 * @name isObject
 * @param {unknown} obj
 * @returns {boolean}
 * @summary Check if `obj` is Object
 */
export const isObject = (obj) => {
  return Object.prototype.toString.call(obj) === '[object Object]';
};

/**
 * @function
 * @private
 * @name isUndefined
 * @param {unknown} obj
 * @returns {boolean}
 * @summary Check if `obj` is undefined
 */
export const isUndefined = (obj) => {
  return obj === void 0;
};

/**
 * @function
 * @private
 * @name isArray
 * @param {unknown} obj
 * @returns {boolean}
 * @summary Check if `obj` is Array
 */
export const isArray = (obj) => {
  return Array.isArray(obj);
};

/**
 * @function
 * @private
 * @name isFunction
 * @param {unknown} obj
 * @returns {boolean}
 * @summary Check if `obj` is Function or AsyncFunction
 */
export const isFunction = (obj) => {
  if (isUndefined(obj)) {
    return false;
  }
  const type = Object.prototype.toString.call(obj);
  return type === '[object Function]' || type === '[object AsyncFunction]';
};

/**
 * @function
 * @private
 * @name isRegExp
 * @param {unknown} obj
 * @returns {boolean}
 * @summary Check if `obj` is RegExp
 */
export const isRegExp = (obj) => {
  return Object.prototype.toString.call(obj) === '[object RegExp]';
};

/**
 * @function
 * @private
 * @name hasOwn
 * @param {object} obj
 * @param {string} key
 * @returns {boolean}
 * @summary Safely check if `obj` has own `key`
 */
export const hasOwn = (obj, key) => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

/**
 * @function
 * @private
 * @name clone
 * @param {unknown} obj
 * @returns {unknown}
 * @summary Clone `obj` if `obj` is Object or Array
 */
export const clone = (obj) => {
  if (isArray(obj)) {
    return [...obj];
  }

  if (isObject(obj)) {
    return { ...obj };
  }

  return obj;
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
 * @name isCookiePairStart
 * @param {string} str
 * @param {number} index
 * @returns {boolean}
 * @summary Check if `str` starts with Set-Cookie pair at `index`
 * @private
 */
const isCookiePairStart = (str, index) => {
  let pos = index;
  while (str[pos] === ' ') {
    pos++;
  }
  return cookiePairStartRegExp.test(str.slice(pos));
};

/**
 * @function
 * @name splitSetCookieString
 * @param {string} str
 * @returns {string[]}
 * @summary Split combined Set-Cookie header without splitting Expires date commas
 * @private
 */
const splitSetCookieString = (str) => {
  const cookies = [];
  let start = 0;
  let inQuotes = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && char === ',' && isCookiePairStart(str, i + 1)) {
      cookies.push(str.slice(start, i));
      start = i + 1;
    }
  }

  cookies.push(str.slice(start));
  return cookies;
};

/**
 * @function
 * @name tryDecode
 * @param {string} str
 * @param {function} d
 * @summary Try decoding a string using a decoding function.
 * @private
 */
export const tryDecode = (str, d) => {
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
export const parse = (str, options) => {
  if (typeof str !== 'string') {
    throw new Meteor.Error(404, 'argument str must be a string');
  }
  const obj = Object.create(null);
  const opt = options || { setCookie: false };
  let val;
  let key;
  let eqIndx;

  (opt.setCookie ? splitSetCookieString(str) : str.split(cookieSplitRegExp)).forEach((_pair) => {
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

    if (!hasOwn(obj, key)) {
      obj[key] = tryDecode(val, (opt.decode || decode));
    }
  });
  return obj;
};

/**
 * @function
 * @name antiCircular
 * @param data {object|array} - Circular or any other object which needs to be non-circular
 * @returns {string}
 * @private
 */
export const antiCircular = (_obj) => {
  if (!isObject(_obj) && !isArray(_obj)) {
    return _obj;
  }

  const object = clone(_obj);
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
 * Serialize a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
 * serialize('foo', 'bar', { httpOnly: true }) => "foo=bar; httpOnly"
 */
export const serialize = (key, val, opt = {}) => {
  let name;
  const options = isObject(opt) ? opt : {};

  if (!fieldContentRegExp.test(key)) {
    name = customEscape(key);
  } else {
    name = key;
  }

  let sanitizedValue = val;
  let value = val;
  if (!isUndefined(value)) {
    if (isObject(value) || isArray(value)) {
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

  if (isNumber(options.maxAge)) {
    pairs.push(`Max-Age=${options.maxAge}`);
  }

  if (options.domain && typeof options.domain === 'string') {
    if (!fieldContentRegExp.test(options.domain)) {
      throw new Meteor.Error(404, 'option domain is invalid');
    }
    pairs.push(`Domain=${options.domain}`);
  }

  if (options.path && typeof options.path === 'string') {
    if (!fieldContentRegExp.test(options.path)) {
      throw new Meteor.Error(404, 'option path is invalid');
    }
    pairs.push(`Path=${options.path}`);
  } else {
    pairs.push('Path=/');
  }

  const expires = hasOwn(options, 'expires') ? options.expires : options.expire;
  if (expires === Infinity) {
    pairs.push('Expires=Fri, 31 Dec 9999 23:59:59 GMT');
  } else if (expires instanceof Date && !Number.isNaN(expires.valueOf())) {
    pairs.push(`Expires=${expires.toUTCString()}`);
  } else if (expires === 0) {
    pairs.push('Expires=0');
  } else if (isNumber(expires) && isFinite(expires)) {
    pairs.push(`Expires=${(new Date(expires)).toUTCString()}`);
  }

  if (options.httpOnly) {
    pairs.push('HttpOnly');
  }

  if (options.secure) {
    pairs.push('Secure');
  }

  if (options.partitioned) {
    pairs.push('Partitioned');
  }

  if (options.priority) {
    const priority = typeof options.priority === 'string' ? options.priority.toLowerCase() : void 0;
    switch (priority) {
    case 'low':
      pairs.push('Priority=Low');
      break;
    case 'medium':
      pairs.push('Priority=Medium');
      break;
    case 'high':
      pairs.push('Priority=High');
      break;
    default:
      Meteor._debug(`[ostrio:cookies] [serialize] Cookie "${key}" has invalid value for "priority" option: "${options.priority}" and was ignored`);
    }
  }

  if (options.firstPartyOnly) {
    pairs.push('First-Party-Only');
  }

  if (options.sameSite) {
    pairs.push(options.sameSite === true ? 'SameSite' : `SameSite=${options.sameSite}`);
  }

  return { cookieString: pairs.join('; '), sanitizedValue };
};

/**
 * @function
 * @private
 * @name deserialize
 * @param {string} string
 * @returns {string}
 * @summary Parse string that was composed by `serialize` function
 */
export const deserialize = (string) => {
  if (typeof string !== 'string') {
    return string;
  }

  if (isStringifiedRegEx.test(string)) {
    let obj = string.match(isStringifiedRegEx)[1];
    if (obj) {
      try {
        return JSON.parse(decode(obj));
      } catch (e) {
        Meteor._debug('[ostrio:cookies] [deserialize()] Exception:', e, string, obj);
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
