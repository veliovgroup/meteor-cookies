[![support](https://img.shields.io/badge/support-GitHub-white)](https://github.com/sponsors/dr-dimitru)
[![support](https://img.shields.io/badge/support-PayPal-white)](https://paypal.me/veliovgroup)
<a href="https://ostr.io/info/built-by-developers-for-developers?ref=github-cookies-repo-top"><img src="https://ostr.io/apple-touch-icon-60x60.png" alt="ostr.io" height="20"></a>
<a href="https://meteor-files.com/?ref=github-cookies-repo-top"><img src="https://meteor-files.com/apple-touch-icon-60x60.png" alt="meteor-files.com" height="20"></a>

# Cookies for Meteor

Isomorphic and bulletproof 🍪 cookie management for Meteor applications with support for *Client*, *Server*, *Browser*, *Cordova*, *Meteor-Desktop*, and other Meteor environments.

- 👨‍💻 Stable codebase
- 🚀 320.000+ downloads
- 👨‍🔬 **99.9% tests coverage** / TDD
- 📦 No external dependencies (no `underscore`, `jQuery`, or `Blaze`)
- 🖥 Consistent API across *Server* and *Client* environments
- 📱 Compatible with *Cordova*, *Browser*, *Meteor-Desktop*, and other client platforms
- ㊗️ Full Unicode support for cookie values
- 👨‍💻 Supports `String`, `Array`, `Object`, and `Boolean` as cookie value types
- ♿ IE support, thanks to [@derwok](https://github.com/derwok)
- 📦 Shipped with TypeScript [types](https://github.com/veliovgroup/meteor-cookies/blob/master/index.d.ts)
- 📦 Looking for persistent *Client* (Browser) storage? Try the [`ClientStorage` package](https://github.com/veliovgroup/Client-Storage#persistent-client-browser-storage).

## ToC:

- [Installation](#installation)
- [Import](#es6-import)
- [FAQ](#faq)
- [API](#api)
  - [`new Cookies()` constructor](#new-cookies-constructor) – Create a new `Cookies` instance
  - [`.get()`](#get) – Read a cookie
  - [`.set()`](#set) – Set a cookie
  - [`.remove()`](#remove) – Remove one or all cookies
  - [`.keys()`](#keys) – List all cookie keys
  - [`.send()`](#send) – Sync cookies with the server
  - [`.sendAsync()`](#sendasync) – Sync cookies asynchronously
  - [`.middleware()`](#middleware) – Register cookie middleware manually
  - [`new CookieCore()` constructor](#new-cookiescore-constructor) – Low-level class that can be used to directly parse and manage cookies
- [Examples](#examples)
  - [Client Usage](#example-client-usage)
  - [Server Usage](#example-server-usage)
  - [Server with multiple cookie handlers](#example-server-with-multiple-cookie-handlers)
  - [Set and read cookies based on URL](#example-set-and-read-cookies-based-on-url)
  - [Alternative Usage](#example-alternative-usage)
- [Running Tests](#running-tests)
- [Support Our Open Source Contributions](#support-our-open-source-contributions)

## Installation

```shell
meteor add ostrio:cookies
```

## ES6 Import

```js
import { Cookies } from 'meteor/ostrio:cookies';
```

## FAQ

- **Cordova Usage**: This recommendation applies only to outgoing cookies from *Client → Server*. Cookies set by the server work out-of-the-box on the client:
  - Enable [withCredentials](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials)
  - Set `{ allowQueryStringCookies: true }` and `{ allowedCordovaOrigins: true }` on both *Client* and *Server*
  - When `allowQueryStringCookies` is enabled, cookies are transferred to the server via a query string (GET parameters)
  - For security, this is allowed only when the `Origin` header matches the regular expression `^http://localhost:12[0-9]{3}$` (Meteor/Cordova connects through `localhost:12XXX`)
- **Cookies Missing on Server?** In most cases, this is due to Meteor's HTTP callback-chain ordering. Ensure that `new Cookies()` is called **before** routes are registered:
- **Meteor-Desktop Compatibility:** `ostrio:cookies` can be used in [`meteor-desktop`](https://github.com/Meteor-Community-Packages/meteor-desktop) projects. Since Meteor-Desktop works similarly to Cordova, all Cordova recommendations from above apply

## API

> [!NOTE]
> On the server, cookies are set only after headers are sent (i.e. on the next route or page reload)
>
> To sync cookies from *Client* to *Server* without a page reload, use `sendAsync()` or `send()`


> [!TIP]
> **On the Server**: cookies are implemented as middleware that attaches a `CookiesCore` instance to the incoming request (accessible as `req.Cookies`). Ensure that the Cookies middleware is registered before other middleware and routes
>
> **In `.meteor/packages`**: Place the `ostrio:cookies` package above all community packages, order of packages does matter in this file

See [FAQ](#faq) for more tips

> [!IMPORTANT]
> **On the Server**: it's possible to create many `new Cookies()` instances with `handler` callbacks and `onCookies` hooks, then later each instance can get destroyed calling `.destroy()` method.
>
> **Note:** Only one middleware will be registered and passed into `WebApp.connectHandlers.use()` at the time! All consequent `handler` and `onCookies` callbacks and hooks will be added to shared Map and called as expected within the first registered middleware. Invoking `.middleware()` method manually will result in warning and will return "blank" middleware handler which will instantly call `NextFunc()`

### `new Cookies()` Constructor

Create a new instance of `Cookies` (available on both *Client* and *Server*).

**Arguments:**

- `opts` {*CookiesOptions*} - Config object

**Available CookiesOptions:**

- `opts.auto` {*boolean*} – [Server] Auto-bind as `req.Cookies` (default: `true`)
- `opts.handler` {*function*} – [Server] Custom middleware handler; receives the `Cookies` instance
- `opts.onCookies` {*function*} – [Server] Callback triggered after `.send()` or `.sendAsync()` is called and the cookies are received by the server. *(Note: available only if `auto` is `true`.)*
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

---

#### `.set()`

*(Anywhere)* Create or update a cookie

**Arguments:**

- `key` {*string*} – The cookie name
- `value` {*string* | *number* | *boolean* | *object* | *array*} – The cookie value
- `opts` {*CookieOptions*} – Optional settings

**Supported CookieOptions:**

- `opts.expires` {*number* | *Date* | *Infinity*}: Cookie expiration
- `opts.maxAge` {*number*}: Maximum age in seconds
- `opts.path` {*string*}: Cookie path (default: current path)
- `opts.domain` {*string*}: Cookie domain
- `opts.secure` {*boolean*}: Transmit only over HTTPS
- `opts.httpOnly` {*boolean*}: Inaccessible to client-side JavaScript
- `opts.sameSite` {*boolean* | *'None'* | *'Strict'* | *'Lax'*}: Cross-site cookie policy
- `opts.partitioned` {*boolean*}: Specifies `Partitioned` attribute in `Set-Cookie` header. When enabled, clients will only send the cookie back when the current domain *and* top-level domain matches
- `opts.priority` {*'Low' | 'Medium' | 'High'*}: Specifies the value for the `Priority` attribute in `Set-Cookie`` header
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

- `remove()` – Removes all cookies on the current domain
- `remove(key)` – Removes the specified cookie
- `remove(key, path, domain)` – Removes a cookie with the given key, path, and domain

**Arguments:**

- `key` {*string*} - The name of the cookie to create/overwrite
- `path` {*string*} - [Optional] The path from where the cookie was readable. E.g., "/", "/mydir"; if not specified, defaults to the current path of the current document location (string or null). The path must be absolute (see RFC 2965). For more information on how to use relative paths in this argument, [read more](https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter)
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

*(Client only)* Synchronously send all current cookies to the server via XHR

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

*(Client only)* Asynchronously send all current cookies to the server via XHR

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
    // Custom processing with cookiesInstance (of type Cookies)
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
- `setCookie` {*boolean*} - Set to `true` when `_cookies` option derivative of `Set-Cookie` header
- `response` {*ServerResponse*} - HTTP server response object
- `TTL` {*number | false*} - Default cookies expiration time (max-age) in milliseconds. If false, the cookie lasts for the session
- `runOnServer` {*boolean*} - Client only. If `true` — enables `send` and `sendAsync` from client
- `allowQueryStringCookies` {*boolean*} - If true, allow passing cookies via query string (used primarily in Cordova)
- `allowedCordovaOrigins` {*RegExp | boolean*} - A regular expression or boolean to allow cookies from specific origins
- `opts.name` {*string*} - Sets `.NAME` property of *CookiesCore* instances, use it for instance identification, default `COOKIES_CORE`

> [!NOTE]
> `CookiesCore` instance has the same methods as `Cookies` class except `.destroy()` and `.middleware()`

```js
import { CookiesCore } from 'meteor/ostrio:cookies';

if (Meteor.isServer) {
  // EXAMPLE SERVER USAGE
  WebApp.connectHandlers.use((request, response, next) => {
    const headerCookies = response.headers.get('set-cookie');
    const cookies = new CookiesCore({
      _cookies: headerCookies,
      setCookie: true, // <- Switch cookie-parser to header mode
      response: response,
    });

    // FOR EXAMPLE: CHECK SESSION EXPIRATION
    if (cookies.has('session-exp')) {
      if (cookies.get('session-exp') < Date.now()) {
        // .remove() WILL ADD `Set-Cookie` HEADER WITH expires=0 OPTION
        cookies.remove('session-id');
        cookies.remove('session-exp');
      }
    } else {
      // MARK USER AS NEW
      cookies.set('session-type', 'new-user');
    }
  });
}

if (Meteor.isClient) {
  const cookies = new CookiesCore({
    // {runOnServer: true} Enables syncing cookies between client and server
    // Requires `new Cookies({auto: true})` on server
    runOnServer: true,
    _cookies: { // <- Set default cookies
      key: 'name',
      theme: 'dark',
      isNew: true,
      'agreed-with-gdpr': false,
    }
  });

  // SET OR CHANGE COOKIES IN RUNTIME
  cookies.set('ab-test', 42);
  cookies.set('isNew', false);
  cookies.set('agreed-with-gdpr', true);

  // SYNC COOKIES
  await cookies.sendAsync();
}
```

## Examples

Use `new Cookies()` on *Client* and *Server* separately or in the same file

### Example: Client Usage

```js
import { Meteor } from 'meteor/meteor';
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
import { Meteor } from 'meteor/meteor';
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

### Example: Server with multiple cookie handlers

Sometimes it is required to build temporary or separate logic based on Client's cookies. And to split logic between different modules and files

```js
import { Meteor } from 'meteor/meteor';
import { Cookies } from 'meteor/ostrio:cookies';

// register default middleware that will handle requests and req.Cookies extension
const globalCookies = new Cookies();

// In checkout module/file
WebApp.connectHandlers.use((req, res, next) => {
  if (req.Cookies.has('checkout-session')) {
    const sessionId = req.Cookies.get('checkout-session');
    // CHECK IF CHECKOUT SESSION IS VALID
    if (isCheoutSessionValid(sessionId)) {
      // FORCE-REDIRECT USER TO CHECKOUT IF SESSION IS VALID
      res.statusCode = 302;
      res.setHeader('Location', `https://example.com?chsessid=${sessionId}`);
      res.end();
      return;
    }

    // REMOVE CHECKOUT COOKIE IF NOT VALID OR EXPIRED
    req.Cookies.remove('checkout-session');
  }

  next();
});

// In session module/file
const sessionCookies = new Cookies({
  auto: false,
  async handler(cookies) {
    // FOR EXAMPLE: CHECK SESSION EXPIRATION
    if (cookies.has('session-exp')) {
      if (cookies.get('session-exp') < Date.now()) {
        // .remove() WILL ADD `Set-Cookie` HEADER WITH expires=0 OPTION
        cookies.remove('session-id');
        cookies.remove('session-exp');
      }
    } else {
      // MARK USER AS NEW
      cookies.set('session-type', 'new-user');
    }
  }
});
// unregister handler when it isn't needed
sessionCookies.destroy();
```

### Example: Set and read cookies based on URL

Often cookies logic depends from URL it was called from. Access request details on `handler` callback using `cookies.response.req.url` {*IncomingMessage*} object:

```js
import { Cookies } from 'meteor/ostrio:cookies';

new Cookies({
  auto: false,
  async handler(cookies) {
    const url = new URL(cookies.response.req.url);
    switch (url.pathname) {
      case '/signup/create':
        // GET USER'S SELECTED PLAN ON SIGNUP
        const plan = url.searchParams.get('plan') || 'default-plan';
        cookies.set('selected-tariff', plan);
        break;
      case '/shopping-cart/new':
        // CREATE NEW CHECKOUT SESSION ID
        cookies.set('checkout-session', Random.id());
        break;
    }
  }
});
```

### Example: Alternative Usage

```js
import { Meteor } from 'meteor/meteor';
import { Cookies } from 'meteor/ostrio:cookies';

if (Meteor.isClient) {
  const cookies = new Cookies();
  cookies.set('gender', 'male');
  console.log(cookies.get('gender')); // "male"
  console.log(cookies.keys()); // ['gender']
}

if (Meteor.isServer) {
  const { WebApp } = require('meteor/webapp');
  const cookiesInstance = new Cookies({
    auto: false, // Disable auto-binding (optional)
    handler(cookies) {
      console.log(cookies.get('gender')); // "male"
    }
  });
  WebApp.connectHandlers.use(cookiesInstance.middleware());
}
```

## Running Tests

1. Clone the package repository.
2. Open a terminal in the cloned directory.
3. Run tests using:

### Meteor/Tinytest

```shell
# Default
meteor test-packages ./

# With a custom port
meteor test-packages ./ --port 8888
```

## Support Our Open Source Contributions

- Upload and share files using [☄️ meteor-files.com](https://meteor-files.com/?ref=github-cookies-repo-footer) — Continue interrupted file uploads without losing any progress. There is nothing that will stop Meteor from delivering your file to the desired destination
- Use [▲ ostr.io](https://ostr.io?ref=github-cookies-repo-footer) for [Server Monitoring](https://snmp-monitoring.com), [Web Analytics](https://ostr.io/info/web-analytics?ref=github-cookies-repo-footer), [WebSec](https://domain-protection.info), [Web-CRON](https://web-cron.info) and [SEO Pre-rendering](https://prerendering.com) of a website
- Star on [GitHub](https://github.com/veliovgroup/Meteor-Cookies)
- Star on [Atmosphere](https://atmospherejs.com/ostrio/cookies)
- [Sponsor via GitHub](https://github.com/sponsors/dr-dimitru)
- [Support via PayPal](https://paypal.me/veliovgroup)
