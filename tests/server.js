import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Cookies, CookiesCore } from 'meteor/ostrio:cookies';
import { antiCircular, isArray, isObject, serialize } from '../helpers';

const circularObj = {key: '1', key2: {key1: 1, key2: false, key3: [true, false]}};
circularObj.self = circularObj;

const circularArr = [true, false, null, {key1: 1, key2: false, key3: [true, false]}, [1, 2, 3, '4', '5']];
circularArr.push(circularArr);
circularArr.push(circularObj);

const testKeyVals = [{
  key: '⦁',
  value: '⦶'
}, {
  key: '小飼弾',
  value: '小飼弾\n小飼弾'
}, {
  key: 'фывфыв',
  value: 'йцукен\nнекуцй'
}, {
  key: 'device undefined',
  value: 'Device undefined ('
}, {
  key: 'testFalse',
  value: false
}, {
  key: 'testTrue',
  value: true
}, {
  key: 'testNull',
  value: null
}, {
  key: 'testObject',
  value: {key: '1', key2: {key1: 1, key2: false, key3: [true, false]}}
}, {
  key: 'testObjectCircular',
  value: circularObj
}, {
  key: 'testArray',
  value: [true, false, null, {key1: 1, key2: false, key3: [true, false]}, [1, 2, 3, '4', '5']]
}, {
  key: 'testArrayCircular',
  value: circularArr
}];

new Cookies({
  name: 'GLOBAL_COOKIE_HANDLER',
  auto: true,
  onCookies(cookies) {
    if (cookies.has('TEST-TO-REMOVE')) {
      cookies.remove('TEST-TO-REMOVE');
    }

    if (cookies.has('TEST-ADD-FROM-SERVER')) {
      cookies.set('ADDED-FROM-SERVER', true);
    }
  }
});

const ENDPOINT_COOKIES_SET = Meteor.absoluteUrl('___cookie___/set');
const PATH_COOKIES_TEST = 'test/cookies';
const ENDPOINT_COOKIES_TEST = Meteor.absoluteUrl(PATH_COOKIES_TEST);

WebApp.connectHandlers.use('/' + PATH_COOKIES_TEST, (_req, res) => {
  res.statusCode = 200;
  res.end('cookies test endpoint');
});

const mockResponse = () => {
  const headers = {};
  return {
    headers,
    statusCode: 0,
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
    },
    getHeader(name) {
      return headers[name.toLowerCase()];
    },
    end() {
      this.ended = true;
    }
  };
};

Tinytest.addAsync('Server: Invalid cookie header', async (test, next) => {
  const request = { headers: { cookie: 'invalidCookieWithoutEquals' }, _parsedUrl: { path: '/some/path' } };
  const res = new (require('stream').PassThrough)();
  const cookiesInstance = new Cookies({ auto: false, runOnServer: true });
  try {
    const coreInstance = cookiesInstance.__getCookiesCore(request, res);
    test.equal(coreInstance.keys().length, 0, 'Invalid cookie header yields no cookies');
  } catch (e) {
    test.fail(e);
  }
  cookiesInstance.destroy();
  next();
});

Tinytest.addAsync('Server: client methods throws - send', (test, next) => {
  const cookiesInstance = new Cookies({ name: test.test_case.name, auto: false, runOnServer: true });
  cookiesInstance.send((error, response) => {
    test.instanceOf(error, Meteor.Error, '.send() returns error on server');
    test.include(error.message, 'Client only', 'error.message has "Client only"');
    test.include(error.reason, 'Client only', 'error.reason has "Client only"');
    test.equal(error.error, 400, 'error.error is 400');
    test.isUndefined(response, 'response is undefined');
    cookiesInstance.destroy();
    next();
  });
});

Tinytest.add('Server: Set-Cookie parser preserves Expires date commas', (test) => {
  const cookies = new CookiesCore({
    _cookies: 'first=one; Expires=Wed, 21 Oct 2030 07:28:00 GMT; Path=/, second=two; Path=/',
    setCookie: true
  });

  test.equal(cookies.keys(), ['first', 'second'], 'Set-Cookie parser splits only between cookies');
  test.equal(cookies.get('first'), 'one', 'First cookie parsed correctly');
  test.equal(cookies.get('second'), 'two', 'Second cookie parsed correctly');
});

Tinytest.add('Server: cookie names shadowing Object prototype work', (test) => {
  const cookies = new CookiesCore({
    _cookies: {
      hasOwnProperty: 'cookie-value',
      toString: 'string-cookie'
    }
  });

  test.isTrue(cookies.has('hasOwnProperty'), 'hasOwnProperty cookie exists');
  test.equal(cookies.get('hasOwnProperty'), 'cookie-value', 'hasOwnProperty cookie value is readable');
  test.isTrue(cookies.remove('hasOwnProperty'), 'hasOwnProperty cookie is removable');
  test.isFalse(cookies.has('hasOwnProperty'), 'hasOwnProperty cookie was removed');
  test.equal(cookies.get('toString'), 'string-cookie', 'toString cookie remains readable');
});

Tinytest.add('Server: remove() appends Set-Cookie headers', (test) => {
  const response = mockResponse();
  const cookies = new CookiesCore({
    _cookies: {
      removeOne: 'one',
      removeTwo: 'two'
    },
    response
  });

  test.isTrue(cookies.remove('removeOne'), 'First cookie removed');
  test.isTrue(cookies.remove('removeTwo'), 'Second cookie removed');

  const header = response.getHeader('Set-Cookie');
  test.instanceOf(header, Array, 'Set-Cookie header is an array');
  test.equal(header.length, 2, 'Both removal headers are retained');
  test.include(header[0], 'removeOne=', 'First removal header retained');
  test.include(header[1], 'removeTwo=', 'Second removal header retained');
});

