---
name: ostrio-cookies
description: Rules for editing, reviewing, and testing the ostrio:cookies Meteor package (cookies.js, helpers.js, index.d.ts, tests, docs).
---

# ostrio:cookies

## Invariants
- Zero runtime deps. Package ships only `cookies.js`, `helpers.js`, `index.d.ts` (server asset for `zodern:types`).
- One server middleware: `Cookies.__dispatch` attached once, delegates to `Cookies.__owner`. Callbacks live in static `__handlers` / `__hooks` maps. Destroying the owner hands over to a live instance from `Cookies.__instances`.
- `/___cookie___/set` returns 403 for cross-site requests, never echoes the request `Cookie` header, and sets only Cordova/Desktop query-string cookies from `allowedCordovaOrigins`.
- Only `remove()` without arguments removes all cookies. `expires: 0` means session cookie.
- `serialize()` must reject or escape `;` in names, `path`, `domain`. Values: string, number, boolean, null, object, array (JSON wrapper, circular-safe).
- `index.d.ts` is an ES module (top-level `export`). zodern:types wraps it as `meteor/ostrio:cookies`. No ambient `declare module 'meteor/...'`.
- GitHub Actions pinned by commit SHA with a version comment, `permissions` read-only by default (OpenSSF Scorecard).
- Public API is stable. Behavior changes need tests, README or `docs/` update, and a release note.

## Style
- 2 spaces, single quotes, semicolons, `const` arrow functions, `void 0` for undefined returns.
- JSDoc on every method with `@locus`, `@param`, `@returns`, `@summary`. Private members use the `__` prefix.
- Type checks via `helpers.is*`. Errors via `Meteor.Error`, warnings via `Meteor._debug`.
- Hot paths (parse, serialize, middleware): single pass, no per-request allocations that can be hoisted.

## Change checklist
1. Add a failing Tinytest in `tests/both.js`, `tests/server.js`, or `tests/client.js`.
2. Fix the code.
3. Update `index.d.ts` and `index.test-d.ts` when the API or types change.
4. README: short, example-driven. Details, edge cases, Cordova notes: `docs/*.md`.
5. Run `npm test` (Tinytest via mtest plus tsd) and `npm run test:coverage` (95% thresholds in `package.json` `nyc`, keep them). On Apple Silicon set `PUPPETEER_EXECUTABLE_PATH` to a local Chrome.
6. Breaking change: major version bump in `package.js` (`version` and `onTest` dependency) and a note in `docs/migration-v*.md`.
