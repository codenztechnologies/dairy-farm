# Epic briefs

One short brief per epic (ids from docs/16 section 4). A brief lets a fresh session start with `CLAUDE.md` plus one page instead of re-reading all of `docs/`. It adds no new decisions: every line points to the doc that owns it. If a brief and a doc disagree, the doc wins; fix the brief.

## How to use

1. Start a session per epic (or per large slice of one). Say: "Work on docs/briefs/E0.x.md".
2. Read the brief, then only the doc sections it names.
3. Work to the brief's done criteria. Run `pnpm verify` before reporting done; it prints one line per gate and full output only for failures.
4. At the end: update the brief's status, `CLAUDE.md` "Current status" and any doc whose behaviour changed, then close the session.

## Quality rules for briefs (do not trade these for fewer tokens)

- Done criteria always include the Definition of Done items that apply (docs/01 section 12): tests, all UI states, i18n en/ur + RTL, security, accessibility.
- Never remove a gate from `scripts/verify.mjs` to make it pass. Add gates as they come into existence.
- Reading fewer docs is fine only when the brief names the right sections. When a task touches an area the brief does not list (tenancy, auth, money, sync), read that doc first.

## Template

```md
# E<id> <title>

Status: not started | in progress | done (date)
Phase: <0|1A|...> · Depends on: <epic ids>

## Goal
One or two sentences.

## Read first (only these)
- docs/<file> section <n> - why
- ...

## Scope
- bullets of what is in

## Out of scope
- bullets (point to the epic that owns it)

## Done when
- [ ] testable criteria, including tests, states, i18n/RTL, security, a11y where applicable
- [ ] `pnpm verify` passes (and `pnpm verify:full` once integration tests exist)
- [ ] docs updated: <which>

## How to check visually
URL and what to look at (dev servers must be running, see CLAUDE.md).

## Notes / decisions made while working
- (append; promote big ones to docs/15)
```

## Token-saving setup (no loss of quality)

Quality is protected by the gates above, not by reading less carelessly. These only remove waste:

| Waste | Fix |
|---|---|
| Re-reading all docs every session | Briefs name the sections needed |
| Build and test logs flooding the context | `pnpm verify` is quiet on success; logs are in `.verify-logs/` |
| Hand-writing boilerplate | Generators after the first reference module (planned in E0.1 follow-up) |
| Screenshots for text checks | Use page text / accessibility tree; screenshots only for layout, dark, RTL |
| Unused tool lists loaded each session | See the user-side trim list below |

### User-side trim list (settings, done by the user)

Disable for this project what we do not use; re-enable when needed:

- MCP servers/connectors not used by this repo (design-tool, Neon-extras beyond the database tools we need, scheduler, browser extension when the built-in browser is enough).
- The impeccable plugin hook (we use ui-ux-pro-max for design; the hook still fires on file writes).
- Skills for image-generation and slide/brand work.

Keep: the built-in browser, Neon database tools (when the Neon project exists), ui-ux-pro-max.