Tinytest.addAsync('Server: Cordova origin allows query-string cookies', async (test) => {
  const response = mockResponse();
  const cookiesInstance = new Cookies({
    name: test.test_case.name,
    auto: false,
    runOnServer: true,
    allowQueryStringCookies: true,
    allowedCordovaOrigins: true
  });

  await cookiesInstance.__autoMiddleware({
    headers: {
      origin: 'http://localhost:12000'
    },
    query: {
      // WEBAPP QUERY PARSER (qs) DECODES VALUES
      ___cookies___: 'cordovaCookie=cordovaValue'
    },
    _parsedUrl: {
      path: '/___cookie___/set'
    }
  }, response, () => {
    test.fail('Endpoint middleware should not call next');
  });

  test.equal(response.getHeader('Access-Control-Allow-Origin'), 'http://localhost:12000', 'Cordova origin is allowed');
  test.equal(response.getHeader('Access-Control-Allow-Credentials'), 'true', 'Credentials header is set');
  test.equal(response.getHeader('Set-Cookie'), ['cordovaCookie=cordovaValue; Path=/'], 'Query string cookie is set');
  test.isTrue(response.ended, 'Response ended');
  cookiesInstance.destroy();
});

Tinytest.addAsync('Server: Cordova query-string cookies parse from request path with complex values', async (test) => {
  const response = mockResponse();
  const queryCookies = [
    serialize('ключ', 'значение').cookieString.split('; ')[0],
    serialize('objectValue', { nested: true }).cookieString.split('; ')[0],
    serialize('arrayValue', [true, 'value', { nested: 1 }]).cookieString.split('; ')[0],
    serialize('booleanValue', false).cookieString.split('; ')[0],
    serialize('nullValue', null).cookieString.split('; ')[0]
  ].join('; ');
  const cookiesInstance = new Cookies({
    name: test.test_case.name,
    auto: false,
    runOnServer: true,
    allowQueryStringCookies: true,
    allowedCordovaOrigins: true
  });

  await cookiesInstance.__autoMiddleware({
    headers: {
      origin: 'http://localhost:12000'
    },
    _parsedUrl: {
      path: `/___cookie___/set?___cookies___=${encodeURIComponent(queryCookies)}`
    }
  }, response, () => {
    test.fail('Endpoint middleware should not call next');
  });

  const cookies = new CookiesCore({
    _cookies: response.getHeader('Set-Cookie').join(', '),
    setCookie: true
  });

  test.equal(response.getHeader('Content-Type'), 'text/plain', 'Endpoint uses text/plain content type');
  test.equal(cookies.get('ключ'), 'значение', 'Unicode key and value round-trip');
  test.equal(cookies.get('objectValue'), { nested: true }, 'Object value round-trips');
  test.equal(cookies.get('arrayValue'), [true, 'value', { nested: 1 }], 'Array value round-trips');
  test.equal(cookies.get('booleanValue'), false, 'Boolean value round-trips');
  test.equal(cookies.get('nullValue'), null, 'Null value round-trips');
  cookiesInstance.destroy();
});

Tinytest.addAsync('Server: malformed Cordova query-string cookies are ignored', async (test) => {
  const response = mockResponse();
  const cookiesInstance = new Cookies({
    name: test.test_case.name,
    auto: false,
    runOnServer: true,
    allowQueryStringCookies: true,
    allowedCordovaOrigins: true
  });

  await cookiesInstance.__autoMiddleware({
    headers: {
      origin: 'http://localhost:12000'
    },
    query: {
      ___cookies___: '%E0%A4%A'
    },
    _parsedUrl: {
      path: '/___cookie___/set'
    }
  }, response, () => {
    test.fail('Endpoint middleware should not call next');
  });

  test.isUndefined(response.getHeader('Set-Cookie'), 'Malformed query-string cookie payload is ignored');
  test.isTrue(response.ended, 'Response ended');
  cookiesInstance.destroy();
});

Tinytest.addAsync('Server: invalid Cordova origin option is ignored', async (test) => {
  let nextCalled = false;
  const response = mockResponse();
  const cookiesInstance = new Cookies({
    name: test.test_case.name,
    auto: false,
    runOnServer: true,
    allowQueryStringCookies: true,
    allowedCordovaOrigins: 'invalid'
  });

  await cookiesInstance.__autoMiddleware({
    headers: {
      origin: 'http://localhost:12000'
    },
    query: {
      ___cookies___: encodeURIComponent('blockedCookie=blockedValue')
    },
    _parsedUrl: {
      path: '/___cookie___/set'
    }
  }, response, () => {
    nextCalled = true;
  });

  test.isFalse(nextCalled, 'Endpoint middleware should not call next');
  test.isUndefined(response.getHeader('Access-Control-Allow-Origin'), 'Invalid Cordova origin option does not allow origin');
  test.isUndefined(response.getHeader('Set-Cookie'), 'Query string cookie is ignored');
  test.isTrue(response.ended, 'Response ended');
  cookiesInstance.destroy();
});

