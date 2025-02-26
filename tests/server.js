import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Cookies, CookiesCore } from 'meteor/ostrio:cookies';
import { antiCircular, isArray, isObject } from '../helpers';

const circularObj = {key: '1', key2: {key1: 1, key2: false, key3: [true, false]}};
circularObj.slef = circularObj;

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

if (process.__cachedCookies) {
  process.__cachedCookies.destroy();
}

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

    const cookiesInstance = new Cookies({
      name: test.test_case.name,
      auto: false,
      runOnServer: true,
      handler(cookiesCoreInstance) {
        test.instanceOf(cookiesCoreInstance, CookiesCore, 'argument in middleware hook is instance of CookiesCore class');
        test.equal(cookiesCoreInstance.keys(), ['testCookie1', 'testCookie2'], 'has correct .keys() inside "handler" hook');
        test.equal(cookiesCoreInstance.get('testCookie1'), testValue1, 'Received cookie has correct value 1');
        test.equal(cookiesCoreInstance.get('testCookie2'), testValue2, 'Received cookie has correct value 2');
      }
    });

    test.equal(Cookies.__handlers.size, 1, 'Cookies.__handlers.size is 1 after new middleware is registered');

    const response = await fetch(ENDPOINT_COOKIES_TEST, {
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

    const cookiesInstance = new Cookies({
      name: test.test_case.name,
      auto: false,
      runOnServer: true,
      async handler(cookiesCoreInstance) {
        test.instanceOf(cookiesCoreInstance, CookiesCore, 'argument in middleware hook is instance of CookiesCore class');
        test.equal(cookiesCoreInstance.keys(), ['testCookie1', 'testCookie2'], 'has correct .keys() inside "handler" hook');
        test.equal(cookiesCoreInstance.get('testCookie1'), testValue1, 'Received cookie has correct value 1');
        test.equal(cookiesCoreInstance.get('testCookie2'), testValue2, 'Received cookie has correct value 2');

        test.equal(cookiesInstance.destroy(), true, 'cookiesInstance.destroy() returns true when called first time');
        test.equal(Cookies.__handlers.size, 0, 'Cookies.__handlers.size is 0 after class was .destroy(ed)');
      }
    });

    test.equal(Cookies.__handlers.size, 1, 'Cookies.__handlers.size is 1 after new middleware is registered');

    const response = await fetch(ENDPOINT_COOKIES_TEST, {
      method: 'GET',
      headers: {
        'Cookie': `testCookie1=${testValue1}; testCookie2=${testValue2};`
      },
    });

    test.isTrue(response.ok, 'Expected response.ok to be true');
    test.equal(typeof response.text, 'function', 'Expected response.text() to be a function');
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
    console.log('headerCookies', headerCookies)
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

    const headerCookies = response.headers.get('set-cookie');
    const cookies = new CookiesCore({
      name: test.test_case.name + ' - core',
      _cookies: headerCookies || '',
      setCookie: true
    });

    test.isTrue(cookies.has('testCookie1'), 'Received set-cookie header has testCookie1');
    test.isTrue(cookies.has('testCookie2'), 'Received set-cookie header has testCookie2');
    test.equal(cookies.get('testCookie1'), testValue1, 'Received set-cookie header has correct value 1');
    test.equal(cookies.get('testCookie2'), testValue2, 'Received set-cookie header has correct value 2');

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

    const headerCookies = response.headers.get('set-cookie');
    const cookies = new CookiesCore({
      name: test.test_case.name + ' - core',
      _cookies: headerCookies || '',
      setCookie: true
    });

    test.isTrue(cookies.has('testCookie1'), 'Received set-cookie header has testCookie1');
    test.isTrue(cookies.has('testCookie2'), 'Received set-cookie header has testCookie2');
    test.equal(cookies.get('testCookie1'), testValue1, 'Received set-cookie header has correct value 1');
    test.equal(cookies.get('testCookie2'), testValue2, 'Received set-cookie header has correct value 2');

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
