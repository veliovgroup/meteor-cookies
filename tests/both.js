import { Cookies, CookiesCore } from 'meteor/ostrio:cookies';
import { antiCircular, clone, deserialize, isFunction, parse, serialize, tryDecode } from '../helpers';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

Tinytest.add('Class - Cookies', (test) => {
  test.isTrue(isFunction(Cookies), 'Cookies is function');
  test.isTrue(Function.prototype.toString.call(Cookies).startsWith('class Cookies extends CookiesCore'), 'Cookies is class extends CookiesCore');
  test.instanceOf(Cookies.__handlers, Map, 'Cookies.__handlers instance of Map');
  test.instanceOf(Cookies.__hooks, Map, 'Cookies.__hooks instance of Map');
  test.isTrue(typeof Cookies.isMiddlewareRegistered === 'boolean', 'Cookies.isMiddlewareRegistered is boolean');
});

Tinytest.add('Class - CookiesCore', (test) => {
  test.isTrue(isFunction(CookiesCore), 'CookiesCore is function');
  test.isTrue(Function.prototype.toString.call(CookiesCore).startsWith('class CookiesCore'), 'CookiesCore is class');
});

Tinytest.add('Class - Cookies instance', (test) => {
  const name = Random.id();
  const cookiesInstance = new Cookies({
    name,
    auto: false
  });

  test.instanceOf(cookiesInstance, Cookies, 'cookiesInstance instance of Cookies');
  test.equal(cookiesInstance.NAME, name, 'cookiesInstance has correct NAME property');
  test.isTrue(isFunction(cookiesInstance.get), 'Cookies#get is function');
  test.isTrue(isFunction(cookiesInstance.set), 'Cookies#set is function');
  test.isTrue(isFunction(cookiesInstance.remove), 'Cookies#remove is function');
  test.isTrue(isFunction(cookiesInstance.has), 'Cookies#has is function');
  test.isTrue(isFunction(cookiesInstance.keys), 'Cookies#keys is function');
  test.isTrue(isFunction(cookiesInstance.send), 'Cookies#send is function');
  test.isTrue(isFunction(cookiesInstance.sendAsync), 'Cookies#sendAsync is function');
  test.isTrue(isFunction(cookiesInstance.__prepareSendData), 'Cookies#__prepareSendData is function');
  test.isTrue(isFunction(cookiesInstance.middleware), 'Cookies#middleware is function');
  test.isTrue(isFunction(cookiesInstance.destroy), 'Cookies#destroy is function');
  test.isTrue(isFunction(cookiesInstance.__execute), 'Cookies#__execute is function');
  test.isTrue(isFunction(cookiesInstance.__blankMiddleware), 'Cookies#__blankMiddleware is function');
  test.isTrue(isFunction(cookiesInstance.__autoMiddleware), 'Cookies#__autoMiddleware is function');
  test.isTrue(isFunction(cookiesInstance.__getCookiesCore), 'Cookies#__getCookiesCore is function');

  test.include(cookiesInstance, 'NAME');
  test.include(cookiesInstance, 'id');

  if (Meteor.isServer) {
    test.isFalse(cookiesInstance.hasMiddleware);
    test.include(cookiesInstance, 'opts');
    test.isFalse(cookiesInstance.opts.auto);
    test.include(cookiesInstance.opts, 'TTL');
    test.include(cookiesInstance.opts, 'runOnServer');
    test.include(cookiesInstance.opts, 'allowQueryStringCookies');

    test.isFalse(cookiesInstance.isDestroyed);
    test.isTrue(cookiesInstance.destroy());
    test.isTrue(cookiesInstance.isDestroyed);
    test.isFalse(cookiesInstance.destroy());
  }
});