Tinytest.addAsync('Server: Cordova onCookies hook receives query-string cookies', async (test) => {
  let hookCookies;
  const response = mockResponse();
  const cookiesInstance = new Cookies({
    name: test.test_case.name,
    auto: false,
    runOnServer: true,
    allowQueryStringCookies: true,
    allowedCordovaOrigins: true,
    onCookies(cookies) {
      hookCookies = { query: cookies.get('queryCookie'), header: cookies.get('headerCookie') };
      cookies.set('fromHook', 'hookValue');
    }
  });

  await cookiesInstance.__autoMiddleware({
    headers: {
      origin: 'http://localhost:12000',
      cookie: 'headerCookie=headerValue'
    },
    _parsedUrl: {
      path: `/___cookie___/set?___cookies___=${encodeURIComponent('queryCookie=queryValue')}`
    }
  }, response, () => {
    test.fail('Endpoint middleware should not call next');
  });

  test.equal(hookCookies, { query: 'queryValue', header: 'headerValue' }, 'Hook sees query-string and header cookies');
  test.equal(response.getHeader('Set-Cookie'), ['queryCookie=queryValue; Path=/', 'fromHook=hookValue; Path=/'], 'Query cookies and hook cookies are both set');
  cookiesInstance.destroy();
});

Tinytest.addAsync('Server: endpoint does not echo request cookies without query-string payload', async (test) => {
  const response = mockResponse();
  const cookiesInstance = new Cookies({ name: test.test_case.name, auto: false, runOnServer: true });

  await cookiesInstance.__autoMiddleware({
    headers: { cookie: 'session=secret' },
    _parsedUrl: { path: '/___cookie___/set' }
  }, response, () => {
    test.fail('Endpoint middleware should not call next');
  });

  test.isUndefined(response.getHeader('Set-Cookie'), 'Request cookies are not re-set without their original attributes');
  test.isTrue(response.ended, 'Response ended');
  cookiesInstance.destroy();
});

Tinytest.addAsync('Server: endpoint path in query string does not hijack request', async (test) => {
  let nextCalled = false;
  const response = mockResponse();
  const cookiesInstance = new Cookies({ name: test.test_case.name, auto: false, runOnServer: true });

  await cookiesInstance.__autoMiddleware({
    headers: {},
    _parsedUrl: { path: '/search?q=/___cookie___/set' }
  }, response, () => {
    nextCalled = true;
  });

  test.isTrue(nextCalled, 'Regular route calls next');
  test.isUndefined(response.ended, 'Regular route response is not ended');
  cookiesInstance.destroy();
});

Tinytest.add('Server: set() keeps Set-Cookie values added by other code', (test) => {
  const response = mockResponse();
  const cookies = new CookiesCore({ response });

  cookies.set('first', '1');
  response.setHeader('Set-Cookie', [...response.getHeader('Set-Cookie'), 'other=1; Path=/']);
  cookies.set('second', '2');

  test.equal(response.getHeader('Set-Cookie'), ['first=1; Path=/', 'other=1; Path=/', 'second=2; Path=/'], 'Header written by other code is preserved');
});

Tinytest.add('Server: Cookies constructor does not mutate options', (test) => {
  const opts = { auto: false };
  const cookiesInstance = new Cookies(opts);

  test.equal(opts, { auto: false }, 'Options object is not mutated');
  cookiesInstance.destroy();
});

Tinytest.addAsync('Server: endpoint rejects cross-site requests without running hooks', async (test) => {
  let hookCalls = 0;
  const cookiesInstance = new Cookies({
    name: test.test_case.name,
    auto: false,
    runOnServer: true,
    onCookies() {
      hookCalls++;
    }
  });

  const requests = [
    { origin: 'https://evil.example', host: 'localhost:3000' },
    { host: 'localhost:3000', 'sec-fetch-site': 'cross-site' },
    { host: 'localhost:3000', 'sec-fetch-site': 'same-site' }
  ];

  for (const headers of requests) {
    const response = mockResponse();
    await cookiesInstance.__autoMiddleware({
      headers: { ...headers, cookie: 'session=secret' },
      _parsedUrl: { path: '/___cookie___/set' }
    }, response, () => {
      test.fail('Endpoint middleware should not call next');
    });

    test.equal(response.statusCode, 403, `Rejected: ${JSON.stringify(headers)}`);
    test.isTrue(response.ended, 'Response ended');
  }

  test.equal(hookCalls, 0, 'Hooks did not run');
  cookiesInstance.destroy();
});

Tinytest.addAsync('Server: endpoint accepts same-origin requests', async (test) => {
  let hookCalls = 0;
  const cookiesInstance = new Cookies({
    name: test.test_case.name,
    auto: false,
    runOnServer: true,
    onCookies() {
      hookCalls++;
    }
  });

  const requests = [
    { origin: 'http://LocalHost:3000', host: 'localhost:3000' },
    { host: 'localhost:3000', 'sec-fetch-site': 'same-origin' },
    { host: 'localhost:3000' }
  ];

  for (const headers of requests) {
    const response = mockResponse();
    await cookiesInstance.__autoMiddleware({
      headers,
      _parsedUrl: { path: '/___cookie___/set' }
    }, response, () => {
      test.fail('Endpoint middleware should not call next');
    });

    test.equal(response.statusCode, 200, `Accepted: ${JSON.stringify(headers)}`);
  }

  // GLOBAL TEST HOOK ALSO RUNS; ONLY COUNT THIS INSTANCE
  test.equal(hookCalls, requests.length, 'Hooks ran for each request');
  cookiesInstance.destroy();
});

