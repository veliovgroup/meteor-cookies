import { Cookies } from 'meteor/ostrio:cookies';

const helpers = {
  isArray(obj) {
    return Array.isArray(obj);
  },
  clone(obj) {
    if (!this.isObject(obj)) return obj;
    return this.isArray(obj) ? obj.slice() : Object.assign({}, obj);
  }
};

const _helpers = ['Number', 'Object', 'Function'];
for (let i = 0; i < _helpers.length; i++) {
  helpers['is' + _helpers[i]] = function (obj) {
    return Object.prototype.toString.call(obj) === '[object ' + _helpers[i] + ']';
  };
}


const antiCircular = (_obj) => {
  const object = helpers.clone(_obj);
  const cache  = new WeakMap();
  return JSON.parse(JSON.stringify(object, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.get(value)) {
        return void 0;
      }
      cache.set(value, true);
    }
    return value;
  }));
};

const cookies = new Cookies();

Tinytest.add('cookies: set() - empty value', test => {
  const testVal = void 0;
  const setRes = cookies.set('testCookieEmpty', testVal);
  test.isFalse(setRes);
  test.equal(cookies.get('testCookieEmpty', document.cookie), testVal, 'document.cookie');
  test.equal(cookies.get('testCookieEmpty'), testVal, 'js');
});

Tinytest.add('cookies: set() / get() - String', test => {
  const testVal = 'this is test value';
  const setRes = cookies.set('testCookie', testVal);
  test.isTrue(setRes);
  test.equal(cookies.get('testCookie', document.cookie), testVal, 'document.cookie');
  test.equal(cookies.get('testCookie'), testVal, 'js');
});

Tinytest.add('cookies: set() / get() / has() - Unicode', function (test) {
  const testVal = '⦶';
  const setRes = cookies.set('⦁', testVal);
  test.isTrue(setRes);
  test.isTrue(cookies.has('⦁'));
  test.isFalse(cookies.has('⦁⦁⦁'));
  test.equal(cookies.get('⦁', document.cookie), testVal, 'document.cookie');
  test.equal(cookies.get('⦁'), testVal, 'js');
});

Tinytest.add('cookies: set() / get() / has() - Unicode 2', function (test) {
  const testVal = '小飼弾\n小飼弾';
  const setRes = cookies.set('小飼弾', testVal);
  test.isTrue(setRes);
  test.isTrue(cookies.has('小飼弾'));
  test.equal(cookies.get('小飼弾', document.cookie), testVal, 'document.cookie');
  test.equal(cookies.get('小飼弾'), testVal, 'js');
});

Tinytest.add('cookies: set() / get() / has() - Cyrillic', function (test) {
  const testVal = 'йцукен\nнекуцй';
  const setRes = cookies.set('фывфыв', testVal);
  test.isTrue(setRes);
  test.isTrue(cookies.has('фывфыв'));
  test.equal(cookies.get('фывфыв', document.cookie), testVal, 'document.cookie');
  test.equal(cookies.get('фывфыв'), testVal, 'js');
});

Tinytest.add('cookies: set() / get() / has() - "Device undefined ("', function (test) {
  const testVal = 'Device undefined (';
  const testKey = 'device undefined';
  const setRes = cookies.set(testKey, testVal);
  test.isTrue(setRes);
  test.isTrue(cookies.has(testKey));
  test.equal(cookies.get(testKey, document.cookie), testVal, 'document.cookie');
  test.equal(cookies.get(testKey), testVal, 'js');
});

Tinytest.add('cookies: set() / get() / has() - FALSE', test => {
  const testVal = false;
  const setRes = cookies.set('testFalse', testVal);
  test.isTrue(setRes);
  test.isTrue(cookies.has('testFalse'));
  test.equal(cookies.get('testFalse', document.cookie), testVal, 'document.cookie');
  test.equal(cookies.get('testFalse'), testVal, 'js');
});

Tinytest.add('cookies: set() / get() / has() - TRUE', test => {
  const testVal = true;
  const setRes = cookies.set('testTrue', testVal);
  test.isTrue(setRes);
  test.isTrue(cookies.has('testTrue'));
  test.equal(cookies.get('testTrue', document.cookie), testVal, 'document.cookie');
  test.equal(cookies.get('testTrue'), testVal, 'js');
});

Tinytest.add('cookies: set() / get() / has() - NULL', test => {
  const testVal = null;
  const setRes = cookies.set('testNull', testVal);
  test.isTrue(setRes);
  test.isTrue(cookies.has('testNull'));
  test.equal(cookies.get('testNull', document.cookie), testVal, 'document.cookie');
  test.equal(cookies.get('testNull'), testVal, 'js');
});

