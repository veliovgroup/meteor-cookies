Tinytest.add('Meteor.cookie: set() / get()', function (test) {
  var testVal = 'this is test value';
  var setRes = Meteor.cookie.set('testCookie', testVal);
  test.isTrue(setRes);
  test.equal(Meteor.cookie.get('testCookie'), testVal);
});

Tinytest.add('Meteor.cookie: remove() non existent cookie', function (test) {
  var removeRes = Meteor.cookie.remove('1234567890asdfghjk');
  test.isFalse(removeRes);
});


Tinytest.add('Meteor.cookie: remove() all', function (test) {
  var removeRes = Meteor.cookie.remove();
  test.isTrue(removeRes);
  test.equal(Meteor.cookie.keys(), []);

  removeRes = Meteor.cookie.remove();
  test.isFalse(removeRes);
});

Tinytest.add('Meteor.cookie: keys() / has() / remove() some', function (test) {
  Meteor.cookie.remove();

  var setResOne = Meteor.cookie.set('testCookieOne', 'One');
  var setResTwo = Meteor.cookie.set('testCookieTwo', 'Two');

  test.equal(Meteor.cookie.keys(), ['testCookieOne', 'testCookieTwo']);

  test.isTrue(Meteor.cookie.has('testCookieOne'));
  test.isTrue(Meteor.cookie.has('testCookieTwo'));

  var removeRes = Meteor.cookie.remove('testCookieOne');
  test.isTrue(removeRes);

  test.isFalse(Meteor.cookie.has('testCookieOne'));
  test.isTrue(Meteor.cookie.has('testCookieTwo'));
});