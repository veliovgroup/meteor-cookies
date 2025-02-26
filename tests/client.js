import { Cookies } from 'meteor/ostrio:cookies';
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

Tinytest.add('cookies: set() / get() / has() - various values', function (test) {
  for (let i = testKeyVals.length - 1; i >= 0; i--) {
    const { key, value } = testKeyVals[i];
    const setRes = cookies.set(key, value);
    test.isTrue(setRes, true, `Set cookie with key ${key}`);
    test.isTrue(cookies.has(key), `cookies.has(${key})`);
    test.isFalse(cookies.has(`${key}${key}${key}`), `NO cookie.has(${key}${key}${key})`);

    if (isObject(value) || isArray(value)) {
      test.equal(cookies.get(key), JSON.parse(antiCircular(value)), `cookie.get(${key}) returns correct value`);
    } else {
      test.equal(cookies.get(key), value, `cookie.get(${key}) returns correct value`);
    }
  }
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