Tinytest.add('cookies: set() / get() - Object', test => {
  const testVal = {key: '1', key2: {key1: 1, key2: false, key3: [true, false]}};
  const setRes = cookies.set('testObject', testVal);
  test.isTrue(setRes);
  test.equal(cookies.get('testObject', document.cookie), testVal, 'document.cookie');
  test.equal(cookies.get('testObject'), testVal, 'js');
});

Tinytest.add('cookies: set() / get() - Object Circle', test => {
  const testVal = {key: '1', key2: {key1: 1, key2: false, key3: [true, false]}};
  testVal.slef = testVal;
  const setRes = cookies.set('testObject', testVal);
  test.isTrue(setRes);
  const _testVal = antiCircular(Object.assign({}, testVal));
  test.equal(cookies.get('testObject', document.cookie), _testVal, 'document.cookie');
  test.equal(cookies.get('testObject'), _testVal, 'js');
});

Tinytest.add('cookies: set() / get() - Array', test => {
  const testVal = [true, false, null, {key1: 1, key2: false, key3: [true, false]}, [1, 2, 3, '4', '5']];
  const setRes = cookies.set('testArray', testVal);
  test.isTrue(setRes);
  test.equal(cookies.get('testArray', document.cookie), testVal, 'document.cookie');
  test.equal(cookies.get('testArray'), testVal, 'js');
});

Tinytest.add('cookies: set() / get() - Array Circle', test => {
  const obj = {asd: 'dsa', arr: [1, 2, 3]};
  obj.slef = ['a', obj, 'c'];
  const testVal = [true, false, null, {key1: 1, key2: false, key3: [true, false]}, [1, 2, 3, '4', '5'], obj];
  const setRes = cookies.set('testArray', testVal);
  test.isTrue(setRes);
  test.equal(cookies.get('testArray', document.cookie), antiCircular(testVal), 'document.cookie');
  test.equal(cookies.get('testArray'), antiCircular(testVal), 'js');
});

Tinytest.add('cookies: set() / get() / has() - no key', test => {
  test.isFalse(cookies.set());
  test.isUndefined(cookies.get());
  test.isFalse(cookies.has());
});

Tinytest.add('cookies: get() / has() - from custom string', test => {
  const testVal = 'customCookieVal';
  const cookie = `customCookie=${testVal}; `;
  test.equal(cookies.get('customCookie', cookie), testVal);
  test.equal(cookies.get('asd', cookie), undefined);
  test.isTrue(cookies.has('customCookie', cookie));
  test.isFalse(cookies.has('asd', cookie));
});

Tinytest.add('cookies: get() - non existent cookie', test => {
  test.isUndefined(cookies.get('1234567890321-asdfghjk', document.cookie), 'document.cookie');
  test.isUndefined(cookies.get('1234567890321-asdfghjk'), 'js');
});

Tinytest.add('cookies: remove() - non existent cookie', test => {
  const removeRes = cookies.remove('1234567890asdfghjk');
  test.isFalse(removeRes);
});


Tinytest.add('cookies: keys() / has() / remove() - String', test => {
  cookies.remove();

  cookies.set('testCookieOne', 'One');
  cookies.set('testCookieTwo', 'Two');

  test.equal(cookies.keys(), ['testCookieOne', 'testCookieTwo']);

  test.isTrue(cookies.has('testCookieOne'));
  test.isTrue(cookies.has('testCookieTwo'));

  const removeRes = cookies.remove('testCookieOne');
  test.isTrue(removeRes);

  test.isFalse(cookies.has('testCookieOne'));
  test.isTrue(cookies.has('testCookieTwo'));
});

Tinytest.add('cookies: remove() - all', test => {
  let removeRes = cookies.remove();
  test.isTrue(removeRes);
  test.equal(cookies.keys(), []);

  removeRes = cookies.remove();
  test.isFalse(removeRes);
});

Tinytest.addAsync('cookies: send(callback) - empty', (test, next) => {
  test.equal(document.cookie, '', 'document.cookie is empty before setting a cookie');
  cookies.set('FORSERVERTEST-SYNC', '_form_client_to_server_tests_');
  test.include(document.cookie, 'FORSERVERTEST-SYNC', 'document.cookie has FORSERVERTEST-SYNC after setting cookie');

  cookies.send((error, response) => {
    if (error) {
      test.fail('send failed with error: ' + error);
    } else {
      // Verify that the response is a valid fetch Response object.
      test.isTrue(response.ok, 'Expected response.ok to be true');
      test.equal(typeof response.text, 'function', 'Expected response.text() to be a function');

      test.include(document.cookie, 'FORSERVERTEST-SYNC', 'document.cookie still has FORSERVERTEST-SYNC after receiving server response');
    }
    cookies.remove();
    next();
  });
});

