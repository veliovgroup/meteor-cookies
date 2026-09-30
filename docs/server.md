# Server usage

## Middleware order

`new Cookies()` registers a `WebApp.connectHandlers` middleware that sets `req.Cookies`. Handlers registered before it don't see `req.Cookies`.

- Call `new Cookies()` before registering routes.
- In `.meteor/packages`, place `ostrio:cookies` above community packages that register routes.

## Request lifecycle

- `req.Cookies` holds cookies from the request `Cookie` header.
- `req.Cookies.set()` and `req.Cookies.remove()` update `req.Cookies` right away and append a `Set-Cookie` header to the response.
- The browser stores the new cookies when it receives the response. A client `Cookies` instance picks them up after a page reload or after `.send()` / `.sendAsync()` resolves.
- `Set-Cookie` values written by other code on the same response are kept.

## One middleware, many handlers

Only one `Cookies` middleware runs at a time. Each `new Cookies({ handler, onCookies })` adds its callbacks to shared maps, and that one middleware calls them all.

- `handler(cookies)` runs on every request, except `/___cookie___/set`.
- `onCookies(cookies)` runs when the client calls `.send()` or `.sendAsync()`. It requires a registered middleware.
- `.destroy()` removes the instance's callbacks. If the instance owns the middleware, another live instance takes it over, preferring instances created with `auto: true`. With no live instances left, the next `new Cookies()` takes over.
- Calling `.middleware()` while a middleware is registered logs a warning and returns a middleware that only calls `next()`.

## `/___cookie___/set` endpoint

`.send()` and `.sendAsync()` request this endpoint. The server:

1. Rejects cross-site requests with `403` without running hooks. A request is accepted when its `Origin` matches `ROOT_URL`, `MOBILE_ROOT_URL`, `allowedCordovaOrigins`, or the request `Host`, or when it has no `Origin` and `Sec-Fetch-Site` isn't `cross-site` or `same-site`.
2. Runs the `onCookies` hooks.
3. Responds `200` with an empty `text/plain` body.

The server doesn't echo request cookies back as `Set-Cookie`, because that would drop their original attributes (`HttpOnly`, `Secure`, `SameSite`, `Expires`). Cordova and Meteor-Desktop cookies sent in the query string are the exception, see [Cordova and Meteor-Desktop](./cordova.md).

## Examples

### Multiple handlers across modules

```js
import { Cookies } from 'meteor/ostrio:cookies';
import { WebApp } from 'meteor/webapp';

// Registers the middleware and sets req.Cookies
const globalCookies = new Cookies();

// checkout module
WebApp.connectHandlers.use((req, res, next) => {
  if (req.Cookies.has('checkout-session')) {
    const sessionId = req.Cookies.get('checkout-session');
    if (isCheckoutSessionValid(sessionId)) {
      res.statusCode = 302;
      res.setHeader('Location', `https://example.com?chsessid=${sessionId}`);
      res.end();
      return;
    }

    req.Cookies.remove('checkout-session');
  }

  next();
});

// session module
const sessionCookies = new Cookies({
  auto: false,
  async handler(cookies) {
    if (cookies.has('session-exp')) {
      if (cookies.get('session-exp') < Date.now()) {
        cookies.remove('session-id');
        cookies.remove('session-exp');
      }
    } else {
      cookies.set('session-type', 'new-user');
    }
  }
});

// Unregister the handler when it isn't needed
sessionCookies.destroy();
```

### Set cookies based on URL

`cookies.response.req` is the Node.js `IncomingMessage`:

```js
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Cookies } from 'meteor/ostrio:cookies';

new Cookies({
  auto: false,
  async handler(cookies) {
    const url = new URL(cookies.response.req.url, Meteor.absoluteUrl());
    switch (url.pathname) {
      case '/signup/create': {
        cookies.set('selected-tariff', url.searchParams.get('plan') || 'default-plan');
        break;
      }
      case '/shopping-cart/new': {
        cookies.set('checkout-session', Random.id());
        break;
      }
    }
  }
});
```

### Manual middleware registration

```js
import { Meteor } from 'meteor/meteor';
import { Cookies } from 'meteor/ostrio:cookies';

if (Meteor.isServer) {
  const { WebApp } = require('meteor/webapp');
  const cookies = new Cookies({
    auto: false,
    handler(cookies) {
      console.log(cookies.get('gender'));
    }
  });
  WebApp.connectHandlers.use(cookies.middleware());
}
```

### `CookiesCore` without middleware

```js
import { WebApp } from 'meteor/webapp';
import { CookiesCore } from 'meteor/ostrio:cookies';

WebApp.connectHandlers.use((request, response, next) => {
  const cookies = new CookiesCore({
    _cookies: request.headers.cookie || '',
    response
  });

  if (cookies.has('session-exp') && cookies.get('session-exp') < Date.now()) {
    // Appends Set-Cookie header with an expired date
    cookies.remove('session-id');
    cookies.remove('session-exp');
  }
  next();
});
```
