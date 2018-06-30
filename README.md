# Isomorphic Cookies

Isomorphic bulletproof cookie functions for *Client* and *Server*.

  - __100% Tests coverage__
  - No external dependencies, no `underscore`, no `jQuery`, no `Blaze`
  - Works on both *Server* and *Client*
  - Support for unicode
  - Support for *String*, *Boolean*, *Object* and *Array* as a values
  - IE support, thanks to [@derwok](https://github.com/derwok)
  - Looking for *Client*'s (Browser) persistent storage? Try [`ClientStorage` package](https://github.com/VeliovGroup/Client-Storage#persistent-client-browser-storage)

## Install:

```shell
meteor add ostrio:cookies
```

## ES6 Import:

```js
import { Cookies } from 'meteor/ostrio:cookies';
```

## API:

__Note:__ On a server, cookies will be set __only__ after headers are sent (on next route or page reload). To send cookies from *Client* to *Server* without a page reload use `send()` method.

__Server Usage Note:__ On a server Cookies implemented as a middleware. To get access to current user's cookies use `req.Cookies` instance. For more - see examples section below.

### Fetch cookies `new Cookies(opts)` [*Isomorphic*]

Create new instance of Cookies

  - `opts.auto` {*Boolean*} - [*Server*] Auto-bind in middleware as `req.Cookies`, by default `true`
  - `opts.handler` {*Function*} - [*Server*] Middleware function with one argument `cookies` as `Cookies` instance. See "Alternate Usage" section
  - `opts.TTL` {*Number*} - Default cookies expiration time (max-age) in milliseconds, by default - `session` (*no TTL*)
  - `opts.runOnServer` {*Boolean*} - Set to `false` to avoid server usage (by default - `true`)

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

Send all current cookies to server

## Examples:

```js
/* Both Client & Server */
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
  const cookie = new Cookies({
    auto: false, // Do not bind as a middleware by default
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

## Support this project:

This project wouldn't be possible without [ostr.io](https://ostr.io).

Using [ostr.io](https://ostr.io) you are not only [protecting domain names](https://ostr.io/info/domain-names-protection), [monitoring websites and servers](https://ostr.io/info/monitoring), using [Prerendering for better SEO](https://ostr.io/info/prerendering) of your JavaScript website, but support our Open Source activity, and great packages like this one could be available for free.
