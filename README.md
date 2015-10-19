Isomorphic Cookies
========
Isomorphic boilerplate cookie functions for client and server

 - __100% Tests coverage__
 - Works on both server and client

Install:
========
```shell
meteor add ostrio:cookies
```

Usage:
========
__Note:__ On server, cookies will be set __only__ after headers is sent (on next route or page reload). To send cookies from client to server without page reload use `apply()` method

__Server Usage Note:__ On server Cookies implemented in middleware. To get access to current user's cookies use `req.Cookies` instance. For more - see examples section below.

#### `Cookies.get(key)` [*Isomorphic*]
 Read a cookie. If the cookie doesn't exist a `null` will be returned.
 - `key` {*String*} - The name of the cookie to read

#### `Cookies.set((key, value, [opts])` [*Isomorphic*]
  Create/overwrite a cookie.
  - `key` {*String*} - The name of the cookie to create/overwrite
  - `value` {*String*} - The value of the cookie
  - `opts.expires` {*Number*|*Date*|*Infinity*}  - [Optional] The max-age in seconds (e.g. 31536e3 for a year, Infinity for a never-expires cookie), or the expires date in GMTString format or as Date object; if not specified the cookie will expire at the end of session (number – finite or Infinity – string, Date object or null)
  - `opts.path` {*String*} - [Optional] The path from where the cookie will be readable. E.g., "/", "/mydir"; if not specified, defaults to the current path of the current document location (string or null). The path must be absolute (see RFC 2965). For more information on how to use relative paths in this argument, see: https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter
  - `opts.domain` {*String*} - [Optional] The domain from where the cookie will be readable. E.g., "example.com", ".example.com" (includes all subdomains) or "subdomain.example.com"; if not specified, defaults to the host portion of the current document location (string or null)
  - `opts.secure` {*Boolean*} - [Optional] The cookie will be transmitted only over secure protocol as https (boolean or null)

#### `Cookies.remove([key], [path], [domain])` [*Isomorphic*]
 - `remove()` - Remove all cookies on current domain
 - `remove(key)` - Remove a cookie on current domain
 - `remove(key, path, domain)`:
    - `key` {*String*} - The name of the cookie to create/overwrite
    - `path` {*String*} - [Optional] The path from where the cookie was readable. E.g., "/", "/mydir"; if not specified, defaults to the current path of the current document location (string or null). The path must be absolute (see RFC 2965). For more information on how to use relative paths in this argument, see: https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter
    - `domain` {*String*} - [Optional] The domain from where the cookie was readable. E.g., "example.com", ".example.com" (includes all subdomains) or "subdomain.example.com"; if not specified, defaults to the host portion of the current document location (string or null)

#### `Cookies.has(key)` [*Isomorphic*]
 Check whether a cookie exists in the current position, returns boolean value
 - `key` {*String*} - The name of the cookie to check

#### `Cookies.keys()` [*Isomorphic*]
  Returns an array of all readable cookies from this location

#### `Cookies.apply()` [*Client*]
  Send and apply all current cookies to server

#### `CookiesTTL` [*Isomorphic*]
  Default cookies expiration time (max-age) in milliseconds, by default - 31 day


Examples:
=========
```javascript
/* Client */
if(Meteor.isClient){
  Cookies.set('locale', 'en'); //true
  Cookies.set('country', 'usa'); //true
  Cookies.set('gender', 'male'); //true

  Cookies.get('gender'); //male

  Cookies.has('locale'); //true
  Cookies.has('city'); //false

  Cookies.keys(); //['locale', 'country', 'gender']

  Cookies.remove('locale'); //true
  Cookies.get('locale'); //null

  Cookies.keys(); //['country', 'gender']

  Cookies.remove(); //true
  Cookies.keys(); //[""]

  Cookies.remove(); //false
}

if(Meteor.isServer){
  WebApp.connectHandlers.use(function(req, res, next){
    Cookies = req.Cookies;

    Cookies.set('locale', 'en'); //true
    Cookies.set('country', 'usa'); //true
    Cookies.set('gender', 'male'); //true

    Cookies.get('gender'); //male

    Cookies.has('locale'); //true
    Cookies.has('city'); //false

    Cookies.keys(); //['locale', 'country', 'gender']

    Cookies.remove('locale'); //true
    Cookies.get('locale'); //null

    Cookies.keys(); //['country', 'gender']

    Cookies.remove(); //true
    Cookies.keys(); //[""]

    Cookies.remove(); //false
  });
}
```