import { Cookies, CookiesCore } from 'meteor/ostrio:cookies';
import { isFunction } from '../helpers';
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

