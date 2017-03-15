import { Cookies } from 'meteor/ostrio:cookies';

if(Meteor.isClient){
  const cookies = new Cookies();

  Tinytest.add('From Server to Client', test => {
    test.equal(cookies.get('FORCLIENT'), '_form_server_to_client_tests_');
  });

  Tinytest.add('cookies: set() - empty value', test => {
    const testVal = void 0;
    const setRes = cookies.set('testCookieEmpty', testVal);
    test.isFalse(setRes);
    test.equal(cookies.get('testCookieEmpty'), testVal);
  });

  Tinytest.add('cookies: set() / get() - String', test => {
    const testVal = 'this is test value';
    const setRes = cookies.set('testCookie', testVal);
    test.isTrue(setRes);
    test.equal(cookies.get('testCookie'), testVal);
  });

  Tinytest.add('cookies: set() / get() / has() - Unicode', function (test) {
    const testVal = '⦶';
    const setRes = cookies.set('⦁', testVal);
    test.isTrue(setRes);
    test.isTrue(cookies.has('⦁'));
    test.isFalse(cookies.has('⦁⦁⦁'));
    test.equal(cookies.get('⦁'), testVal);
  });

  Tinytest.add('cookies: set() / get() / has() - Unicode 2', function (test) {
    const testVal = '小飼弾\n小飼弾';
    const setRes = cookies.set('小飼弾', testVal);
    test.isTrue(setRes);
    test.isTrue(cookies.has('小飼弾'));
    test.equal(cookies.get('小飼弾'), testVal);
  });

  Tinytest.add('cookies: set() / get() / has() - FALSE', test => {
    const testVal = false;
    const setRes = cookies.set('testFalse', testVal);
    test.isTrue(setRes);
    test.isTrue(cookies.has('testFalse'));
    test.equal(cookies.get('testFalse'), testVal);
  });

  Tinytest.add('cookies: set() / get() / has() - TRUE', test => {
    const testVal = true;
    const setRes = cookies.set('testTrue', testVal);
    test.isTrue(setRes);
    test.isTrue(cookies.has('testTrue'));
    test.equal(cookies.get('testTrue'), testVal);
  });

  Tinytest.add('cookies: set() / get() / has() - NULL', test => {
    const testVal = null;
    const setRes = cookies.set('testNull', testVal);
    test.isTrue(setRes);
    test.isTrue(cookies.has('testNull'));
    test.equal(cookies.get('testNull'), testVal);
  });

  Tinytest.add('cookies: set() / get() - Object', test => {
    const testVal = {key: '1', key2: {key1: 1, key2: false, key3: [true, false]}};
    const setRes = cookies.set('testObject', testVal);
    test.isTrue(setRes);
    test.equal(cookies.get('testObject'), testVal);
  });

  Tinytest.add('cookies: set() / get() - Array', test => {
    const testVal = [true, false, null, {key1: 1, key2: false, key3: [true, false]}, [1, 2, 3, '4', '5']];
    const setRes = cookies.set('testArray', testVal);
    test.isTrue(setRes);
    test.equal(cookies.get('testArray'), testVal);
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
    test.isUndefined(cookies.get('1234567890321-asdfghjk'));
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
    cookies.send(() => {
      test.isTrue(true);
      next();
    });
  });

  Tinytest.add('Server test - see in console', () => {});

  Tinytest.add('From Client to Server', () => {
    cookies.set('FORSERVERTEST', '_form_client_to_server_tests_');
    cookies.send();
  });

  Tinytest.addAsync('cookies: send(callback) - default', (test, next) => {
    cookies.send(() => {
      test.isTrue(true);
      next();
    });
  });
} else {
  const tester = (one, two, testname) => {
    if(EJSON.equals(one, two)){
      console.info(`[${testname}] PASSED`);
    }else{
      console.warn(`[${testname}] Failed`, `Expected: ${JSON.stringify(two)}`, `Got: ${JSON.stringify(one)}`);
    }
  };

  const cookie = new Cookies({
    auto: false,
    handler(cookies) {
      tester(cookies.get('FORSERVERTEST'), '_form_client_to_server_tests_', 'From Client to Server [First Time should FAIL]');

      (() => {
        const testVal = '⦶';
        const setRes = cookies.set('⦁', testVal);
        tester(setRes, true, 'Unicode .set()', cookies);
        tester(cookies.has('⦁'), true, 'Unicode .has()', cookies);
        tester(cookies.has('⦁⦁⦁'), false, 'Unicode .has() non-existent', cookies);
        tester(cookies.get('⦁'), testVal, 'Unicode .get()', cookies);
      })();

      (() => {
        const testVal = '小飼弾\n小飼弾';
        const setRes = cookies.set('小飼弾', testVal);
        tester(setRes, true, 'Unicode 2 .set()', cookies);
        tester(cookies.has('小飼弾'), true, 'Unicode 2 .has()', cookies);
        tester(cookies.get('小飼弾'), testVal, 'Unicode 2 .get()', cookies);
      })();

      (() => {
        const testVal = void 0;
        const setRes = cookies.set('testCookieEmpty', testVal);
        tester(setRes, false, 'test empty value', cookies);
        tester(cookies.get('testCookieEmpty'), testVal, 'test empty value', cookies);
      })();

      (() => {
        const testVal = 'this is test value';
        const setRes = cookies.set('testCookie', testVal);
        tester(setRes, true, 'cookies.set', cookies);
        tester(cookies.get('testCookie'), testVal, 'cookies.get', cookies);
      })();

      (() => {
        tester(cookies.set(), false, 'cookies.set()', cookies);
        tester(cookies.get(), undefined, 'cookies.get()', cookies);
        tester(cookies.has(), false, 'cookies.has()', cookies);
      })();

      (() => {
        const testVal = 'customCookieVal';
        const _cookie = `customCookie=${testVal}; `;
        tester(cookies.get('customCookie', _cookie), testVal, "cookies.get('customCookie')", cookies);
        tester(cookies.get('asd', _cookie), undefined, "cookies.get('asd')", cookies);
        tester(cookies.has('customCookie', _cookie), true, "cookies.has('customCookie')", cookies);
        tester(cookies.has('asd', _cookie), false, "cookies.has('asd')", cookies);
      })();


      (() => {
        const removeRes = cookies.remove('1234567890asdfghjk');
        tester(removeRes, false, "cookies.remove('1234567890asdfghjk')", cookies);
      })();

      (() => {
        tester(cookies.get('1234567890asdfghjk'), undefined, "cookies.get('1234567890asdfghjk')", cookies);
      })();

      (() => {
        cookies.remove();

        cookies.set('testCookieOne', 'One');
        cookies.set('testCookieTwo', 'Two');

        tester(cookies.keys(), ['testCookieOne', 'testCookieTwo'], 'cookies.keys()', cookies);

        tester(cookies.has('testCookieOne'), true, "cookies.has('testCookieOne')", cookies);
        tester(cookies.has('testCookieTwo'), true, "cookies.has('testCookieTwo')", cookies);

        const removeRes = cookies.remove('testCookieOne');
        tester(removeRes, true, "cookies.remove('testCookieOne')", cookies);

        tester(cookies.has('testCookieOne'), false, "cookies.has('testCookieOne')", cookies);
        tester(cookies.has('testCookieTwo'), true, "cookies.has('testCookieTwo')", cookies);
      })();

      (() => {
        let removeRes = cookies.remove();
        tester(removeRes, true, 'cookies.remove()', cookies);
        tester(cookies.keys(), [], 'cookies.keys()', cookies);

        removeRes = cookies.remove();
        tester(removeRes, false, 'cookies.remove()', cookies);
      })();

      cookies.set('FORCLIENT', '_form_server_to_client_tests_');
    }
  });

  WebApp.connectHandlers.use(cookie.middleware());
}
