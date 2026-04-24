---
name: ostrio-cookies
description: Skills for ostrio:cookies Meteor package. Enforces coding style, core principles (bulletproof isomorphic cookies, singleton middleware, zero deps, 99.9% coverage), best practices for modern JS, Node, Meteor.js Atmosphere package development. Apply to all code changes, reviews, PRs, tests, docs.
---

# Universal Agentic Skill for ostrio:cookies

## Core Principles
- Bulletproof: handle all edge cases (Unicode, complex values via JSON+anti-circular, Cordova query params, IE compat, origins).
- Zero external deps. No underscore, jQuery, Blaze.
- High test coverage (Tinytest, TDD). Update tests on changes.
- Singleton middleware: use static `__handlers`, `__hooks` Maps, `isMiddlewareRegistered`, `__autoMiddleware`. Only one `WebApp.connectHandlers.use()`. Support multiple instances via `.destroy()`.
- Early middleware: register `new Cookies()` before routes. Place `ostrio:cookies` high in `.meteor/packages`.
- Consistent API across environments via `Meteor.isClient`/`isServer`/`isCordova`.
- Comprehensive docs: keep README.md, FAQ, examples, API, warnings in sync. Update CHANGELOG.md.
- Maintain TS types in `index.d.ts`, JSDoc `@locus Anywhere/Server/Client`.
- package.js: `mainModule('cookies.js')`, `versionsFrom(['1.4', '3.0.1'])`, weak `zodern:types`+`typescript`, `addAssets('index.d.ts')`.
- `.meteorignore` excludes `.agents`, `.cursor`, tests, docs, AGENTS.md from publish.

## Coding Style Rules
- **Indentation:** 2 spaces.
- Use **single quotes** for strings.
- **Prefer simple ES classes** for cohesive state/services when they clarify lifecycle (e.g. a small data service with start/stop).
- Use **small pure functions** for transforms, formatting, and validation.
- **Performance**: favor O(n) single passes, avoid repeated work and heavy loops, cache derived values when dependencies are narrow.
- JSDoc for every class/method: `@locus`, `@param`, `@returns`, `@summary`, `@memberOf`.
- Private: `__` prefix or Symbol ids.
- Type guards: `helpers.isObject()`, `isNumber()`, `isFunction()` using `Object.prototype.toString.call()` (cross-realm safe). Avoid `typeof` pitfalls.
- ES6+: classes (Cookies extends CookiesCore), const/let, template literals, arrow funcs, destructuring. Preserve broad compat.
- Terse code. Detailed JSDoc > inline comments.
- Error handling: `Meteor.Error`, `Meteor._debug`.
- Helpers.js: pure, regex for JSON detection (`isStringifiedRegEx`), customEscape for Unicode, `tryDecode`, `clone` for safety.
- Server: careful with `req.Cookies`, `response.setHeader('Set-Cookie')`, middleware order.
- Client: `document.cookie`, fetch for send/sendAsync.
- No mutations where avoidable. Handle circular refs in JSON.

### JS Style example

```js
const string = 'string value';
const object = {
  key: string,
};

const complexObject = {
  key: string,
  array: ['one', 'two', 'three'],
  date: new Date(),
  timestamp: Date.now(),
  arrayWithObjects: [{
    key: {
      keyLevel2: false,
    },
    key2: {
      array: [{
        keyLevel3: true,
      }]
    }
  }, {
    keySecondObject: {
      keyLevel2: true,
      otherKeyLevel2: 'string - lorem ipsium',
    }
  }],
}
```

## Meteor.js Package Best Practices
- Atmosphere naming: `ostrio:cookies`.
- Use `api.mainModule()` over `addFiles`.
- onTest: explicit Tinytest assertions, test both/client/server.
- Weak deps for optional TS.
- .meteorignore for non-published files (.agents/AGENTS.md/tests/docs).
- Order in .meteor/packages matters for middleware.
- Keep backward compat. Update version in package.js on changes.
- Tests: `meteor test-packages ./` .

## Modern JS / Node Best Practices
- **JS**: Immutable patterns, explicit checks, avoid side effects in getters. Use modern but compatible (no top-level await if breaks old Meteor).
- **Node**: Proper middleware (req, res, next), handle headers before send, async handlers supported.
- **Security**: Always set secure/httpOnly/sameSite/partitioned/priority attrs where appropriate. Validate origins for Cordova.
- **Performance**: Efficient parse/serialize (for-loops in parse if hot), avoid unnecessary JSON.
- **TS**: Detailed interfaces, JSDoc in .d.ts, declare module for Meteor.
- **General**: TDD, update all affected files (code, types, tests, docs, changelog). No breaking changes without major version.

## When to Apply
- Any edit to cookies.js, helpers.js, package.js, index.d.ts, README.md, tests/.
- Code reviews, PRs, new features.
- Ensure bulletproofness, update all docs/tests.
- Follow user_rules for responses (terse technical).

## Examples
**Good middleware pattern:**
```js
const cookies = new Cookies({ /* opts */ });
// or with handler
new Cookies({
  auto: false,
  async handler(cookies) { /* logic using cookies.response.req */ }
});
```

**Bad:**
- Multiple middleware registrations without destroy().
- Missing @locus in JSDoc.
- Adding deps.
- Forgetting to update tests/types/README.

Read full codebase before changes. Maintain stability (400k+ downloads).
