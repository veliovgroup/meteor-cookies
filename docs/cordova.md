# Cordova and Meteor-Desktop

Server-set cookies work on Cordova and Meteor-Desktop without extra setup. Sending cookies from *Client* to *Server* with `.send()` or `.sendAsync()` needs the steps below, because the app runs on `http://localhost:12XXX` while the server runs on `ROOT_URL`.

## Setup

Use the same options on *Client* and *Server*:

```js
import { Cookies } from 'meteor/ostrio:cookies';

const cookies = new Cookies({
  allowQueryStringCookies: true,
  allowedCordovaOrigins: true
});
```

On the client:

```js
cookies.set('locale', 'en');
await cookies.sendAsync();
```

## How it works

1. `.send()` and `.sendAsync()` request `ROOT_URL/___cookie___/set?___cookies___=<encoded cookies>` with `credentials: 'include'`.
2. The server reads the query string only when the request `Origin` matches `allowedCordovaOrigins`. `true` means `^http://localhost:12[0-9]{3}$`.
3. The server returns the received cookies as `Set-Cookie` headers with `Path=/`. Other attributes (`Expires`, `Secure`, `SameSite`, `HttpOnly`) are not sent with the query string, so the server can't restore them.
4. `onCookies` hooks receive a `CookiesCore` instance with the request `Cookie` header merged with the query-string cookies.

In a regular browser the query string is not used. The browser sends cookies in the `Cookie` header, and the server doesn't echo them back.

## Custom origins

Pass a `RegExp` when the app runs on a different origin:

```js
new Cookies({
  allowQueryStringCookies: true,
  allowedCordovaOrigins: /^https:\/\/localhost:12[0-9]{3}$/
});
```

## Security notes

- Cookies in a query string can end up in proxy and access logs. Don't sync secrets this way.
- Keep `allowedCordovaOrigins` as narrow as possible. A broad `RegExp` lets any matching origin set cookies on the server origin.
