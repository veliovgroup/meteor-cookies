# AGENTS.md

Meteor Atmosphere package `ostrio:cookies`: isomorphic cookies for Server, Client, Cordova, and Meteor-Desktop.

These are the rules for editing this package. `.agents/skills/ostrio-cookies/SKILL.md` is the skill that app developers install. It describes the public API only.

## Layout
- `cookies.js`: `CookiesCore` and `Cookies` classes, server middleware (main module).
- `helpers.js`: `parse`, `serialize`, `deserialize`, type guards.
- `index.d.ts`: public types. `index.test-d.ts`: tsd tests.
- `tests/`: Tinytest (`both.js`, `server.js`, `client.js`), coverage collector (`coverage.js`) and runner (`run-coverage.mjs`).
- `docs/`: long-form docs linked from `README.md`.

## Commands
- `npm test`: Tinytest (headless) and type tests.
- `npm run test:types`: type tests only.
- `npm run test:coverage`: Tinytest on istanbul-instrumented sources, nyc report and threshold check.

## Invariants
- Zero runtime deps. Package ships only `cookies.js`, `helpers.js`, `index.d.ts` (server asset for `zodern:types`). Meteor adds every unlisted `.js`, `.mjs`, `.css`, and `node_modules` in the package dir to the published build, so list each new non-shipped file or dir in `.meteorignore`.
- One server middleware: `Cookies.__dispatch` attached once, delegates to `Cookies.__owner`. Callbacks live in static `__handlers` / `__hooks` maps. Destroying the owner hands over to a live instance from `Cookies.__instances`.
- `/___cookie___/set` returns 403 for cross-site requests, never echoes the request `Cookie` header, and sets only Cordova/Desktop query-string cookies from `allowedCordovaOrigins`.
- Only `remove()` without arguments removes all cookies. `expires: 0` means session cookie.
- `serialize()` must reject or escape `;` in names, `path`, `domain`, `sameSite`. `parse(serialize(name))` must return the same name. Values: string, number, boolean, null, object, array (JSON wrapper, circular-safe).
- `index.d.ts` is an ES module (top-level `export`). zodern:types wraps it as `meteor/ostrio:cookies`. No ambient `declare module 'meteor/...'`. Node's `IncomingMessage` and `ServerResponse` must stay assignable to `CookieRequest` and `CookieResponse` (no index signatures).
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
5. Public API or behavior change: update `.agents/skills/ostrio-cookies/SKILL.md`. Keep it terse and user-facing, no package internals.
6. Run `npm test` (Tinytest via mtest plus tsd) and `npm run test:coverage` (95% thresholds in `package.json` `nyc`, keep them). On Apple Silicon set `PUPPETEER_EXECUTABLE_PATH` to a local Chrome.
7. Release: bump `version` in `package.js` (and the `onTest` dependency) and `metadata.version` in the skill. Breaking change: major bump and a note in `docs/migration-v*.md`, linked from the skill.
