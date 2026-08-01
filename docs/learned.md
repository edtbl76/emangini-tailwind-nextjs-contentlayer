# Learned

Method AI-DLC — Lite profile, Ship step. What each increment taught, for next time.

---

## Blog authoring skill suite (2026-08-01)

**The two bugs were one bug.** The DOI fix in `974922b` and the "raw angle bracket drops
the post" gotcha looked like separate problems. They are the same MDX parse behavior, and
legacy SICI DOIs are its most common trigger — any post citing pre-2000 journal work is
exposed. Collapsing them into one rule made the validator simpler and the fix obvious.

**`draft:` is a trap, not just dead weight.** `grep -rn "draft"` across every `.ts/.tsx/
.js/.mjs` in the repo returns nothing, and it is absent from the Velite schema. A post
marked `draft: true` publishes normally. All 6 published posts carry the key, so it reads
as functional. **Still unfixed** — either honor it in the Velite schema or stop writing it.

**JSX semantics were the right rule; my first attempt wasn't.** I started with a hand-built
allowlist of permitted tags, which flagged `<div>`, `<video>`, and `<source>` in the
starter examples — 18 false positives. The correct rule is JSX's own: lowercase names are
intrinsic HTML elements and always resolve, capitalized names are variable references that
must be in scope. Running against the real corpus caught this immediately. **Validate
against real content before trusting a rule.**

**YAML dates parse before you see them.** `date: 2021-08-07T15:32:14Z` unquoted becomes a
JS `Date`, and `String(date)` then yields the `toString()` form, not ISO — which my check
read as malformed. The value was fine; the stringification wasn't. This is the reason the
convention of quoting dates exists.

**Push logic into a script, not the prompt.** Skills are prompts and cannot be unit-tested.
Putting the rules in `scripts/validate-post.mjs` gave the suite 31 tests and let
`blog-write` delegate with "output must pass `yarn validate`" instead of restating rules
that would drift.

### Open issues found along the way

- **~~`yarn build` is broken.~~ FIXED — the tree was a mixed npm/yarn chimera.**
  `package-lock.json` resolves parse5 to **7.1.2** (imports `entities/lib/decode.js`, wants
  `entities@^4`); `yarn.lock` resolves it to **7.3.0** (imports `entities/decode`, wants
  `entities@^6`). `node_modules` held 7.1.2's _code_ beside 7.3.0's _dependency layout_, so
  parse5 requested a subpath its own sibling no longer exported. Neither lockfile was wrong
  — only the tree was.

  `rm -rf node_modules && yarn install --immutable` fixed it; both lockfiles unchanged.
  Plain `yarn install` did **not** — it reported "Completed" because every expected package
  was present, and it does not prune packages it did not create.

  **Root cause is still live:** `package-lock.json` is committed alongside `yarn.lock`, so
  any `npm install` recreates the chimera. The repo uses yarn (`.yarnrc.yml` pins 3.6.1).
  Deleting the tracked `package-lock.json` would prevent recurrence and also silence the
  Next.js "multiple lockfiles" workspace-root warning.

- **3 real errors in `data/blog/examples/`** — `sparrowhawk` author has no file (×2), and
  `<BlogNewsletterForm>` is undefined since only `Image`/`TOCInline` are provided. These are
  starter-template leftovers that Velite still ingests (`pattern: 'blog/**/*.mdx'`), so they
  are live on the site. Deleting `data/blog/examples/` would resolve all three.
- **Node is not on the non-login `PATH`** in this environment; it resolves via nvm
  (`v25.6.1`). `yarn` works from an interactive shell.
- **Node 25's test runner rejects a bare directory** — `node --test scripts/` fails; it
  needs a glob (`node --test 'scripts/*.test.mjs'`).

### Process note

Ran this as Lite rather than Standard. Four skill files in one directory read as a
decomposition trigger, but they are one cohesive unit of work sharing a domain — Lite's
"don't pre-adopt" guidance held up. The Plan gate did real work: it surfaced the
citation-format conflict (chosen `.bib` vs. actual APA-prose practice) before any code
was written.
