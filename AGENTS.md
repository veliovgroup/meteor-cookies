# AGENTS.md

Meteor Atmosphere package `ostrio:cookies`: isomorphic cookies for Server, Client, Cordova, and Meteor-Desktop.

Load [`.agents/skills/ostrio-cookies/SKILL.md`](.agents/skills/ostrio-cookies/SKILL.md) before any edit or review.

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
