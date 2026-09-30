# Security policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 3.x     | Yes       |
| < 3.0   | No, upgrade with [docs/migration-v3.md](docs/migration-v3.md) |

## Reporting a vulnerability

Report vulnerabilities privately via [GitHub Security Advisories](https://github.com/veliovgroup/Meteor-Cookies/security/advisories/new). Don't open a public issue.

Include:

- `ostrio:cookies` and Meteor versions
- Affected environment: Server, Browser, Cordova, or Meteor-Desktop
- Steps or code to reproduce, and the impact

We reply within 7 days. A fix ships as a patch release with a GitHub Security Advisory that credits the reporter, unless you ask not to be named.

## Scope

In scope: cookie parsing and serialization (`helpers.js`), the server middleware and the `/___cookie___/set` endpoint (`cookies.js`).

Out of scope: vulnerabilities in Meteor, browsers, or application code that uses this package.