Tinytest.add('Server: destroying middleware owner hands middleware over to live instance', (test) => {
  const originalOwner = Cookies.__owner;
  const handlerOnly = new Cookies({ name: `${test.test_case.name}-handler`, auto: false, handler() {} });
  const temporaryOwner = new Cookies({ name: `${test.test_case.name}-owner`, auto: false });

  temporaryOwner.__takeOver();
  test.equal(Cookies.__owner, temporaryOwner, 'Temporary owner took over');
  test.isFalse(originalOwner.hasMiddleware, 'Previous owner lost middleware');

  temporaryOwner.destroy();
  test.equal(Cookies.__owner, originalOwner, '{auto: true} instance is preferred as successor');
  test.isTrue(originalOwner.hasMiddleware, 'Successor owns middleware');
  test.isTrue(Cookies.isMiddlewareRegistered, 'Middleware is still registered');
  test.isFalse(handlerOnly.hasMiddleware, 'Handler-only instance is not owner');

  handlerOnly.destroy();
});

Tinytest.add('Server: middleware dispatcher is attached once', (test) => {
  const app = WebApp.connectHandlers;
  const handlers = app.router?.stack || app._router?.stack || app.stack || [];
  const count = handlers.filter((layer) => layer.handle === Cookies.__dispatch).length;
  test.isTrue(handlers.length > 0, 'Middleware stack is readable');
  test.equal(count, 1, 'Cookies.__dispatch registered once');
  test.isTrue(Cookies.__isDispatcherAttached, 'Dispatcher attached');
});

Tinytest.addAsync('Server: client methods throws - sendAsync', async (test) => {
  const cookiesInstance = new Cookies({ name: test.test_case.name, auto: false, runOnServer: true });
  await test.throwsAsync(async () => { await cookiesInstance.sendAsync(); }, /Client only/, 'sendAsync() should throw on Server');
  cookiesInstance.destroy();
});

Tinytest.add('Server: Duplicate middleware registration returns blank middleware', (test) => {
  const cookiesInstance = new Cookies({ name: test.test_case.name, auto: false, runOnServer: true });
  // Since we have global middleware registered — this registration should return blank middleware
  const middleware2 = cookiesInstance.middleware();
  // Simulate that blank middleware simply calls next immediately:
  let nextCalled = false;
  middleware2({}, {}, () => { nextCalled = true; });
  test.isTrue(nextCalled, 'Duplicate middleware should simply call next');
  cookiesInstance.destroy();
});

Tinytest.addAsync('Server: {middleware} method - default', (test, next) => {
  // Create a fake request with a cookie header.
  const testValue = Random.id();
  const request = { headers: { cookie: `testCookie=${testValue}` }, _parsedUrl: { path: '/some/path' } };
  const response = new (require('stream').PassThrough)(); // simplified response object

  const cookiesInstance = new Cookies({
    name: test.test_case.name,
    auto: false
  });

  // Create a fake middleware 'next' function.
  function nextMiddleware() {
    request.Cookies = cookiesInstance.__getCookiesCore(request, response, cookiesInstance.opts);
    test.instanceOf(request.Cookies, CookiesCore, 'request.Cookies instance of CookiesCore');
    test.equal(Cookies.isMiddlewareRegistered, true, 'Cookies.isMiddlewareRegistered is true after new middleware is registered');
    test.equal(request.Cookies.get('testCookie'), testValue, 'Received cookie has correct value');
    test.equal(cookiesInstance.isDestroyed, false, 'Cookies.isDestroyed is false');
    test.equal(cookiesInstance.destroy(), true, 'cookiesInstance.destroy() returns true when called first time');
    test.equal(cookiesInstance.isDestroyed, true, 'Cookies.isDestroyed is true after class was .destroy(ed)');
    test.equal(cookiesInstance.destroy(), false, 'cookiesInstance.destroy() returns false when called first time');

    next();
  }

  // Simulate middleware call.
  cookiesInstance.middleware()(request, response, nextMiddleware);
});

Tinytest.addAsync('Server: {handler + default middleware} callback - sync', (test, next) => {
  (async () => {
    const testValue1 = Random.id();
    const testValue2 = Random.id();
    const testPath = '/middleware/callback/sync';
    const testUrl = `${ENDPOINT_COOKIES_TEST}${testPath}`;

    const cookiesInstance = new Cookies({
      name: test.test_case.name,
      auto: false,
      runOnServer: true,
      handler(cookiesCoreInstance) {
        if (cookiesCoreInstance.response.req.originalUrl.endsWith(testPath)) {
          test.instanceOf(cookiesCoreInstance, CookiesCore, 'argument in middleware hook is instance of CookiesCore class');
          test.equal(cookiesCoreInstance.keys(), ['testCookie1', 'testCookie2'], 'has correct .keys() inside "handler" hook');
          test.equal(cookiesCoreInstance.get('testCookie1'), testValue1, 'Received cookie has correct value 1');
          test.equal(cookiesCoreInstance.get('testCookie2'), testValue2, 'Received cookie has correct value 2');
        }
      }
    });

    test.equal(Cookies.__handlers.size, 1, 'Cookies.__handlers.size is 1 after new middleware is registered');

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Cookie': `testCookie1=${testValue1}; testCookie2=${testValue2};`
      },
    });

    test.isTrue(response.ok, 'Expected response.ok to be true');
    test.equal(typeof response.text, 'function', 'Expected response.text() to be a function');

    test.equal(cookiesInstance.destroy(), true, 'cookiesInstance.destroy() returns true when called first time');
    test.equal(Cookies.__handlers.size, 0, 'Cookies.__handlers.size is 0 after class was .destroy(ed)');
    next();
  })();
});

