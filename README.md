[![support](https://img.shields.io/badge/support-GitHub-white)](https://github.com/sponsors/dr-dimitru)
[![support](https://img.shields.io/badge/support-PayPal-white)](https://paypal.me/veliovgroup)
<a href="https://ostr.io/info/built-by-developers-for-developers?ref=github-cookies-repo-top"><img src="https://ostr.io/apple-touch-icon-60x60.png" alt="ostr.io" height="20"></a>
<a href="https://meteor-files.com/?ref=github-cookies-repo-top"><img src="https://meteor-files.com/apple-touch-icon-60x60.png" alt="meteor-files.com" height="20"></a>

# Cookies for Meteor

Isomorphic and bulletproof 🍪 cookie management for Meteor applications with support for *Client*, *Server*, *Browser*, *Cordova*, *Meteor-Desktop*, and other Meteor environments.

- 👨‍💻 Stable codebase
- 🚀 320.000+ downloads
- 👨‍🔬 **~96% test coverage**
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
- [Examples](#examples)
  - [Alternative Usage](#alternative-usage)
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

- **Cordova Compatible?** This recommendation applies only to outgoing cookies from *Client → Server*. Cookies set by the server work out-of-the-box on the client:
  - Enable [withCredentials](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials)
  - Set `{ allowQueryStringCookies: true }` and `{ allowedCordovaOrigins: true }` on both *Client* and *Server*
  - When enabled, cookies are transferred to the server via a query string (GET parameters)
  - For security, this is allowed only when the `Origin` header matches the regular expression `^http://localhost:12[0-9]{3}$` (Meteor/Cordova connects through `localhost:12XXX`)

- **Cookies Missing on Server?** In most cases, this is due to Meteor's HTTP callback-chain ordering. Ensure that `new Cookies()` is called **before** routes are registered:
  - *Tip:* Place the `ostrio:cookies` package above all community packages in your `.meteor/packages` file

- **Meteor-Desktop Compatibility:** `ostrio:cookies` can be used in [`meteor-desktop`](https://github.com/Meteor-Community-Packages/meteor-desktop) projects. Since Meteor-Desktop works similarly to Cordova, all Cordova recommendations from above apply

## API

> [!NOTE]
> On the server, cookies are set only after headers are sent (i.e. on the next route or page reload)
> To sync cookies from *Client* to *Server* without a page reload, use `sendAsync()` or `send()`

See [FAQ](#faq) for more tips

> [!IMPORTANT]
> **On the Server**, cookies are implemented as middleware that attaches a `Cookies` instance to the incoming request (accessible as `req.Cookies`). Ensure that the Cookies middleware is registered before other middleware and routes

### `new Cookies()` Constructor

Create a new instance of `Cookies` (available on both *Client* and *Server*).

**Arguments:**

- `opts` {*CookiesOptions*} - Config object

**Available CookiesOptions:**

- `opts.auto` {*boolean*} – [Server] Auto-bind as `req.Cookies` (default: `true`).
- `opts.handler` {*function*} – [Server] Custom middleware handler; receives the `Cookies` instance.
- `opts.onCookies` {*function*} – [Server] Callback triggered after `.send()` or `.sendAsync()` is called and the cookies are received by the server. *(Note: available only if `auto` is `true`.)*
- `opts.TTL` {*number* | *boolean*} – Default expiration time (max-age) in milliseconds. Set to `false` for session cookies.
- `opts.runOnServer` {*boolean*} – Set to `false` to disable server usage (default: `true`).
- `opts.allowQueryStringCookies` {*boolean*} – Allow passing cookies via query string (primarily for Cordova).
- `opts.allowedCordovaOrigins` {*RegExp* | *boolean*} – [Server] Allow setting cookies from specific origins (defaults to `^http:\/\/localhost:12[0-9]{3}$` if `true`).

**Example:**

```js
import { Cookies } from 'meteor/ostrio:cookies';

const cookies = new Cookies({
  TTL: 31557600000 // One year TTL
});
```

### `.get()`

*(Anywhere)* Read a cookie. Returns `undefined` if the cookie is not found

**Arguments:**

- `key` {*string*} – The name of the cookie.

```js
cookies.get('age'); // undefined if not found
cookies.set('age', 25); // returns true
cookies.get('age'); // returns 25
```

### `.set()`

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
- `opts.firstPartyOnly` {*boolean*}: *Deprecated* (use `sameSite` instead)

```js
cookies.set('age', 25, {
  path: '/',
  secure: true
});
```

### `.remove()`

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

### `.has()`

*(Anywhere)* Check if a cookie exists

**Arguments:**

- `key` {*string*} – The name of the cookie

```js
const hasKey = cookies.has(key); // boolean
const hasKey = cookies.has('age'); // boolean
```

### `.keys()`

*(Anywhere)* Returns an array of all cookie names

```js
const cookieKeys = cookies.keys(); // string[] (e.g., ['locale', 'country', 'gender'])
```

### `.send()`

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

### `.sendAsync()`

*(Client only)* Asynchronously send all current cookies to the server via XHR

```js
const response = await cookies.sendAsync();
console.log('Cookies synced:', response);
```

### `.middleware()`

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

## Examples

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
console.log(cookies.keys());        // ['locale', 'country', 'gender']

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

### Alternative Usage

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
