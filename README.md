[![Meteor.js][badge-meteor]][meteor-url]
[![Release][badge-release]][release-url]
[![CI][badge-ci]][ci-url]
[![Coverage][badge-cov]](#running-tests)
[![License: BSD-3-Clause][badge-license]][license-url]
[![TypeScript][badge-ts]][ts-url]
[![zero dependencies][badge-deps]][meteor-url]
[![Last commit][badge-commit]][commits-url]
[![OpenSSF Scorecard][badge-scorecard]][scorecard-url]
[![Sponsor][badge-sponsor]][sponsor-url]
[![Donate][badge-donate]][donate-url]
<a href="https://bridge-cdn.com/?ref=github-cookies-repo-top"><img src="https://bridge-cdn.com/favicon.svg" alt="Bridge CDN" height="20"></a>
<a href="https://ostr.io/info/built-by-developers-for-developers?ref=github-cookies-repo-top"><img src="https://ostr.io/apple-touch-icon-60x60.png" alt="ostr.io" height="20"></a>
<a href="https://meteor-files.com/?ref=github-cookies-repo-top"><img src="https://meteor-files.com/apple-touch-icon-60x60.png" alt="meteor-files.com" height="20"></a>

# Cookies for Meteor

Isomorphic and bulletproof 🍪 cookie management for Meteor applications with support for *Client*, *Server*, *Browser*, *Cordova*, *Meteor-Desktop*, and other Meteor environments.

- 👨‍💻 Stable codebase
- 🚀 400,000+ downloads
- 👨‍🔬 TDD with Tinytest, CI fails below 95% coverage (`npm run test:coverage`)
- 📦 No external dependencies (no `underscore`, `jQuery`, or `Blaze`)
- 🖥 Consistent API across *Server* and *Client* environments
- 📱 Compatible with *Cordova*, *Browser*, *Meteor-Desktop*, and other client platforms
- ㊗️ Full Unicode support for cookie values
- 👨‍💻 Supports `String`, `Number`, `Array`, `Object`, `Boolean`, and `null` as cookie value types
- ♿ IE support, thanks to [@derwok](https://github.com/derwok)
- 📦 Shipped with TypeScript [types](https://github.com/veliovgroup/meteor-cookies/blob/master/index.d.ts)
- 🤖 Shipped with an [AI agent skill](#ai-agent-skill) for Claude Code, Codex, Cursor, and other coding agents
- 📦 Looking for persistent *Client* (Browser) storage? Try the [`ClientStorage` package](https://github.com/veliovgroup/Client-Storage#persistent-client-browser-storage).

## ToC:

- [Installation](#installation)
- [Import](#es6-import)
- [AI agent skill](#ai-agent-skill)
- [FAQ](#faq)
- [API](#api)
  - [`new Cookies()` constructor](#new-cookies-constructor) – Create a new `Cookies` instance
  - [`.get()`](#get) – Read a cookie
  - [`.set()`](#set) – Set a cookie
  - [`.remove()`](#remove) – Remove one or all cookies
  - [`.has()`](#has) – Check if a cookie exists
  - [`.keys()`](#keys) – List all cookie keys
  - [`.send()`](#send) – Sync cookies with the server
  - [`.sendAsync()`](#sendasync) – Sync cookies asynchronously
  - [`.middleware()`](#middleware) – Register cookie middleware manually
  - [`.destroy()`](#destroy) – Unregister hooks, callbacks, and middleware
  - [`new CookiesCore()` constructor](#new-cookiescore-constructor) – Low-level class that can be used to directly parse and manage cookies
- [Examples](#examples)
  - [Client Usage](#example-client-usage)
  - [Server Usage](#example-server-usage)
  - [More examples](#more-examples)
- [Running Tests](#running-tests)
- [Security](#security)
- [Support our open source contributions](#support-our-open-source-contributions)

## Installation

```shell
meteor add ostrio:cookies
```

Upgrading from v2? See [docs/migration-v3.md](https://github.com/veliovgroup/Meteor-Cookies/blob/master/docs/migration-v3.md)

## ES6 Import

```js
import { Cookies } from 'meteor/ostrio:cookies';
```

## AI agent skill

The [`ostrio-cookies` skill](https://github.com/veliovgroup/Meteor-Cookies/blob/master/.agents/skills/ostrio-cookies/SKILL.md) gives a coding agent the API, the common client and server mistakes, the Cordova setup, and the migration notes for the package version in your app. It follows the [Agent Skills](https://agentskills.io) format.

Run in the root of your Meteor app:

```shell
npx skills add veliovgroup/Meteor-Cookies --skill ostrio-cookies
```

Or copy the file without extra tools:

```shell
mkdir -p .agents/skills/ostrio-cookies
curl -fsSL https://raw.githubusercontent.com/veliovgroup/Meteor-Cookies/master/.agents/skills/ostrio-cookies/SKILL.md -o .agents/skills/ostrio-cookies/SKILL.md
```

Claude Code reads skills from `.claude/skills/`. For a manual copy, use that directory instead of `.agents/skills/`.

## FAQ

- **Cordova and Meteor-Desktop**: Server-set cookies work out of the box. To send cookies from *Client* to *Server*, set `{ allowQueryStringCookies: true, allowedCordovaOrigins: true }` on both *Client* and *Server*. See [docs/cordova.md](https://github.com/veliovgroup/Meteor-Cookies/blob/master/docs/cordova.md)
- **Cookies missing on Server?** Call `new Cookies()` **before** registering routes, and place `ostrio:cookies` above community packages in `.meteor/packages`. See [docs/server.md](https://github.com/veliovgroup/Meteor-Cookies/blob/master/docs/server.md#middleware-order)

## API

> [!NOTE]
> On the *Server*, `new Cookies()` registers one middleware that sets `req.Cookies`, a `CookiesCore` instance. `req.Cookies.set()` adds a `Set-Cookie` header to the current response. A *Client* instance sees the new cookie after a page reload or after `send()` / `sendAsync()` resolves
>
> Many `new Cookies()` instances share that one middleware. See [docs/server.md](https://github.com/veliovgroup/Meteor-Cookies/blob/master/docs/server.md#one-middleware-many-handlers)

### `new Cookies()` Constructor

Create a new instance of `Cookies` (available on both *Client* and *Server*).

**Arguments:**

- `opts` {*CookiesOptions*} - Config object

**Available CookiesOptions:**

- `opts.auto` {*boolean*} – [Server] Auto-bind as `req.Cookies` (default: `true`)
- `opts.handler` {*function*} – [Server] Custom middleware handler; receives a `CookiesCore` instance
- `opts.onCookies` {*function*} – [Server] Callback triggered after `.send()` or `.sendAsync()` is called and the cookies are received by the server. Runs only in the auto-registered middleware, not in a manual `.middleware()`
- `opts.TTL` {*number* | *boolean*} – Default expiration time (max-age) in milliseconds. Set to `false` for session cookies
- `opts.runOnServer` {*boolean*} – Set to `false` to disable server usage (default: `true`)
- `opts.allowQueryStringCookies` {*boolean*} – Allow passing cookies via query string (primarily for Cordova)
- `opts.allowedCordovaOrigins` {*RegExp* | *boolean*} – [Server] Allow setting cookies from specific origins (defaults to `^http:\/\/localhost:12[0-9]{3}$` if `true`)
- `opts.name` {*string*} - Sets `.NAME` property of *Cookies* & *CookiesCore* instances, use it for instance identification, default `COOKIES`

**Example:**

```js
import { Cookies } from 'meteor/ostrio:cookies';

const cookies = new Cookies({
  TTL: 31557600000 // One year TTL
});
```

---

#### `.get()`

*(Anywhere)* Read a cookie. Returns `undefined` if the cookie is not found

**Arguments:**

- `key` {*string*} – The name of the cookie.

```js
cookies.get('age'); // undefined if not found
cookies.set('age', 25); // returns true
cookies.get('age'); // returns 25
```

Cookies store text. After a page reload, and on the *Server*, a number comes back as a string (`'25'`). `true`, `false`, `null`, objects, and arrays keep their type.

---

#### `.set()`

*(Anywhere)* Create or update a cookie

**Arguments:**

- `key` {*string*} – The cookie name
- `value` {*string* | *number* | *boolean* | *null* | *object* | *array*} – The cookie value
- `opts` {*CookieOptions*} – Optional settings

**Supported CookieOptions:**

- `opts.expires` {*number* | *Date* | *Infinity*}: Cookie expiration as a `Date` or a timestamp in milliseconds. `0` creates a session cookie and overrides `TTL`
- `opts.maxAge` {*number*}: Maximum age in seconds
- `opts.path` {*string*}: Cookie path (default: `/`)
- `opts.domain` {*string*}: Cookie domain
- `opts.secure` {*boolean*}: Transmit only over HTTPS
- `opts.httpOnly` {*boolean*}: Inaccessible to client-side JavaScript
- `opts.sameSite` {*boolean* | *'None'* | *'Strict'* | *'Lax'*}: Cross-site cookie policy
- `opts.partitioned` {*boolean*}: Specifies `Partitioned` attribute in `Set-Cookie` header. When enabled, clients will only send the cookie back when the current domain *and* top-level domain matches
- `opts.priority` {*'Low' | 'Medium' | 'High'*}: Specifies the value for the `Priority` attribute in `Set-Cookie` header
- `opts.firstPartyOnly` {*boolean*}: *Deprecated* (use `sameSite` instead)

```js
cookies.set('age', 25, {
  path: '/',
  secure: true
});
```

---

#### `.remove()`

*(Anywhere)* Remove cookie(s)

- `remove()` – Removes all cookies on the current domain. Only a call without arguments does this; `remove('')` and `remove(null)` return `false`
- `remove(key)` – Removes the specified cookie
- `remove(key, path, domain)` – Removes a cookie with the given key, path, and domain

**Arguments:**

- `key` {*string*} - [Optional] The name of the cookie to remove
- `path` {*string*} - [Optional] The path from where the cookie was readable. E.g., "/", "/mydir"; if not specified, defaults to `/`. The path must be absolute (see RFC 2965). For more information on how to use relative paths in this argument, [read more](https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter)
- `domain` {*string*} - [Optional] The domain from where the cookie was readable. E.g., "example.com", ".example.com" (includes all subdomains) or "subdomain.example.com"; if not specified, defaults to the host portion of the current document location (string or null)

```js
const isRemoved = cookies.remove(key, path, domain); // boolean
const isRemoved = cookies.remove('age', '/'); // boolean
const isRemoved = cookies.remove(key, '/', 'example.com'); // boolean
```

---

#### `.has()`

*(Anywhere)* Check if a cookie exists

**Arguments:**

- `key` {*string*} – The name of the cookie

```js
const hasKey = cookies.has(key); // boolean
const hasKey = cookies.has('age'); // boolean
```

---

#### `.keys()`

*(Anywhere)* Returns an array of all cookie names

```js
const cookieKeys = cookies.keys(); // string[] (e.g., ['locale', 'country', 'gender'])
```

---

#### `.send()`

*(Client only)* Send all current cookies to the server via `fetch` and callback. The server runs `onCookies` hooks, and cookies set by hooks are available on the client when the callback runs. Requires `runOnServer: true` (default)

**Arguments:**

- `callback` {*function*} – Callback with signature `(error, response)`.

```js
cookies.send((error, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('Cookies synced:', response);
  }
});
```

---

#### `.sendAsync()`

*(Client only)* Same as `.send()`, returns a `Promise<Response>`. Rejects with `Meteor.Error` when `runOnServer` is `false`

```js
const response = await cookies.sendAsync();
console.log('Cookies synced:', response);
```

---

#### `.middleware()`

*(Server only)* Returns a middleware function to integrate cookies into your server’s request pipeline.
**Usage:** Register this middleware with your Meteor server (e.g., via `WebApp.connectHandlers.use`).

```js
import { WebApp } from 'meteor/webapp';
import { Cookies } from 'meteor/ostrio:cookies';

const cookies = new Cookies({
  auto: false,
  handler(cookiesInstance) {
    // Custom processing with cookiesInstance (of type CookiesCore)
  }
});

WebApp.connectHandlers.use(cookies.middleware());
```

---

#### `.destroy()`

*(Server only)* Unregisters hooks, callbacks, and middleware

```js
cookies.isDestroyed // false
cookies.destroy(); // true
cookies.isDestroyed // true
cookies.destroy(); // false — returns `false` as instance was already destroyed
```

---

### `new CookiesCore()` constructor

`CookiesCore` is low-level constructor that can be used to directly parse and manage cookies

**Arguments:**

- `opts` {*CookiesCoreOptions*} – Optional settings

**Supported CookiesCoreOptions:**

- `_cookies` {*string | CookieDict*} - Cookies string from `document.cookie`, `Set-Cookie` header, or `{ [key: string]: unknown }` Object
- `setCookie` {*boolean*} - Set to `true` when `_cookies` option derives from `Set-Cookie` header
- `response` {*ServerResponse*} - HTTP server response object
- `TTL` {*number | false*} - Default cookies expiration time (max-age) in milliseconds. If false, the cookie lasts for the session
- `runOnServer` {*boolean*} - Client only. If `true` — enables `send` and `sendAsync` from client
- `allowQueryStringCookies` {*boolean*} - If true, allow passing cookies via query string (used primarily in Cordova)
- `allowedCordovaOrigins` {*RegExp | boolean*} - A regular expression or boolean to allow cookies from specific origins
- `name` {*string*} - Sets `.NAME` property of *CookiesCore* instances, use it for instance identification, default `COOKIES_CORE`

> [!NOTE]
> `CookiesCore` instance has the same methods as `Cookies` class except `.destroy()` and `.middleware()`

```js
import { CookiesCore } from 'meteor/ostrio:cookies';

// Parse a Set-Cookie header
const cookies = new CookiesCore({
  _cookies: 'session=abc; Path=/; HttpOnly, theme=dark; Path=/',
  setCookie: true
});

cookies.get('theme'); // 'dark'
cookies.keys(); // ['session', 'theme']
```

> [!NOTE]
> An object passed as `_cookies` is kept in memory only. On the *Client* it isn't written to `document.cookie`, so `.send()` doesn't transfer it. Use `.set()` to store a cookie in the browser

Server usage without middleware: [docs/server.md](https://github.com/veliovgroup/Meteor-Cookies/blob/master/docs/server.md#cookiescore-without-middleware)

## Examples

Use `new Cookies()` on *Client* and *Server* separately or in the same file

### Example: Client Usage

```js
import { Cookies } from 'meteor/ostrio:cookies';
const cookies = new Cookies();

cookies.set('locale', 'en');
cookies.set('country', 'usa');
cookies.set('gender', 'male');

console.log(cookies.get('gender')); // "male"
console.log(cookies.has('locale')); // true
console.log(cookies.keys()); // ['locale', 'country', 'gender']

cookies.remove('locale');
console.log(cookies.get('locale')); // undefined
```

### Example: Server Usage

```js
import { Cookies } from 'meteor/ostrio:cookies';
import { WebApp } from 'meteor/webapp';

new Cookies();
WebApp.connectHandlers.use((req, res, next) => {
  const cookiesInstance = req.Cookies;

  cookiesInstance.set('locale', 'en');
  cookiesInstance.set('country', 'usa');
  cookiesInstance.set('gender', 'male');

  console.log(cookiesInstance.get('gender')); // "male"
  next();
});
```

### More examples

- [Multiple handlers across modules](https://github.com/veliovgroup/Meteor-Cookies/blob/master/docs/server.md#multiple-handlers-across-modules)
- [Set cookies based on URL](https://github.com/veliovgroup/Meteor-Cookies/blob/master/docs/server.md#set-cookies-based-on-url)
- [Manual middleware registration](https://github.com/veliovgroup/Meteor-Cookies/blob/master/docs/server.md#manual-middleware-registration)
- [Cordova and Meteor-Desktop](https://github.com/veliovgroup/Meteor-Cookies/blob/master/docs/cordova.md)

## Running Tests

1. Clone the package repository.
2. Open a terminal in the cloned directory.
3. Run tests using:

### Meteor/Tinytest

```shell
# Default, headless Tinytest runner
npm test

# Direct command
mtest --package ./ --port=8888 --once

# Coverage report (text, coverage/index.html, coverage/lcov.info)
npm run test:coverage

# Type definitions
npm run test:types

# Browser fallback
meteor test-packages ./ --once --driver-package test-in-console
```

On Apple Silicon, the Chromium bundled with `mtest` is x86-only. Point it to a local Chromium-based browser:

```shell
PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm test
```

## Security

Report vulnerabilities privately, see [SECURITY.md](https://github.com/veliovgroup/Meteor-Cookies/blob/master/SECURITY.md).

## Support our open source contributions

- Try [🌉 Bridge CDN](https://bridge-cdn.com/?ref=github-cookies-repo-footer) - A SEO-focused alternative to Cloudflare. CDN, DNS, IndexNow, Prerender, SEO, Edge Computing.
- Upload and share files using [☄️ meteor-files.com](https://meteor-files.com/?ref=github-cookies-repo-footer) — Continue interrupted file uploads without losing any progress. There is nothing that will stop Meteor from delivering your file to the desired destination
- Use [▲ ostr.io](https://ostr.io?ref=github-cookies-repo-footer) for [Server Monitoring](https://snmp-monitoring.com), [Web Analytics](https://ostr.io/info/web-analytics?ref=github-cookies-repo-footer), [WebSec](https://domain-protection.info), [Web-CRON](https://web-cron.info) and [SEO Pre-rendering](https://prerendering.com) of a website
- Star on [GitHub](https://github.com/veliovgroup/Meteor-Cookies)
- Star on [Atmosphere](https://atmospherejs.com/ostrio/cookies)
- [Sponsor via GitHub](https://github.com/sponsors/dr-dimitru)
- [Support via PayPal](https://paypal.me/veliovgroup)

[badge-meteor]: https://img.shields.io/badge/Meteor.js-ostrio%3Acookies-red?logo=meteor&logoColor=white
[meteor-url]: https://packosphere.com/ostrio/cookies
[badge-release]: https://img.shields.io/github/v/release/veliovgroup/Meteor-Cookies
[release-url]: https://github.com/veliovgroup/Meteor-Cookies/releases
[badge-ci]: https://github.com/veliovgroup/Meteor-Cookies/actions/workflows/test_suite.yml/badge.svg?branch=master
[ci-url]: https://github.com/veliovgroup/Meteor-Cookies/actions/workflows/test_suite.yml
[badge-cov]: https://img.shields.io/badge/coverage-~99%25-brightgreen
[badge-license]: https://img.shields.io/badge/License-BSD%203--Clause-blue.svg
[license-url]: https://github.com/veliovgroup/Meteor-Cookies/blob/master/LICENSE
[badge-ts]: https://img.shields.io/badge/TypeScript-ready-blue
[ts-url]: https://github.com/veliovgroup/Meteor-Cookies/blob/master/index.d.ts
[badge-deps]: https://img.shields.io/badge/dependencies-0-brightgreen
[badge-commit]: https://img.shields.io/github/last-commit/veliovgroup/Meteor-Cookies
[commits-url]: https://github.com/veliovgroup/Meteor-Cookies/commits/master
[badge-scorecard]: https://api.scorecard.dev/projects/github.com/veliovgroup/meteor-cookies/badge
[scorecard-url]: https://scorecard.dev/viewer/?uri=github.com/veliovgroup/meteor-cookies
[badge-sponsor]: https://img.shields.io/github/sponsors/dr-dimitru?label=Sponsor
[sponsor-url]: https://github.com/sponsors/dr-dimitru
[badge-donate]: https://img.shields.io/badge/Donate-PayPal-00457C?logo=paypal&logoColor=white
[donate-url]: https://paypal.me/veliovgroup