Tinytest.addAsync('Server: {handler + default middleware} callback - async', (test, next) => {
  (async () => {
    const testValue1 = Random.id();
    const testValue2 = Random.id();
    const testPath = '/middleware/callback/async';
    const testUrl = `${ENDPOINT_COOKIES_TEST}${testPath}`;

    const cookiesInstance = new Cookies({
      name: test.test_case.name,
      auto: false,
      runOnServer: true,
      async handler(cookiesCoreInstance) {
        if (cookiesCoreInstance.response.req.originalUrl.endsWith(testPath)) {
          test.instanceOf(cookiesCoreInstance, CookiesCore, 'argument in middleware hook is instance of CookiesCore class');
          test.equal(cookiesCoreInstance.keys(), ['testCookie1', 'testCookie2'], 'has correct .keys() inside "handler" hook');
          test.equal(cookiesCoreInstance.get('testCookie1'), testValue1, 'Received cookie has correct value 1');
          test.equal(cookiesCoreInstance.get('testCookie2'), testValue2, 'Received cookie has correct value 2');
        }
      }
    });

    test.equal(Cookies.__handlers.size, 1, 'Cookies.__handlers.size is 1 after new middleware is registered');

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Cookie': `testCookie1=${testValue1}; testCookie2=${testValue2};`
      },
    });

    test.isTrue(response.ok, 'Expected response.ok to be true');
    test.equal(typeof response.text, 'function', 'Expected response.text() to be a function');

    test.equal(cookiesInstance.destroy(), true, 'cookiesInstance.destroy() returns true when called first time');
    test.equal(Cookies.__handlers.size, 0, 'Cookies.__handlers.size is 0 after class was .destroy(ed)');
    next();
  })();
});

Tinytest.addAsync('Server: {handler + default middleware} callback - async waits', (test, next) => {
  (async () => {
    const testValue = Random.id();
    const testPath = '/middleware/waits';
    const testUrl = `${ENDPOINT_COOKIES_TEST}${testPath}`;
    const cookiesInstance = new Cookies({
      name: test.test_case.name,
      auto: false,
      runOnServer: true,
      handler: async (cookiesCoreInstance) => {
        if (cookiesCoreInstance.response.req.originalUrl.endsWith(testPath)) {
          await (new Promise(resolve => setTimeout(resolve, 100)));
          test.equal(cookiesCoreInstance.get('delayTest'), testValue, 'Async handler returns expected value after delay');
          cookiesInstance.destroy();
        }
      }
    });

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Cookie': `delayTest=${testValue}`
      },
    });

    test.isTrue(response.ok, 'Expected response.ok to be true');
    next();
  })();
});

Tinytest.addAsync('Server: {handler} callback - set and rewrite cookies', (test, next) => {
  (async () => {
    const testValue1 = Random.id();
    const testValue2 = Random.id();
    const rewriteValue = Random.id();

    const cookiesInstance = new Cookies({
      name: test.test_case.name,
      auto: false,
      runOnServer: true,
      handler(cookiesCoreInstance) {
        test.equal(cookiesCoreInstance.keys(), ['testCookie1'], 'has correct .keys() inside "handler" hook');
        test.equal(cookiesCoreInstance.get('testCookie1'), testValue1, 'Received cookie has correct value 1');
        test.isTrue(cookiesCoreInstance.set('testCookie1', rewriteValue), 'Rewrite "testCookie1" value');
        test.isTrue(cookiesCoreInstance.set('testCookie2', testValue2), 'Set "testCookie2" value');
      }
    });

    const response = await fetch(ENDPOINT_COOKIES_TEST, {
      method: 'GET',
      headers: {
        'Cookie': `testCookie1=${testValue1}`
      },
    });

    const headerCookies = response.headers.get('set-cookie');
    const cookies = new CookiesCore({
      _cookies: headerCookies || '',
      setCookie: true
    });

    test.isTrue(cookies.has('testCookie1'), 'Received set-cookie header has testCookie1');
    test.isTrue(cookies.has('testCookie2'), 'Received set-cookie header has testCookie2');
    test.equal(cookies.get('testCookie1'), rewriteValue, 'Received set-cookie header has correct value 1');
    test.equal(cookies.get('testCookie2'), testValue2, 'Received set-cookie header has correct value 2');
    test.equal(cookiesInstance.destroy(), true, 'cookiesInstance.destroy() returns true when called first time');
    next();
  })();
});