Tinytest.addAsync('cookies: send(callback) - add cookie on server', (test, next) => {
  test.equal(document.cookie, '', 'document.cookie is empty before setting a cookie');
  cookies.set('TEST-ADD-FROM-SERVER', '_this_cookie_will_be_removed_by_server_');
  test.include(document.cookie, 'TEST-ADD-FROM-SERVER', 'document.cookie has TEST-ADD-FROM-SERVER after setting cookie');

  cookies.send((error, response) => {
    if (error) {
      test.fail('send failed with error: ' + error);
    } else {
      // Verify that the response is a valid fetch Response object.
      test.isTrue(response.ok, 'Expected response.ok to be true');
      test.equal(typeof response.text, 'function', 'Expected response.text() to be a function');
      test.include(document.cookie, 'TEST-ADD-FROM-SERVER', 'document.cookie still has TEST-ADD-FROM-SERVER after receiving server respons');
      test.include(document.cookie, 'ADDED-FROM-SERVER', 'document.cookie ADDED-FROM-SERVER was added by server');
      test.isTrue(cookies.has('ADDED-FROM-SERVER'), 'Has ADDED-FROM-SERVER added by server');
      test.isTrue(cookies.get('ADDED-FROM-SERVER'), 'ADDED-FROM-SERVER value is true');
    }
    cookies.remove();
    next();
  });
});

Tinytest.addAsync('cookies: sendAsync - default', async (test) => {
  test.equal(document.cookie, '', 'document.cookie is empty before setting a cookie');
  cookies.set('FORSERVERTESTS-ASYNC', '_form_client_to_server_tests_async_');
  test.include(document.cookie, 'FORSERVERTESTS-ASYNC', 'document.cookie has FORSERVERTESTS-ASYNC after setting cookie');
  try {
    const response = await cookies.sendAsync();
    // Verify that the response is a valid fetch Response object.
    test.isTrue(response.ok, 'Expected response.ok to be true');
    test.equal(typeof response.text, 'function', 'Expected response.text() to be a function');

    test.include(document.cookie, 'FORSERVERTESTS-ASYNC', 'document.cookie still has FORSERVERTESTS-ASYNC after receiving server response');
  } catch (error) {
    test.fail('sendAsync failed with error: ' + error);
  } finally {
    cookies.remove();
  }
});

Tinytest.addAsync('cookies: sendAsync - remove on server', async (test) => {
  test.equal(document.cookie, '', 'document.cookie is empty before setting a cookie');
  cookies.set('TEST-TO-REMOVE', '_this_cookie_will_be_removed_by_server_');
  test.include(document.cookie, 'TEST-TO-REMOVE', 'document.cookie has TEST-TO-REMOVE after setting cookie');
  try {
    const response = await cookies.sendAsync();
    // Verify that the response is a valid fetch Response object.
    test.isTrue(response.ok, 'Expected response.ok to be true');
    test.equal(typeof response.text, 'function', 'Expected response.text() to be a function');
    test.notInclude(document.cookie, 'TEST-TO-REMOVE', 'document.cookie TEST-TO-REMOVE was removed by server');
  } catch (error) {
    test.fail('sendAsync failed with error: ' + error);
  } finally {
    cookies.remove();
  }
});

Tinytest.addAsync('cookies: sendAsync - add cookie on server', async (test) => {
  test.equal(document.cookie, '', 'document.cookie is empty before setting a cookie');
  cookies.set('TEST-ADD-FROM-SERVER', '_this_cookie_will_be_removed_by_server_');
  test.include(document.cookie, 'TEST-ADD-FROM-SERVER', 'document.cookie has TEST-ADD-FROM-SERVER after setting cookie');
  try {
    const response = await cookies.sendAsync();
    // Verify that the response is a valid fetch Response object.
    test.isTrue(response.ok, 'Expected response.ok to be true');
    test.equal(typeof response.text, 'function', 'Expected response.text() to be a function');
    test.include(document.cookie, 'TEST-ADD-FROM-SERVER', 'document.cookie still has TEST-ADD-FROM-SERVER after receiving server respons');
    test.include(document.cookie, 'ADDED-FROM-SERVER', 'document.cookie ADDED-FROM-SERVER was added by server');
    test.isTrue(cookies.has('ADDED-FROM-SERVER'), 'Has ADDED-FROM-SERVER added by server');
    test.isTrue(cookies.get('ADDED-FROM-SERVER'), 'ADDED-FROM-SERVER value is true');
  } catch (error) {
    test.fail('sendAsync failed with error: ' + error);
  } finally {
    cookies.remove();
  }
});