Tinytest.add('Class - CookiesCore instance', (test) => {
  const name = Random.id();
  const cookiesCoreInstance = new CookiesCore({ name });
  test.instanceOf(cookiesCoreInstance, CookiesCore, 'cookiesCoreInstance instance of Cookies');

  test.equal(cookiesCoreInstance.NAME, name, 'cookiesCoreInstance has correct NAME property');
  test.isTrue(isFunction(cookiesCoreInstance.get), 'CookiesCore#get is function');
  test.isTrue(isFunction(cookiesCoreInstance.set), 'CookiesCore#set is function');
  test.isTrue(isFunction(cookiesCoreInstance.remove), 'CookiesCore#remove is function');
  test.isTrue(isFunction(cookiesCoreInstance.has), 'CookiesCore#has is function');
  test.isTrue(isFunction(cookiesCoreInstance.keys), 'CookiesCore#keys is function');
  test.isTrue(isFunction(cookiesCoreInstance.send), 'CookiesCore#send is function');
  test.isTrue(isFunction(cookiesCoreInstance.sendAsync), 'CookiesCore#sendAsync is function');
  test.isTrue(isFunction(cookiesCoreInstance.__prepareSendData), 'CookiesCore#__prepareSendData is function');

  test.include(cookiesCoreInstance, 'NAME');
  test.include(cookiesCoreInstance, 'id');
  test.include(cookiesCoreInstance, 'TTL');
  test.include(cookiesCoreInstance, 'response');
  test.include(cookiesCoreInstance, 'setCookie');
  test.include(cookiesCoreInstance, 'runOnServer');
  test.include(cookiesCoreInstance, 'allowQueryStringCookies');
  test.include(cookiesCoreInstance, 'allowedCordovaOrigins');
  test.include(cookiesCoreInstance, 'originRE');
  test.include(cookiesCoreInstance, 'cookies');
});

Tinytest.add('helpers: clone returns separate shallow arrays and objects', (test) => {
  const array = ['one', 'two'];
  const object = { key: 'value' };
  const arrayClone = clone(array);
  const objectClone = clone(object);

  test.equal(arrayClone, array, 'Array clone has same values');
  test.isTrue(arrayClone !== array, 'Array clone is a separate array');
  test.equal(objectClone, object, 'Object clone has same values');
  test.isTrue(objectClone !== object, 'Object clone is a separate object');
});

Tinytest.add('helpers: parse supports Object prototype cookie names', (test) => {
  const cookies = parse('__proto__=proto-value; constructor=constructor-value; hasOwnProperty=own-value');

  test.equal(Object.getPrototypeOf(cookies), null, 'Parsed cookies use null prototype');
  test.equal(cookies.__proto__, 'proto-value', '__proto__ cookie is readable');
  test.equal(cookies.constructor, 'constructor-value', 'constructor cookie is readable');
  test.equal(cookies.hasOwnProperty, 'own-value', 'hasOwnProperty cookie is readable');
});

Tinytest.add('helpers: deserialize only parses exact serialized JSON wrapper', (test) => {
  const plainString = 'prefix JSON.parse({"safe":true}) suffix';
  const serialized = parse(serialize('json', { safe: true }).cookieString).json;

  test.equal(deserialize(plainString), plainString, 'Embedded JSON.parse text stays string');
  test.equal(deserialize(serialized), { safe: true }, 'Serialized JSON wrapper parses to object');
});

Tinytest.add('helpers: serialize preserves expiry options without mutating caller input', (test) => {
  const options = {
    expires: 0,
    expire: Infinity,
    path: '/custom'
  };
  const { cookieString } = serialize('expiry', 'value', options);

  test.notInclude(cookieString, 'Expires=', 'Explicit expires: 0 creates session cookie');
  test.notInclude(cookieString, '9999', 'expires takes precedence over expire alias');
  test.equal(options, {
    expires: 0,
    expire: Infinity,
    path: '/custom'
  }, 'Options object is not mutated');
});

Tinytest.add('helpers: serialize ignores invalid expires values', (test) => {
  const invalidNumber = serialize('invalidNumber', 'value', { expires: NaN }).cookieString;
  const invalidDate = serialize('invalidDate', 'value', { expires: new Date(NaN) }).cookieString;

  test.notInclude(invalidNumber, 'Invalid Date', 'NaN expires does not emit invalid date');
  test.notInclude(invalidDate, 'Invalid Date', 'Invalid Date expires does not emit invalid date');
  test.notInclude(invalidNumber, 'Expires=', 'NaN expires is ignored');
  test.notInclude(invalidDate, 'Expires=', 'Invalid Date expires is ignored');
});