Tinytest.addAsync('Server: {handler} callback - set cookies in multiple handlers', (test, next) => {
  (async () => {
    const testPath = '/handlers/multiple?getQuery=getvalue';
    const testUrl = `${ENDPOINT_COOKIES_TEST}${testPath}`;
    const testValue1 = Random.id();
    const testValue2 = Random.id();

    const cookiesInstance1 = new Cookies({
      name: test.test_case.name + ' - 1',
      auto: true,
      runOnServer: true,
      handler(cookiesCoreInstance) {
        if (cookiesCoreInstance.response.req.originalUrl.endsWith(testPath)) {
          test.isTrue(cookiesCoreInstance.set('testCookie1', testValue1), 'Set "testCookie1" value');
        }
      }
    });

    const cookiesInstance2 = new Cookies({
      name: test.test_case.name + ' - 2',
      auto: false,
      runOnServer: true,
      handler(cookiesCoreInstance) {
        if (cookiesCoreInstance.response.req.originalUrl.endsWith(testPath)) {
          test.isTrue(cookiesCoreInstance.set('testCookie2', testValue2), 'Set "testCookie2" value');
        }
      }
    });

    test.equal(Cookies.__handlers.size, 2, 'Cookies.__handlers.size is 2 after two middlewares is registered');

    const response1 = await fetch(testUrl, {
      method: 'GET',
    });

    const headerCookies1 = response1.headers.get('set-cookie');
    let cookies = new CookiesCore({
      name: test.test_case.name + ' - core 1',
      _cookies: headerCookies1 || '',
      setCookie: true
    });

    test.isTrue(cookies.has('testCookie1'), 'Received set-cookie header has testCookie1');
    test.isTrue(cookies.has('testCookie2'), 'Received set-cookie header has testCookie2');
    test.equal(cookies.get('testCookie1'), testValue1, 'Received set-cookie header has correct value 1');
    test.equal(cookies.get('testCookie2'), testValue2, 'Received set-cookie header has correct value 2');
    test.equal(cookiesInstance1.destroy(), true, 'cookiesInstance1.destroy() returns true when called first time');

    test.equal(Cookies.__handlers.size, 1, 'Cookies.__handlers.size is 1 after the first middleware is destroyed');

    const response2 = await fetch(testUrl, {
      method: 'GET',
    });

    const headerCookies2 = response2.headers.get('set-cookie');
    cookies = new CookiesCore({
      name: test.test_case.name + ' - core 2',
      _cookies: headerCookies2 || '',
      setCookie: true
    });

    test.isFalse(cookies.has('testCookie1'), 'Received set-cookie header has NO testCookie1');
    test.isTrue(cookies.has('testCookie2'), 'Received set-cookie header has testCookie2');
    test.equal(cookies.get('testCookie2'), testValue2, 'Received set-cookie header has correct value 2');
    test.equal(cookiesInstance2.destroy(), true, 'cookiesInstance2.destroy() returns true when called first time');
    test.equal(Cookies.__handlers.size, 0, 'Cookies.__handlers.size is 0 after the second middleware is destroyed');
    next();
  })();
});

Tinytest.addAsync('Server: {onCookies} hook - sync', (test, next) => {
  (async () => {
    const testValue1 = Random.id();
    const testValue2 = Random.id();

    const cookiesInstance = new Cookies({
      name: test.test_case.name,
      auto: false,
      runOnServer: true,
      onCookies(cookiesCoreInstance) {
        test.instanceOf(cookiesCoreInstance, CookiesCore, 'argument in middleware hook is instance of CookiesCore class');
        test.equal(cookiesCoreInstance.keys(), ['testCookie1', 'testCookie2'], 'has correct .keys() inside "handler" hook');
        test.equal(cookiesCoreInstance.get('testCookie1'), testValue1, 'Received cookie has correct value 1');
        test.equal(cookiesCoreInstance.get('testCookie2'), testValue2, 'Received cookie has correct value 2');
      }
    });

    test.equal(Cookies.__hooks.size, 2, 'Cookies.__hooks.size is 2 after new middleware is registered');

    const response = await fetch(ENDPOINT_COOKIES_SET, {
      method: 'GET',
      headers: {
        'Cookie': `testCookie1=${testValue1}; testCookie2=${testValue2};`
      },
    });

    test.isNull(response.headers.get('set-cookie'), 'Request cookies are not echoed back as set-cookie header');

    test.equal(cookiesInstance.destroy(), true, 'cookiesInstance.destroy() returns true when called first time');
    test.equal(Cookies.__handlers.size, 0, 'Cookies.__handlers.size is 0 after class was .destroy(ed)');
    next();
  })();
});

Tinytest.addAsync('Server: {onCookies} hook - async', (test, next) => {
  (async () => {
    const testValue1 = Random.id();
    const testValue2 = Random.id();

    const cookiesInstance = new Cookies({
      name: test.test_case.name,
      auto: false,
      runOnServer: true,
      async onCookies(cookiesCoreInstance) {
        test.instanceOf(cookiesCoreInstance, CookiesCore, 'argument in middleware hook is instance of CookiesCore class');
        test.equal(cookiesCoreInstance.keys(), ['testCookie1', 'testCookie2'], 'has correct .keys() inside "handler" hook');
        test.equal(cookiesCoreInstance.get('testCookie1'), testValue1, 'Received cookie has correct value 1');
        test.equal(cookiesCoreInstance.get('testCookie2'), testValue2, 'Received cookie has correct value 2');
      }
    });

    test.equal(Cookies.__hooks.size, 2, 'Cookies.__hooks.size is 2 after new middleware is registered');

    const response = await fetch(ENDPOINT_COOKIES_SET, {
      method: 'GET',
      headers: {
        'Cookie': `testCookie1=${testValue1}; testCookie2=${testValue2};`
      },
    });

    test.isNull(response.headers.get('set-cookie'), 'Request cookies are not echoed back as set-cookie header');

    test.equal(cookiesInstance.destroy(), true, 'cookiesInstance.destroy() returns true when called first time');
    test.equal(Cookies.__handlers.size, 0, 'Cookies.__handlers.size is 0 after class was .destroy(ed)');
    next();
  })();
});

