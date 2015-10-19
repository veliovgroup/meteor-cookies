Meteor.startup(function(){
  if(Meteor.isClient){
    Tinytest.add('Cookies: set() / get()', function (test) {
      var testVal = 'this is test value';
      var setRes = Cookies.set('testCookie', testVal);
      test.isTrue(setRes);
      test.equal(Cookies.get('testCookie'), testVal);
    });

    Tinytest.add('Cookies: set() / get() / has() no key', function (test) {
      test.isFalse(Cookies.set());
      test.isNull(Cookies.get());
      test.isFalse(Cookies.has());
    });

    Tinytest.add('Cookies: get() / has() from custom string', function (test) {
      var testVal = 'customCookieVal';
      var cookie = 'customCookie='+testVal+'; ';
      test.equal(Cookies.get('customCookie', cookie), testVal);
      test.equal(Cookies.get('asd', cookie), null);
      test.isTrue(Cookies.has('customCookie', cookie));
      test.isFalse(Cookies.has('asd', cookie));
    });


    Tinytest.add('Cookies: remove() non existent cookie', function (test) {
      var removeRes = Cookies.remove('1234567890asdfghjk');
      test.isFalse(removeRes);
    });


    Tinytest.add('Cookies: keys() / has() / remove() some', function (test) {
      Cookies.remove();

      var setResOne = Cookies.set('testCookieOne', 'One');
      var setResTwo = Cookies.set('testCookieTwo', 'Two');

      test.equal(Cookies.keys(), ['testCookieOne', 'testCookieTwo']);

      test.isTrue(Cookies.has('testCookieOne'));
      test.isTrue(Cookies.has('testCookieTwo'));

      var removeRes = Cookies.remove('testCookieOne');
      test.isTrue(removeRes);

      test.isFalse(Cookies.has('testCookieOne'));
      test.isTrue(Cookies.has('testCookieTwo'));
    });

    Tinytest.add('Cookies: remove() all', function (test) {
      var removeRes = Cookies.remove();
      test.isTrue(removeRes);
      test.equal(Cookies.keys(), []);

      removeRes = Cookies.remove();
      test.isFalse(removeRes);
    });

    Tinytest.add('Server test - see in console', function(test){});

    // Tinytest.add('From Client to Server', function(test){
    //   Cookies.set('FORSERVERTEST222', '_form_client_to_server_tests_');
    //   Cookies.apply()
    // });
  }else{
    var tester = function(one, two, testname){
      if(EJSON.equals(one, two)){
        console.info('['+testname+'] PASSED');
      }else{
        console.warn('['+testname+'] Failed', 'Expected: ' + JSON.stringify(two), "Got: " + JSON.stringify(one));
      }
    }

    WebApp.connectHandlers.use(function(req, res, next){
      Cookies = req.Cookies;

      // tester(Cookies.get('FORSERVERTEST'), '_form_client_to_server_tests_');

      (function(){
        var testVal = 'this is test value';
        var setRes = Cookies.set('testCookie', testVal);
        tester(setRes, true, 'Cookies.set', Cookies);
        tester(Cookies.get('testCookie'), testVal, 'Cookies.get', Cookies);
      })();

      (function(){
        tester(Cookies.set(), false, 'Cookies.set()', Cookies);
        tester(Cookies.get(), null, 'Cookies.get()', Cookies);
        tester(Cookies.has(), false, 'Cookies.has()', Cookies);
      })();

      (function(){
        var testVal = 'customCookieVal';
        var cookie = 'customCookie='+testVal+'; ';
        tester(Cookies.get('customCookie', cookie), testVal, "Cookies.get('customCookie')", Cookies);
        tester(Cookies.get('asd', cookie), null, "Cookies.get('asd')", Cookies);
        tester(Cookies.has('customCookie', cookie), true, "Cookies.has('customCookie'_", Cookies);
        tester(Cookies.has('asd', cookie), false, "Cookies.has('asd')", Cookies);
      })();


      (function(){
        var removeRes = Cookies.remove('1234567890asdfghjk');
        tester(removeRes, false, "Cookies.remove('1234567890asdfghjk')", Cookies);
      })();


      (function(){
        Cookies.remove();

        var setResOne = Cookies.set('testCookieOne', 'One');
        var setResTwo = Cookies.set('testCookieTwo', 'Two');

        tester(Cookies.keys(), ['testCookieOne', 'testCookieTwo'], "Cookies.keys()", Cookies);

        tester(Cookies.has('testCookieOne'), true, "Cookies.has('testCookieOne')", Cookies);
        tester(Cookies.has('testCookieTwo'), true, "Cookies.has('testCookieTwo')", Cookies);

        var removeRes = Cookies.remove('testCookieOne');
        tester(removeRes, true, "Cookies.remove('testCookieOne')", Cookies);

        tester(Cookies.has('testCookieOne'), false, "Cookies.has('testCookieOne')", Cookies);
        tester(Cookies.has('testCookieTwo'), true, "Cookies.has('testCookieTwo')", Cookies);
      })();

      (function(){
        var removeRes = Cookies.remove();
        tester(removeRes, true, "Cookies.remove()", Cookies);
        tester(Cookies.keys(), [], "Cookies.keys()", Cookies);

        removeRes = Cookies.remove();
        tester(removeRes, false, "Cookies.remove()", Cookies);
      })();

      next();
    });
  }

});