Tinytest.add('helpers: serialize ignores invalid maxAge and floors fractions', (test) => {
  test.notInclude(serialize('a', 'b', { maxAge: NaN }).cookieString, 'Max-Age', 'NaN maxAge is ignored');
  test.notInclude(serialize('a', 'b', { maxAge: Infinity }).cookieString, 'Max-Age', 'Infinity maxAge is ignored');
  test.include(serialize('a', 'b', { maxAge: 1.9 }).cookieString, 'Max-Age=1;', 'Fractional maxAge is floored');
});

Tinytest.add('helpers: serialize prevents attribute injection via name, path, and domain', (test) => {
  const key = 'name; Domain=evil.com=';
  const { cookieString } = serialize(key, 'value');

  test.notInclude(cookieString, 'Domain=evil.com', 'Cookie name cannot inject attributes');
  test.equal(parse(cookieString.split('; ')[0])[key], 'value', 'Escaped cookie name round-trips');
  test.throws(() => serialize('a', 'b', { path: '/; Domain=evil.com' }), /path is invalid/);
  test.throws(() => serialize('a', 'b', { domain: 'example.com; Secure' }), /domain is invalid/);
});

Tinytest.add('helpers: object values with percent signs round-trip through parse', (test) => {
  const value = { percent: '100%', encoded: '%41', nested: ['%E0%A4%A'] };
  const parsed = parse(serialize('percent', value).cookieString.split('; ')[0]);

  test.equal(deserialize(parsed.percent), value, 'Object with % characters round-trips');
  test.equal(deserialize(`JSON.parse(${encodeURIComponent('{"legacy":true}')})`), { legacy: true }, 'Legacy double-encoded payload still parses');
});

Tinytest.add('Class - CookiesCore get() and has() respect empty temporary cookie string', (test) => {
  const cookies = new CookiesCore({
    _cookies: {
      session: 'stored'
    }
  });

  test.isUndefined(cookies.get('session', ''), 'Empty temporary cookie string does not fall back to instance cookies');
  test.isFalse(cookies.has('session', ''), 'Empty temporary cookie string has no instance cookies');
});

Tinytest.add('Class - CookiesCore set() with expires: 0 overrides TTL with session cookie', (test) => {
  const cookies = new CookiesCore({ TTL: 60000 });
  const response = { headers: {}, setHeader(name, value) { this.headers[name] = value; }, getHeader(name) { return this.headers[name]; } };
  cookies.response = response;
  cookies.set('session', 'value', { expires: 0 });

  if (Meteor.isServer) {
    test.equal(response.getHeader('Set-Cookie'), ['session=value; Path=/'], 'No Expires attribute');
  }
  test.equal(cookies.get('session'), 'value');
  cookies.remove('session');
});

Tinytest.add('Class - CookiesCore remove() with empty or null key is a no-op', (test) => {
  const cookies = new CookiesCore({
    _cookies: {
      first: '1',
      second: '2'
    }
  });

  test.isFalse(cookies.remove(''), 'remove("") returns false');
  test.isFalse(cookies.remove(null), 'remove(null) returns false');
  test.equal(cookies.keys(), ['first', 'second'], 'Cookies are kept');
  test.isTrue(cookies.remove(), 'remove() without arguments removes all');
  test.equal(cookies.keys(), [], 'All cookies removed');
  test.isFalse(cookies.remove(), 'remove() on empty set returns false');
});

Tinytest.add('helpers: serialize writes all cookie attributes', (test) => {
  const date = new Date(Date.UTC(2030, 0, 1));
  const { cookieString } = serialize('attrs', 'value', {
    domain: 'example.com',
    expires: date,
    httpOnly: true,
    secure: true,
    partitioned: true,
    priority: 'HIGH',
    firstPartyOnly: true,
    sameSite: 'Strict'
  });

  test.equal(cookieString, `attrs=value; Domain=example.com; Path=/; Expires=${date.toUTCString()}; HttpOnly; Secure; Partitioned; Priority=High; First-Party-Only; SameSite=Strict`, 'All attributes in order');
});