Tinytest.addAsync('Server: {onCookies} hook - set various values', (test, next) => {
  (async () => {
    const cookiesInstance = new Cookies({
      name: test.test_case.name,
      auto: false,
      runOnServer: true,
      onCookies(cookiesCoreInstance) {
        for (let i = testKeyVals.length - 1; i >= 0; i--) {
          const { key, value } = testKeyVals[i];
          const setRes = cookiesCoreInstance.set(key, value);
          test.isTrue(setRes, true, `Set cookie with key ${key}`);
          test.isTrue(cookiesCoreInstance.has(key), `cookies.has(${key})`);
          test.isFalse(cookiesCoreInstance.has(`${key}${key}${key}`), `NO cookie.has(${key}${key}${key})`);

          if (isObject(value) || isArray(value)) {
            test.equal(cookiesCoreInstance.get(key), JSON.parse(antiCircular(value)), `cookie.get(${key}) returns correct value`);
          } else {
            test.equal(cookiesCoreInstance.get(key), value, `cookie.get(${key}) returns correct value`);
          }
        }
      }
    });

    const response = await fetch(ENDPOINT_COOKIES_SET, {
      method: 'GET',
    });

    const headerCookies = response.headers.get('set-cookie');
    const cookies = new CookiesCore({
      name: test.test_case.name + ' - core',
      _cookies: headerCookies || '',
      setCookie: true
    });

    for (let i = testKeyVals.length - 1; i >= 0; i--) {
      const { key, value } = testKeyVals[i];
      test.isTrue(cookies.has(key), `cookies.has(${key})`);
      test.isFalse(cookies.has(`${key}${key}${key}`), `NO cookie.has(${key}${key}${key})`);

      if (isObject(value) || isArray(value)) {
        test.equal(cookies.get(key), JSON.parse(antiCircular(value)), `cookie.get(${key}) returns correct value`);
      } else {
        test.equal(cookies.get(key), value, `cookie.get(${key}) returns correct value`);
      }
    }

    test.equal(cookiesInstance.destroy(), true, 'cookiesInstance.destroy() returns true when called first time');
    next();
  })();
});

Tinytest.addAsync('Server: manual middleware owner, dispatcher skip and handover chain', async (test) => {
  const originalOwner = Cookies.__owner;
  const originalInstances = Cookies.__instances;
  let handlerValue;
  // ISOLATE OWNERSHIP STATE; NO I/O BETWEEN SWAP AND RESTORE
  Cookies.__instances = new Set();
  Cookies.isMiddlewareRegistered = false;

  try {
    const warned = new Cookies({ name: `${test.test_case.name}-warned`, auto: false, onCookies() {} });
    test.isFalse(Cookies.__hooks.has(warned.id), '{onCookies} with {auto: false} and no middleware is not registered');
    warned.destroy();

    const manual = new Cookies({
      name: `${test.test_case.name}-manual`,
      auto: false,
      handler(cookies) {
        handlerValue = cookies.get('manualCookie');
      }
    });
    const middleware = manual.middleware();
    test.equal(Cookies.__owner, manual, 'Manual middleware takes over');
    test.isTrue(manual.__isManual, 'Owner is marked manual');

    let dispatchedNext = false;
    await Cookies.__dispatch({ headers: {}, url: '/' }, mockResponse(), () => { dispatchedNext = true; });
    test.isTrue(dispatchedNext, 'Dispatcher skips manual owner');

    const request = { headers: { cookie: 'manualCookie=manualValue' }, url: '/manual' };
    let middlewareNext = false;
    await middleware(request, mockResponse(), () => { middlewareNext = true; });
    test.isTrue(middlewareNext, 'Manual middleware calls next');
    test.instanceOf(request.Cookies, CookiesCore, 'Manual middleware sets req.Cookies');
    test.equal(handlerValue, 'manualValue', 'Manual middleware runs handlers');

    const successor = new Cookies({ name: `${test.test_case.name}-successor`, auto: false });
    manual.destroy();
    test.equal(Cookies.__owner, successor, '{auto: false} instance takes over when no {auto: true} instance is live');

    const staleRequest = {};
    let staleNext = false;
    await middleware(staleRequest, mockResponse(), () => { staleNext = true; });
    test.isTrue(staleNext, 'Middleware of destroyed owner calls next');
    test.isUndefined(staleRequest.Cookies, 'Middleware of destroyed owner does nothing');

    successor.destroy();
    test.isNull(Cookies.__owner, 'No owner without live instances');
    test.isFalse(Cookies.isMiddlewareRegistered, 'Middleware is unregistered without live instances');

    dispatchedNext = false;
    await Cookies.__dispatch({ headers: {}, url: '/' }, mockResponse(), () => { dispatchedNext = true; });
    test.isTrue(dispatchedNext, 'Dispatcher calls next without owner');
  } finally {
    Cookies.__instances = originalInstances;
    originalOwner.__takeOver();
  }
});

Tinytest.add('Server: {runOnServer: false} instance', (test) => {
  const cookiesInstance = new Cookies({ name: test.test_case.name, auto: false, runOnServer: false });
  test.isFalse(Cookies.__instances.has(cookiesInstance), 'Instance is not a middleware candidate');
  test.throws(() => { cookiesInstance.middleware(); }, /runOnServer/, 'middleware() throws');
  cookiesInstance.destroy();
});

Tinytest.add('Server: TTL and options edge cases', (test) => {
  const cookiesInstance = new Cookies({ name: test.test_case.name, auto: false, TTL: 60000, allowedCordovaOrigins: 'http://localhost:12000' });
  test.isFalse(cookiesInstance.allowedCordovaOrigins, 'String allowedCordovaOrigins is ignored');

  const response = mockResponse();
  const core = cookiesInstance.__getCookiesCore({ headers: {} }, response);
  test.isTrue(core.set('ttl', 'value', null), 'set() accepts non-object options');
  test.include(response.getHeader('Set-Cookie')[0], 'Expires=', 'TTL adds Expires');
  cookiesInstance.destroy();

  const defaultCore = new CookiesCore();
  test.equal(defaultCore.NAME, 'COOKIES_CORE', 'CookiesCore works without options');
  test.isTrue(defaultCore.set('noResponse', 'value'), 'set() without response updates cookies');
  test.equal(defaultCore.get('noResponse'), 'value', 'Value is readable');
  defaultCore.cookies = null;
  test.equal(defaultCore.keys(), [], 'keys() without cookies returns empty array');
});

