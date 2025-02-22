[![support](https://img.shields.io/badge/support-GitHub-white)](https://github.com/sponsors/dr-dimitru)
[![support](https://img.shields.io/badge/support-PayPal-white)](https://paypal.me/veliovgroup)
<a href="https://ostr.io/info/built-by-developers-for-developers?ref=github-cookies-repo-top"><img src="https://ostr.io/apple-touch-icon-60x60.png" alt="ostr.io" height="20"></a>
<a href="https://meteor-files.com/?ref=github-cookies-repo-top"><img src="https://meteor-files.com/apple-touch-icon-60x60.png" alt="meteor-files.com" height="20"></a>

# Isomorphic Cookies for Meteor.js

Isomorphic and bulletproof 🍪 cookies for `meteor.js` applications with support of *Client*, *Server*, *Browser*, *Cordova*, *Meteor-Desktop*, and other *Meteor*-supported environments.

- 👨‍💻 Stable codebase, 320.000+ downloads;
- 👨‍🔬 __~96% Tests coverage__;
- 📦 No external dependencies, no `underscore`, no `jQuery`, no `Blaze`;
- 🖥 Full support with same API across *Server* and *Client* environments;
- 📱 Compatible with *Cordova*, *Browser*, *Meteor-Desktop*, and other Meteor's *Client* environments;
- ㊗️ Unicode support as cookies' value;
- 👨‍💻 `String`, `Array`, `Object`, and `Boolean` are supported cookies' value types;
- ♿ IE support, thanks to [@derwok](https://github.com/derwok);
- 📦 Shipped with [types](https://github.com/veliovgroup/meteor-cookies/blob/master/index.d.ts);
- 📦 Looking for *Client*'s (Browser) persistent storage? Try [`ClientStorage` package](https://github.com/veliovgroup/Client-Storage#persistent-client-browser-storage).

## ToC:

- [Installation](#install)
- [Import](#es6-import)
- [FAQ](#faq)
- [API](#api)
  - [`new Cookies` constructor](#new-cookies) - Create new `Cookies` instance
  - [`.get()`](#get) - Read cookie
  - [`.set()`](#set) - Set cookie
  - [`.remove()`](#remove) - Remove all cookies or single by key
  - [`.keys()`](#keys) - List all cookie keys
  - [`.send()`](#send) - Sync cookies with server
  - [`.sendAsync()`](#sendasync) - Sync cookies with server
  - [`.middleware()`](#middleware) - Handle to manually register Cookie's middleware
- [Examples](#examples)
  - [Alternative Usage](#alternative-usage)
- [Tests](#running-tests)
- [Support This Package](#support-our-open-source-contributions)

## Install:

```shell
meteor add ostrio:cookies
```

## ES6 Import:

```js
import { Cookies } from 'meteor/ostrio:cookies';
```

## FAQ:

- __Cordova compatible? Cordova usage__ — __This recommendation is only for outgoing `Client -to-> Server` Cookies; `Server -to-> Client` cookies work out-of-the-box__. Enable [withCredentials](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials). Enable `{allowQueryStringCookies: true}` and `{allowedCordovaOrigins: true}` on both `Client` and `Server`. When those two options are set to `true` Cookies going to be transferred to server via [get-query](https://en.wikipedia.org/wiki/Query_string). As security measure only when `Origin` header matches `^http://localhost:12[0-9]{3}$` expression. Meteor/Cordova connect through `localhost:12XXX`, local server, for outgoing requests, this also instructs the server to respond with the requested cookies (sent as GET-Parameters) in the response as `Set-Cookie` header. The reason for this *workaround* is the general lack of cookie support in Meteor/Cordova when setting in the client — but cookies set by the server are always sent along with every request;
- __Cookies are missing on Server__ — In 99% cases it's caused by Meteor's `webapp` http server callback-chain disorder. Make sure `new Cookies()` is called before *Routes* are registered. Routing packages usually take care of `*` (e.g. catch-all or 404) route, not passing request further to callback-chain. And as freshly installed package it would be placed at the end of `.meteor/packages` file, __where list-order matters__. We recommend to place `ostrio:cookies` package above all community packages in `.meteor/packages` list;
- __Meteor-Desktop compatibility__: meteor-cookies can be used in [meteor-desktop](https://github.com/Meteor-Community-Packages/meteor-desktop) projects as well. As meteor-desktop works exactly like Cordova, all Cordova requirements and recommendations apply.

## API:

- __Note__ — On a server, cookies will be set __only__ after headers are sent (on next route or page reload). To send cookies from *Client* to *Server* without a page reload use `sendAsync()` or `send()` method.
- __Server Usage Note__ — On a server Cookies implemented as a middleware that extends `IncomingMessage` with `Cookies` instance. To get access to current cookies use `req.Cookies` instance in any consequent middlewares. That's why it's important to register `Cookies` middleware before other middlewares and routes. For more - see examples section below.

### `new Cookies()`

__Anywhere__. Fetch cookies by creating new instance of `Cookies`. To make sure cookies available on *Server* and *Client* `new Cookies` should be initialized and imported in both environments.

- `opts.auto` {*boolean*} - [*Server*] Auto-bind in middleware as `req.Cookies`, by default `true`
- `opts.handler` {*function*} - [*Server*] Middleware function (e.g. hook/callback called within middleware pipeline) with single argument `cookies` as `Cookies` instance. See "Alternative Usage" section
- `opts.onCookies` {*function*} - [*Server*] Callback/hook triggered after `.send()` or `.sendAsync()` method called on *Client* and received by *Server*, called with single argument `cookies` as `Cookies` instance. __Note:__ this hook available only if `auto` option is `true`
- `opts.TTL` {*number*|*boolean*} - Default cookies expiration time (max-age) in milliseconds, by default - `false` (*session, no TTL*)
- `opts.runOnServer` {*boolean*} - Set to `false` to avoid server usage (by default - `true`)
- `opts.allowQueryStringCookies` {*boolean*} - Allow passing Cookies in a query string (in URL). Primary should be used only in *Cordova* environment. Note: this option will be used only on Cordova
- `opts.allowedCordovaOrigins` {*Regex|boolean*} - [*Server*] Allow setting Cookies from that specific origin which in Meteor/Cordova is localhost:12XXX. Set to default `^http:\/\/localhost:12[0-9]{3}$` if set to `true`. Default: `false`

```js
import { Cookies } from 'meteor/ostrio:cookies';

const cookies = new Cookies();
const cookies = new Cookies({
  TTL: 31557600000 // set all cookies TTL to one year
});
```

### get

__Anywhere__. Read a cookie. If the cookie doesn't exist a `null` will be returned.

- `key` {*String*} - The name of the cookie to read

```js
const cookieValue = cookies.get(key);
const cookieValue = cookies.get('age'); // null
cookies.set('age', 25); // true
const cookieValue = cookies.get('age'); // 25
```

### set

__Anywhere__. Create/overwrite a cookie.

- `key` {*String*} - The name of the cookie to create/overwrite
- `value` {*String*|*Number*|*Boolean*|*Object*|*Array*} - The value of the cookie
- `opts` {*Object*} - [Optional]
- `opts.expires` {*Number*|*Date*|*Infinity*} - [Optional] Date, Number as milliseconds or Infinity for a never-expires cookie. If not specified the cookie will expire at the end of session (number as milliseconds or Date object)
- `opts.maxAge` {*Number*} - [Optional] The max-age in seconds (e.g. `31536e3` for a year)
- `opts.path` {*String*} - [Optional] The path from where the cookie will be readable. E.g., "/", "/mydir"; if not specified, defaults to the current path of the current document location (string or null). The path must be absolute (see RFC 2965). For more information on how to use relative paths in this argument, see: [docs](https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter)
- `opts.domain` {*String*} - [Optional] The domain from where the cookie will be readable. E.g., "example.com", ".example.com" (includes all subdomains) or "subdomain.example.com"; if not specified, defaults to the host portion of the current document location (string or null)
- `opts.secure` {*Boolean*} - [Optional] The cookie will be transmitted only over secure protocol as `https`
- `opts.httpOnly` {*Boolean*} - [Optional] An HttpOnly cookie cannot be accessed by client-side APIs, such as JavaScript. This restriction eliminates the threat of cookie theft via cross-site scripting (XSS)
- `opts.sameSite` {*Boolean*} {*String*: *None*, *Strict*, or *Lax*} - [Optional] Cross-site cookies usage policy. Read more on [wikipedia](https://en.wikipedia.org/wiki/HTTP_cookie#SameSite_cookie), [web.dev](https://web.dev/samesite-cookies-explained/), and [ietf](https://tools.ietf.org/html/draft-west-first-party-cookies-05). Default: `false`
- `opts.firstPartyOnly` {*Boolean*} - [Optional] *Deprecated use `sameSite` instead*

```js
const isSet = cookies.set(key, value, opts); // boolean
const isSet = cookies.set('age', 25, {
  path: '/',
  secure: true,
});
```

### remove

__Anywhere__. Remove cookie on current location path and/or other domain

- `remove()` - Remove all cookies on current domain
- `remove(key)` - Remove a cookie on current domain
- `remove(key, path, domain)`:
  - `key` {*string*} - The name of the cookie to create/overwrite
  - `path` {*string*} - [Optional] The path from where the cookie was readable. E.g., "/", "/mydir"; if not specified, defaults to the current path of the current document location (string or null). The path must be absolute (see RFC 2965). For more information on how to use relative paths in this argument, [read more](https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter)
  - `domain` {*string*} - [Optional] The domain from where the cookie was readable. E.g., "example.com", ".example.com" (includes all subdomains) or "subdomain.example.com"; if not specified, defaults to the host portion of the current document location (string or null)

```js
const isRemoved = cookies.remove(key, path, domain); // boolean
const isRemoved = cookies.remove('age', '/'); // boolean
const isRemoved = cookies.remove(key, '/', 'example.com'); // boolean
```

### has

__Anywhere__. Check whether a cookie exists in the current position, returns boolean value

- `key` {*string*} - The name of the cookie to check

```js
const hasKey = cookies.has(key); // boolean
const hasKey = cookies.has('age'); // boolean
```

### keys

__Anywhere__. Returns an array of all readable cookies from this location

```js
const arrayOfKeys = cookies.keys(); // string[]
```

### send

__Client__. Sync all current cookies with server.

- `callback` {*function*} - Callback function

```js
cookies.send((error, response) => {});
```

### sendAsync

__Client__. Sync all current cookies with server.

```js
const response = await cookies.sendAsync();
```

### middleware

__Server__. Manually register middleware that will call `handler` callback.

```js
import { WebApp } from 'meteor/webapp';
import { Cookies } from 'meteor/ostrio:cookies';

const c = new Cookies({
  auto: false,
  handler(cookies) {
    // ... see "examples" section below
  }
});
WebApp.connectHandlers.use(c.middleware());
```

## Examples:

```js
/* Both Client & Server */
import { Meteor } from 'meteor/meteor';
import { Cookies } from 'meteor/ostrio:cookies';
const cookies = new Cookies();

/* Client */
if (Meteor.isClient) {
  cookies.set('locale', 'en'); //true
  cookies.set('country', 'usa'); //true
  cookies.set('gender', 'male'); //true

  cookies.get('gender'); //male

  cookies.has('locale'); //true
  cookies.has('city'); //false

  cookies.keys(); //['locale', 'country', 'gender']

  cookies.remove('locale'); //true
  cookies.get('locale'); //undefined

  cookies.keys(); //['country', 'gender']

  cookies.remove(); //true
  cookies.keys(); //[""]

  cookies.remove(); //false
}

/* Server */
if (Meteor.isServer) {
  const { WebApp } = require('meteor/webapp');

  // Custom or any other registered middleware
  // will have `req.Cookies` after `new Cookies()` was called on server
  WebApp.connectHandlers.use((req, res, next) => {
    cookies = req.Cookies;

    cookies.set('locale', 'en'); //true
    cookies.set('country', 'usa'); //true
    cookies.set('gender', 'male'); //true

    cookies.get('gender'); //male

    cookies.has('locale'); //true
    cookies.has('city'); //false

    cookies.keys(); //['locale', 'country', 'gender']

    cookies.remove('locale'); //true
    cookies.get('locale'); //undefined

    cookies.keys(); //['country', 'gender']

    cookies.remove(); //true
    cookies.keys(); //[""]

    cookies.remove(); //false

    next(); // Pass request to the next handler
  });
}
```

### Alternative Usage

```js
/* Both Client & Server */
import { Meteor } from 'meteor/meteor';
import { Cookies } from 'meteor/ostrio:cookies';

/* Client */
if (Meteor.isClient) {
  const cookies = new Cookies();
  cookies.set('gender', 'male'); //true
  cookies.get('gender'); //male
  cookies.has('city'); //false
  cookies.keys(); //['gender']
}

/* Server */
if (Meteor.isServer) {
  const { WebApp } = require('meteor/webapp');

  const c = new Cookies({
    auto: false, // Do not bind as a middleware by default (recommended, but not required)
    handler(cookies) {
      cookies.get('gender'); //male
      cookies.has('city'); //false
      cookies.keys(); //['gender']
    }
  });

  WebApp.connectHandlers.use(c.middleware());
}
```

## Running Tests

1. Clone this package
2. In Terminal (*Console*) go to directory where package is cloned
3. Then run:

### Meteor/Tinytest

```shell
# Default
meteor test-packages ./

# With custom port
meteor test-packages ./ --port 8888
```

## Support our open source contributions

- Upload and share files using [☄️ meteor-files.com](https://meteor-files.com/?ref=github-cookies-repo-footer) — Continue interrupted file uploads without losing any progress. There is nothing that will stop Meteor from delivering your file to the desired destination
- Use [▲ ostr.io](https://ostr.io?ref=github-cookies-repo-footer) for [Server Monitoring](https://snmp-monitoring.com), [Web Analytics](https://ostr.io/info/web-analytics?ref=github-cookies-repo-footer), [WebSec](https://domain-protection.info), [Web-CRON](https://web-cron.info) and [SEO Pre-rendering](https://prerendering.com) of a website
- Star on [GitHub](https://github.com/veliovgroup/Meteor-Cookies)
- Star on [Atmosphere](https://atmospherejs.com/ostrio/cookies)
- [Sponsor via GitHub](https://github.com/sponsors/dr-dimitru)
- [Support via PayPal](https://paypal.me/veliovgroup)
