# Migration from v2 to v3

```shell
meteor add ostrio:cookies@3.0.0
```

The public API keeps its methods and options. v3 changes the behavior below.

## `remove()` with an empty key

Only `remove()` without arguments removes all cookies. `remove('')`, `remove(null)`, and other falsy keys now return `false` and remove nothing.

```js
// v2: removes ALL cookies when `name` is empty
// v3: no-op, returns false
cookies.remove(name);

// Remove all cookies in v3
cookies.remove();
```

## `/___cookie___/set` no longer echoes request cookies

In v2 the endpoint returned every request cookie as `Set-Cookie: name=value; Path=/`. That dropped `HttpOnly`, `Secure`, `SameSite`, and `Expires` from existing cookies. In v3 the endpoint sets only cookies that `onCookies` hooks set, plus Cordova/Meteor-Desktop cookies sent in the query string.

Action: none, unless your code reads `Set-Cookie` from the `.send()` response.

## Cordova and Meteor-Desktop cookie values are decoded once

v2 decoded the `___cookies___` query parameter twice when Meteor's query parser had already decoded it. A value like `v%41` reached the server as `vA`. v3 keeps the value as the client set it.

## Cross-site requests to `/___cookie___/set` are rejected

The endpoint responds `403` and skips `onCookies` hooks for requests from other sites. See [docs/server.md](./server.md#___cookie___set-endpoint) for the rules.

Action: on Cordova and Meteor-Desktop, set `allowedCordovaOrigins` on the *Server*. See [docs/cordova.md](./cordova.md).

## Cookie names containing `;`, `=`, or a percent sequence

Names with `;`, `=`, or a literal percent sequence such as `%41` or `%u0041` are now percent-encoded in `Set-Cookie`. `get()` and `has()` decode them back. A cookie with such a name that v2 wrote raw can't be removed by `remove(name)` in v3. v2 couldn't read those names back correctly either, for example `a%41` came back as `aA`.

## `path`, `domain`, or `sameSite` containing `;`

`set()` and `remove()` throw `Meteor.Error` with `option path is invalid`, `option domain is invalid`, or `option sameSite is invalid`. In v2 the value was written as-is and added extra cookie attributes.

## Object and array values with repeated references

v2 dropped every object that appeared more than once in a value, even without a cycle. `{ a: tag, b: tag }` was stored as `{ a: tag }`. v3 drops only circular references.

## `TTL` and the deprecated `expire` option

`set(key, value, { expire })` on an instance with `TTL` now uses `expire`. v2 replaced it with the `TTL` date.

## `expires: 0`

It creates a session cookie without the `Expires` attribute. v2 wrote `Expires=0`, which browsers ignore, so the result is the same, but the header is now valid.

## `maxAge`

Non-finite values (`NaN`, `Infinity`) are ignored. Fractional values are rounded down.

## Server middleware ownership

When the instance that owns the middleware is destroyed, another live instance takes it over, so remaining `handler` and `onCookies` callbacks keep running. In v2 they stopped until a new `new Cookies()` was created. `Cookies.__dispatch` is registered in `WebApp.connectHandlers` only once.

## TypeScript

`index.d.ts` is now an ES module, which `zodern:types` requires. Imports stay the same:

```ts
import { Cookies, CookiesCore, type CookieOptions } from 'meteor/ostrio:cookies';
```

New typed members: `NAME`, `id`, `response`, `isDestroyed`, `Cookies.isMiddlewareRegistered`. `req.Cookies` is typed on Node's `IncomingMessage`.

`CookieRequest` and `CookieResponse` no longer have a `[key: string]: unknown` index signature. With it, TypeScript rejected `WebApp.connectHandlers.use(cookies.middleware())` and `new CookiesCore({ response })` with Node's `ServerResponse`. Code that read untyped properties from these two types needs a cast.
