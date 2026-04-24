# AGENTS.md

Core rules for all AI agents / Cursor agents working on this ostrio:cookies repository.

## Universal Agentic Skill
See [`.agents/ostrio-cookies-skill.md`](.agents/ostrio-cookies-skill.md) for:
- Coding style rules (JSDoc @locus, __private, type guards via toString.call, Meteor.is*).
- Core principles of package (bulletproof cookies, singleton middleware with static Maps + destroy(), zero deps, 99.9% Tinytest coverage, Unicode+complex values).
- Best practices: modern JS, Node middleware, Meteor Atmosphere package dev (package.js mainModule/versionsFrom/weak TS, early middleware, update tests/types/docs/CHANGELOG, .meteorignore exclusions).

**Always load and follow this skill for any task, review, edit, PR.**

## Core Rules
- **Review repo first**: Use knowledge of cookies.js (Cookies extends CookiesCore), helpers.js (parse/serialize/escape), package.js, index.d.ts, README.md, tests/.
- **Maintain principles**: Bulletproof all edge cases. No new deps. High coverage. Singleton middleware pattern. Update ALL related files on change (code, tests, types, docs, changelog).
- **Meteor specifics**: JSDoc everywhere with @locus. Early WebApp.connectHandlers. Place high in .meteor/packages. mainModule(). Weak TS. Tinytest tests for client/server/both.
- **JS Style**: ES6 classes, explicit helpers.is*, Symbol ids, terse but documented. Cross-env type checks. Template literals. No var.
- **Changes**: Follow user_rules (terse technical responses, normal for code/commits/PRs). Update version if breaking. Keep compat.
- **Tests**: Run `meteor test-packages ./` after changes. 99.9% coverage.
- **Docs**: Sync README examples, FAQ (Cordova, middleware order), API notes.
- **PRs/Reviews**: Check singleton, destroy(), security attrs (sameSite, partitioned, priority), TS, tests.

This file excluded from Meteor publish via .meteorignore. Skill in .agents/ also excluded.

Follow create-rule and create-skill patterns where applicable for future extensions.