Tinytest.add('helpers: serialize expires and sameSite variants', (test) => {
  const timestamp = Date.UTC(2030, 0, 1);
  test.include(serialize('a', 'b', { expires: Infinity }).cookieString, 'Expires=Fri, 31 Dec 9999 23:59:59 GMT', 'Infinity expires never expires');
  test.include(serialize('a', 'b', { expires: timestamp }).cookieString, `Expires=${new Date(timestamp).toUTCString()}`, 'Numeric expires is a timestamp');
  test.isTrue(serialize('a', 'b', { sameSite: true }).cookieString.endsWith('; SameSite'), 'sameSite: true writes bare SameSite');
});

Tinytest.add('helpers: serialize priority values', (test) => {
  test.include(serialize('a', 'b', { priority: 'low' }).cookieString, 'Priority=Low', 'low');
  test.include(serialize('a', 'b', { priority: 'Medium' }).cookieString, 'Priority=Medium', 'Medium');
  test.include(serialize('a', 'b', { priority: 'high' }).cookieString, 'Priority=High', 'high');
  test.notInclude(serialize('a', 'b', { priority: 'urgent' }).cookieString, 'Priority', 'Invalid string priority is ignored');
  test.notInclude(serialize('a', 'b', { priority: 1 }).cookieString, 'Priority', 'Non-string priority is ignored');
});

Tinytest.add('helpers: serialize edge-case inputs', (test) => {
  test.equal(serialize('a', 'b', null).cookieString, 'a=b; Path=/', 'Non-object options are ignored');
  test.equal(serialize('a', undefined).cookieString, 'a=; Path=/', 'Undefined value writes empty value');
  test.equal(serialize('a', undefined).sanitizedValue, undefined, 'Undefined value is kept as sanitized value');
  test.isTrue(serialize('a\u0001b', 'c').cookieString.startsWith('a%01b=c'), 'Control char in name is zero-padded');
  test.isTrue(serialize('a;', 'c').cookieString.startsWith('a%3B=c'), '`;` in name is escaped');
});

Tinytest.add('helpers: parse edge-case inputs', (test) => {
  test.throws(() => parse(null), /argument str must be a string/, 'Non-string throws');
  test.equal({ ...parse('a="quoted value"') }, { a: 'quoted value' }, 'Quotes are stripped');
  test.equal({ ...parse('a=first; a=second') }, { a: 'first' }, 'First duplicate wins');
  test.equal({ ...parse('a=%E0%A4%A') }, { a: '%E0%A4%A' }, 'Malformed percent-encoding is kept');
  test.equal({ ...parse('a="x,b=y"; Path=/, c=d', { setCookie: true }) }, { a: 'x,b=y', c: 'd' }, 'Comma inside quotes does not split Set-Cookie');
  test.equal(tryDecode('%E0%A4%A', decodeURIComponent), '%E0%A4%A', 'tryDecode returns input on error');
});

Tinytest.add('helpers: clone, antiCircular and deserialize edge cases', (test) => {
  const obj = { a: 1 };
  test.equal(clone(obj), obj, 'Object is cloned');
  test.isFalse(clone(obj) === obj, 'Object clone is a copy');
  test.equal(clone(1), 1, 'Primitive is returned as is');
  test.equal(antiCircular('str'), 'str', 'antiCircular returns primitive as is');
  test.equal(deserialize(1), 1, 'Non-string is returned as is');
  test.equal(deserialize('JSON.parse()'), 'JSON.parse()', 'Empty JSON wrapper stays string');
  test.equal(deserialize('JSON.parse({broken)'), 'JSON.parse({broken)', 'Invalid JSON wrapper stays string');
  test.equal(deserialize('true'), true, 'Typed value is parsed');
});