Tinytest.add('Server: Set-Cookie header on non-standard responses', (test) => {
  const noSetHeader = new CookiesCore({ response: {} });
  test.isTrue(noSetHeader.set('a', 'b'), 'set() works when response has no setHeader');

  const headers = {};
  const noGetHeader = new CookiesCore({ response: { setHeader(name, value) { headers[name] = value; } } });
  noGetHeader.set('a', 'b');
  noGetHeader.set('c', 'd');
  test.equal(headers['Set-Cookie'], ['a=b; Path=/', 'c=d; Path=/'], 'Pending cookies accumulate without getHeader');

  const response = mockResponse();
  response.setHeader('Set-Cookie', 'other=value');
  new CookiesCore({ response }).set('a', 'b');
  test.equal(response.getHeader('Set-Cookie'), ['other=value', 'a=b; Path=/'], 'Single string Set-Cookie is kept');
});

Tinytest.addAsync('Server: failing callbacks and destroyed instances', async (test) => {
  const cookiesInstance = new Cookies({ name: test.test_case.name, auto: false });
  const executed = await cookiesInstance.__execute({ headers: {} }, mockResponse(), new Map([['failing', () => { throw new Error('expected test error'); }]]));
  test.isTrue(executed, 'Error in callback is caught');

  cookiesInstance.destroy();
  let nextCalled = false;
  await cookiesInstance.__autoMiddleware({ headers: {}, url: '/' }, mockResponse(), () => { nextCalled = true; });
  test.isTrue(nextCalled, 'Destroyed instance middleware calls next');
});

Tinytest.addAsync('Server: middleware handles requests without _parsedUrl or headers', async (test) => {
  const cookiesInstance = new Cookies({ name: test.test_case.name, auto: false });

  const urlRequest = { headers: {}, url: '/plain' };
  let nextCalled = false;
  await cookiesInstance.__autoMiddleware(urlRequest, mockResponse(), () => { nextCalled = true; });
  test.isTrue(nextCalled, 'Falls back to req.url');
  test.instanceOf(urlRequest.Cookies, CookiesCore, 'req.Cookies is set');

  const emptyRequest = {};
  nextCalled = false;
  await cookiesInstance.__autoMiddleware(emptyRequest, mockResponse(), () => { nextCalled = true; });
  test.isTrue(nextCalled, 'Works without url and headers');

  const response = mockResponse();
  await cookiesInstance.__autoMiddleware({ url: '/___cookie___/set' }, response, () => {
    test.fail('Endpoint middleware should not call next');
  });
  test.equal(response.statusCode, 200, 'Endpoint accepts request without headers');
  test.isTrue(response.ended, 'Response ended');
  cookiesInstance.destroy();
});

Tinytest.addAsync('Server: Cordova query-string payload variants', async (test) => {
  const cookiesInstance = new Cookies({
    name: test.test_case.name,
    auto: false,
    allowQueryStringCookies: true,
    allowedCordovaOrigins: true
  });
  const headers = { origin: 'http://localhost:12000' };
  const run = async (req) => {
    const response = mockResponse();
    await cookiesInstance.__autoMiddleware({ headers, ...req }, response, () => {
      test.fail('Endpoint middleware should not call next');
    });
    return response.getHeader('Set-Cookie');
  };

  test.equal(await run({ url: '/___cookie___/set', query: { ___cookies___: ['a=1', 'b=2'] } }), ['a=1; Path=/'], 'First value of parsed query array is used');
  test.isUndefined(await run({ url: '/___cookie___/set' }), 'No query string');
  test.isUndefined(await run({ url: '/___cookie___/set?flag&other=1' }), 'No ___cookies___ param');
  test.isUndefined(await run({ url: '/___cookie___/set?___cookies___' }), 'Empty ___cookies___ param');
  cookiesInstance.destroy();
});

Tinytest.addAsync('Server: Cordova query-string cookies are decoded once', async (test) => {
  const cookiesInstance = new Cookies({
    name: test.test_case.name,
    auto: false,
    allowQueryStringCookies: true,
    allowedCordovaOrigins: true
  });
  // CLIENT SENDS `encodeURIComponent(serialize(...))`, VALUE `v%41` MUST NOT TURN INTO `vA`
  const pair = serialize('literal', 'v%41').cookieString.split('; ')[0];
  const headers = { origin: 'http://localhost:12000' };
  const read = async (req) => {
    let value;
    const hookId = Symbol('decode-test');
    Cookies.__hooks.set(hookId, (cookies) => { value = cookies.get('literal'); });
    await cookiesInstance.__autoMiddleware({ headers, ...req }, mockResponse(), () => {});
    Cookies.__hooks.delete(hookId);
    return value;
  };

  test.equal(await read({ url: `/___cookie___/set?___cookies___=${encodeURIComponent(pair)}` }), 'v%41', 'Raw path value');
  test.equal(await read({ url: '/___cookie___/set', query: { ___cookies___: pair } }), 'v%41', 'Parsed req.query value');
  cookiesInstance.destroy();
});
