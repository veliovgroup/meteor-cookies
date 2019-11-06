# Isomorphic Cookies

<a href="https://www.patreon.com/bePatron?u=20396046">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

Isomorphic and bulletproof 🍪 cookies for `meteor.js` applications with support of *Client*, *Server*, *Browser*, *Cordova*, and other *Meteor*-supported environments.

- 👨‍🔬 __~96% Tests coverage__;
- 📦 No external dependencies, no `underscore`, no `jQuery`, no `Blaze`;
- 🖥 Full support with same API on both *Server* and *Client* environments;
- 📱 Support for *Cordova*, *Browser* and other Meteor's *Client* environments;
- ㊗️ With Unicode support for cookies' value;
- 👨‍💻 With `String`, `Array`, `Object`, and `Boolean` support as cookies' value;
- ♿ IE support, thanks to [@derwok](https://github.com/derwok);
- 📦 Looking for *Client*'s (Browser) persistent storage? Try [`ClientStorage` package](https://github.com/VeliovGroup/Client-Storage#persistent-client-browser-storage).

## Install:

```shell
meteor add ostrio:cookies
```

## ES6 Import:

```js
import { Cookies } from 'meteor/ostrio:cookies';
```

## FAQ:

- __Cordova compatible? Cordova usage__ — __This recommendation only for outgoing `Client -to-> Server` Cookies; `Server -to-> Client` cookies work out-of-the-box__. Enable [withCredentials](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials). Enable `{allowQueryStringCookies: true}` and `{allowedCordovaOrigins: true}` on both `Client` and `Server`. When those two options are set to `true` Cookies going to be transfered to server via [get-query](https://en.wikipedia.org/wiki/Query_string). As security measure only when `Origin` header matches `^https?:\/\/localhost:12[0-9]{0,3}$` expression. Meteor/Cordova connect through `localhost:12XXX`, local server, for outgoing requests, this also instructs the server to respond with the requested cookies (sent as GET-Parameters) in the response as `Set-Cookie` header. The reason for this *workaround* is the general lack of cookie support in Meteor/Cordova when setting in the client — but cookies set by the server are always sent along with every request;
- __Cookies are missing on Server__ — In 99% cases it's caused by Meteor's `webapp` http server callback-chain disorder. Make sure `new Cookies()` is called before *Routes* are registered. Routing packages usually take care of `*` (e.g. catch-all or 404) route, not passing request further to callback-chain. And as freshly installed package it would be placed at the end of `.meteor/packages` file, where list-order matters. We recommend to place `ostrio:cookies` package above all community packages in `.meteor/packages` list.

## API:

- __Note__ — On a server, cookies will be set __only__ after headers are sent (on next route or page reload). To send cookies from *Client* to *Server* without a page reload use `send()` method.
- __Server Usage Note__ — On a server Cookies implemented as a middleware. To get access to current user's cookies use `req.Cookies` instance. For more - see examples section below.

### Fetch cookies `new Cookies(opts)` [*Isomorphic*]

Create new instance of Cookies

- `opts.auto` {*Boolean*} - [*Server*] Auto-bind in middleware as `req.Cookies`, by default `true`
- `opts.handler` {*Function*} - [*Server*] Middleware function (e.g. hook/callback called within middleware pipeline) with single argument `cookies` as `Cookies` instance. See "Alternate Usage" section
- `opts.onCookies` {*Function*} - [*Server*] Callback/hook triggered after `.send()` method called on *Client* and received by *Server*, called with single argument `cookies` as `Cookies` instance. __Note:__ this hook available only if `auto` option is `true`
- `opts.TTL` {*Number*|*Boolean*} - Default cookies expiration time (max-age) in milliseconds, by default - `false` (*session, no TTL*)
- `opts.runOnServer` {*Boolean*} - Set to `false` to avoid server usage (by default - `true`)
- `opts.allowQueryStringCookies` {*Boolean*} - Allow passing Cookies in a query string (in URL). Primary should be used only in *Cordova* environment. Note: this option will be used only on Cordova
- `opts.allowedCordovaOrigins` {*Regex|Boolean*} - [*Server*] Allow setting Cookies from that specific origin which in Meteor/Cordova is localhost:12XXX. Set to default `^https?:\/\/localhost:12[0-9]{0,3}$` if set to `true`. Default: `false`

```js
import { Cookies } from 'meteor/ostrio:cookies';
const cookies = new Cookies();
```

### `cookies.get(key)` [*Isomorphic*]

Read a cookie. If the cookie doesn't exist a `null` will be returned.

- `key` {*String*} - The name of the cookie to read

### `cookies.set(key, value, [opts])` [*Isomorphic*]

Create/overwrite a cookie.

- `key` {*String*} - The name of the cookie to create/overwrite
- `value` {*String*|*Number*|*Boolean*|*Object*|*Array*} - The value of the cookie
- `opts` {*Object*} - [Optional]
- `opts.expires` {*Number*|*Date*|*Infinity*} - [Optional] Date, Number as milliseconds or Infinity for a never-expires cookie. If not specified the cookie will expire at the end of session (number as milliseconds or Date object)
- `opts.maxAge` {*Number*} - [Optional] The max-age in seconds (e.g. `31536e3` for a year)
- `opts.path` {*String*} - [Optional] The path from where the cookie will be readable. E.g., "/", "/mydir"; if not specified, defaults to the current path of the current document location (string or null). The path must be absolute (see RFC 2965). For more information on how to use relative paths in this argument, see: [docs](https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter)
- `opts.domain` {*String*} - [Optional] The domain from where the cookie will be readable. E.g., "example.com", ".example.com" (includes all subdomains) or "subdomain.example.com"; if not specified, defaults to the host portion of the current document location (string or null)
- `opts.secure` {*Boolean*} - [Optional] The cookie will be transmitted only over secure protocol as `https`
- `opts.httpOnly` {*Boolean*} - [Optional] An HttpOnly cookie cannot be accessed by client-side APIs, such as JavaScript. This restriction eliminates the threat of cookie theft via cross-site scripting (XSS)
- `opts.sameSite` {*Boolean*} - [Optional] Cookie which can only be sent in requests originating from the same origin as the target domain. Read more on [wikipedia](https://en.wikipedia.org/wiki/HTTP_cookie#SameSite_cookie) and [ietf](https://tools.ietf.org/html/draft-west-first-party-cookies-05)
- `opts.firstPartyOnly` {*Boolean*} - [Optional] *Deprecated use `sameSite` instead*

### `cookies.remove([key], [path], [domain])` [*Isomorphic*]

- `remove()` - Remove all cookies on current domain
- `remove(key)` - Remove a cookie on current domain
- `remove(key, path, domain)`:
  - `key` {*String*} - The name of the cookie to create/overwrite
  - `path` {*String*} - [Optional] The path from where the cookie was readable. E.g., "/", "/mydir"; if not specified, defaults to the current path of the current document location (string or null). The path must be absolute (see RFC 2965). For more information on how to use relative paths in this argument, [read more](https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter)
  - `domain` {*String*} - [Optional] The domain from where the cookie was readable. E.g., "example.com", ".example.com" (includes all subdomains) or "subdomain.example.com"; if not specified, defaults to the host portion of the current document location (string or null)

### `cookies.has(key)` [*Isomorphic*]

Check whether a cookie exists in the current position, returns boolean value

- `key` {*String*} - The name of the cookie to check

### `cookies.keys()` [*Isomorphic*]

Returns an array of all readable cookies from this location

### `cookies.send([callback])` [*Client*]

Send all current cookies to server.

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

### Alternate Usage

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

  const cookie = new Cookies({
    auto: false, // Do not bind as a middleware by default (recommended, but not required)
    handler(cookies) {
      cookies.set('gender', 'male'); //true
      cookies.get('gender'); //male
      cookies.has('city'); //false
      cookies.keys(); //['gender']
    }
  });

  WebApp.connectHandlers.use(cookie.middleware());
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

## Support this project:

- [Become a patron](https://www.patreon.com/bePatron?u=20396046) — support my open source contributions with monthly donation
- Use [ostr.io](https://ostr.io) — [Monitoring](https://snmp-monitoring.com), [Analytics](https://ostr.io/info/web-analytics), [WebSec](https://domain-protection.info), [Web-CRON](https://web-cron.info) and [Pre-rendering](https://prerendering.com) for a website
