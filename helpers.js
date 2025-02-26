const isStringifiedRegEx = /JSON\.parse\((.*)\)/;
const isTypedRegEx = /false|true|null/;

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
 * @name clone
 * @param {unknown} obj
 * @returns {unknown}
 * @summary Clone `obj` if `obj` is Object or Array
 */
export const clone = (obj) => {
  if (!isObject(obj)) {
    return obj;
  }
  return isArray(obj) ? [...obj] : { ...obj };
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
 * Serialize the a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
 * serialize('foo', 'bar', { httpOnly: true }) => "foo=bar; httpOnly"
 */
export const serialize = (key, val, opt = {}) => {
  let name;

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

  if (isNumber(opt.maxAge)) {
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
  } else if (isNumber(opt.expires)) {
    pairs.push(`Expires=${(new Date(opt.expires)).toUTCString()}`);
  }

  if (opt.httpOnly) {
    pairs.push('HttpOnly');
  }

  if (opt.secure) {
    pairs.push('Secure');
  }

  if (opt.partitioned) {
    pairs.push('Partitioned');
  }

  if (opt.priority) {
    const priority = typeof opt.priority === 'string' ? opt.priority.toLowerCase() : undefined;
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
      Meteor._debug(`[ostrio:cookies] [serialize] Cookie "${key}" has invalid value for "priority" option: "${opt.priority}" and was ignored`);
    }
  }

  if (opt.firstPartyOnly) {
    pairs.push('First-Party-Only');
  }

  if (opt.sameSite) {
    pairs.push(opt.sameSite === true ? 'SameSite' : `SameSite=${opt.sameSite}`);
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
