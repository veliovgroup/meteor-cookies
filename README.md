Cookies for Meteor driven Client
========

Boilerplate cookie functions

Install:
========
```shell
meteor add ostrio:cookies
```

Usage:
========
#### Get
 - `get(key)` - Read a cookie. If the cookie doesn't exist a null value will be returned.

#### Set
 - `set('key', value)` - Create/overwrite a cookie
 - `set(key, value, expires, path, domain, secure)`:
    - key      - The name of the cookie to create/overwrite
    - value    - The value of the cookie
    - expires  - [Optional] The max-age in seconds (e.g. 31536e3 for a year, Infinity for a never-expires cookie), or the expires date in GMTString format or as Date object; if not specified the cookie will expire at the end of session (number – finite or Infinity – string, Date object or null)
    - path     - [Optional] The path from where the cookie will be readable. E.g., "/", "/mydir"; if not specified, defaults to the current path of the current document location (string or null). The path must be absolute (see RFC 2965). For more information on how to use relative paths in this argument, see: https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter
    - domain   - [Optional] The domain from where the cookie will be readable. E.g., "example.com", ".example.com" (includes all subdomains) or "subdomain.example.com"; if not specified, defaults to the host portion of the current document location (string or null)
    - secure   - [Optional] The cookie will be transmitted only over secure protocol as https (boolean or null)

#### Remove
 - `remove()` - Remove all cookies on current domain
 - `remove(key)` - Remove a cookie on current domain
 - `remove(key, path, domain)`:
    - key      - The name of the cookie to create/overwrite
    - path     - [Optional] The path from where the cookie was readable. E.g., "/", "/mydir"; if not specified, defaults to the current path of the current document location (string or null). The path must be absolute (see RFC 2965). For more information on how to use relative paths in this argument, see: https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter
    - domain   - [Optional] The domain from where the cookie was readable. E.g., "example.com", ".example.com" (includes all subdomains) or "subdomain.example.com"; if not specified, defaults to the host portion of the current document location (string or null)

#### Has
 - `has(key)` - Check whether a cookie exists in the current position, returns boolean value

#### Keys
 - `keys()` - Returns an array of all readable cookies from this location


Example:
=========
```javascript
Meteor.cookie.set('locale', 'en'); //true
Meteor.cookie.set('country', 'usa'); //true
Meteor.cookie.set('gender', 'male'); //true

Meteor.cookie.get('gender'); //male

Meteor.cookie.has('locale'); //true
Meteor.cookie.has('city'); //false

Meteor.cookie.keys(); //['locale', 'country', 'gender']

Meteor.cookie.remove('locale'); //true
Meteor.cookie.set('locale'); //null

Meteor.cookie.keys(); //['country', 'gender']

Meteor.cookie.remove(); //true
Meteor.cookie.keys(); //[""]
```