---
name: ostrio-cookies
description: Use when a Meteor.js app imports `meteor/ostrio:cookies` or lists `ostrio:cookies` in `.meteor/packages` or `.meteor/versions`, and the task reads, sets, or removes cookies on the client or server, touches `req.Cookies`, `send()`, `sendAsync()`, `onCookies`, or `CookiesCore`, involves cookies missing on the server or stale on the client, Cordova or Meteor-Desktop cookie sync, or an upgrade of the package between major versions.
license: BSD-3-Clause
compatibility: Meteor.js apps that use the ostrio:cookies Atmosphere package
metadata:
  author: veliovgroup
  version: "3.0.0"
---

# ostrio:cookies

Isomorphic cookies for Meteor. Client and server share one API: `get`, `set`, `remove`, `has`, `keys`.

## Match the installed version first

1. Read the `ostrio:cookies@` line in `.meteor/versions` and the release in `.meteor/release`.
2. This skill describes v3. On v2, or when upgrading from v2, read [migration-v3.md](https://github.com/veliovgroup/Meteor-Cookies/blob/master/docs/migration-v3.md) before writing code. In v2 `remove('')` deletes every cookie, and `/___cookie___/set` echoes request cookies and accepts cross-site requests.
3. On a newer major, read `docs/migration-v<major>.md` in the same repository.
4. Meteor 3: `WebApp.handlers` (Express) and `WebApp.connectHandlers` are the same object. Meteor 2: only `WebApp.connectHandlers` (Connect).

## Usage

```js
import { Meteor } from 'meteor/meteor';
import { Cookies } from 'meteor/ostrio:cookies';

// Create once, before any route is registered
const cookies = new Cookies({ TTL: 31557600000 }); // default expiry in ms

if (Meteor.isClient) {
  cookies.set('locale', 'en', { secure: true, sameSite: 'Lax' });
  cookies.get('locale'); // 'en'
  // Runs server `onCookies` hooks, then re-reads document.cookie
  cookies.sendAsync().then((response) => response.ok);
}

if (Meteor.isServer) {
  const { WebApp } = require('meteor/webapp');
  WebApp.connectHandlers.use((req, _res, next) => {
    // req.Cookies is the per-request CookiesCore. `cookies` above holds no request data
    req.Cookies.set('seen', true, { httpOnly: true });
    next();
  });
}
```

## Quick reference

| Call | Where | Notes |
|---|---|---|
| `get(key)` | both | `undefined` when missing |
| `set(key, value, opts)` | both | Value: string, number, boolean, null, object, array |
| `remove(key, path, domain)` | both | `remove()` without arguments removes all |
| `has(key)`, `keys()` | both | |
| `send(cb)`, `sendAsync()` | client | Request `/___cookie___/set` |
| `middleware()`, `destroy()` | server | Throw on the client |
| `new CookiesCore({ _cookies, setCookie, response })` | both | Parses a cookie string or a `Set-Cookie` header |

- `set` options: `path` (default `/`), `domain`, `expires` (`Date`, ms timestamp, `Infinity`, or `0` for a session cookie), `maxAge` (seconds), `secure`, `httpOnly`, `sameSite`, `partitioned`, `priority`.
- Server options: `handler(cookies)` runs on every HTTP request, `onCookies(cookies)` runs when the client calls `send()` or `sendAsync()`. Both receive a `CookiesCore`, and `set()` or `remove()` on it adds `Set-Cookie` to that response. The request is `cookies.response.req`.
- All `new Cookies()` instances share one middleware. With `auto: false`, mount `cookies.middleware()` yourself.

## Common mistakes

- **Reading cookies from the `new Cookies()` instance on the server.** It has no request. Use `req.Cookies`, or the argument of `handler` and `onCookies`.
- **`req.Cookies` is `undefined`.** `new Cookies()` ran after the route was registered, or `ostrio:cookies` sits below the package that registers routes in `.meteor/packages`. `WebApp.rawHandlers` and `WebApp.rawConnectHandlers` run before it.
- **Cookies in methods or publications.** DDP has no `req.Cookies`, and `this.connection.httpHeaders` has no `cookie` header. Pass the value as an argument, or handle it in HTTP middleware.
- **`httpOnly` on the client.** Browsers reject it from JavaScript. Set it on the server, before response headers are sent.
- **Stale client value.** The client instance reads `document.cookie` once. Cookies set by a server response appear after a page reload or after `sendAsync()`.
- **Types after a reload.** A number comes back as a string, on the server too. The strings `'true'`, `'false'`, `'null'` come back as `true`, `false`, `null`.
- **`remove(key)` leaves the cookie.** Pass the same `path` and `domain` used in `set()`.
- **`onCookies` never runs.** A manual `.middleware()` doesn't serve `/___cookie___/set`. Use the default `auto: true`.
- **Cordova and Meteor-Desktop.** `send()` transfers cookies only with `{ allowQueryStringCookies: true, allowedCordovaOrigins: true }` on client and server. Values travel in the URL, so don't sync secrets.

## TypeScript

Types ship with the package and load through `zodern:types`. `req.Cookies` is typed on Node's `IncomingMessage` as `CookiesCore | undefined`. Narrow a value with `cookies.get<string>('locale')`.

## More

- [README](https://github.com/veliovgroup/Meteor-Cookies#api): full API
- [docs/server.md](https://github.com/veliovgroup/Meteor-Cookies/blob/master/docs/server.md): middleware order, handlers, `/___cookie___/set` rules
- [docs/cordova.md](https://github.com/veliovgroup/Meteor-Cookies/blob/master/docs/cordova.md): Cordova and Meteor-Desktop setup
