# Learned

Method AI-DLC — Lite profile, Ship step. What each increment taught, for next time.

---

## Blog authoring skill suite (2026-08-01)

**The two bugs were one bug.** The DOI fix in `974922b` and the "raw angle bracket drops
the post" gotcha looked like separate problems. They are the same MDX parse behavior, and
legacy SICI DOIs are its most common trigger — any post citing pre-2000 journal work is
exposed. Collapsing them into one rule made the validator simpler and the fix obvious.

**`draft:` was a trap, not just dead weight. FIXED.** `grep -rn "draft"` across every
`.ts/.tsx/.js/.mjs` returned nothing and it was absent from the Velite schema, so
`draft: true` published normally while reading as a safety mechanism. Now in the schema
with a `publishedPosts()` helper applied at all six surfaces (home, blog index, paginated
index, post route params and lookup, sitemap, RSS). Centralized deliberately: scattered
per-surface checks are exactly how it became decorative.

**Verify a guard by trying to defeat it.** Reading six call sites proves nothing. A
temporary `draft: true` post proved it: ingested by Velite, no static route generated,
absent from sitemap and `feed.xml`.

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

**Read the schema; do not infer it.** I assumed `s.isodate()` required `YYYY-MM-DD`. It is
`stringType().refine(v => !isNaN(Date.parse(v))).transform(v => new Date(v).toISOString())`
— any parseable string passes. Three 2024 posts use `'2024-06-04 00:00:00'` and build fine,
but the rule called them errors. **A validator stricter than the schema flags working
content**, which is how one gets ignored. Now only unparseable dates error.

**Partial corpora hide false positives.** The corpus test covered 2025–2026 only, so the
2024 date bug survived a full round of work. It now walks every year directory. Both
false-positive classes this session came from a rule that looked right and had never met
the whole corpus.

**Push logic into a script, not the prompt.** Skills are prompts and cannot be unit-tested.
Putting the rules in `scripts/validate-post.mjs` gave the suite 61 tests and let
`blog-write` delegate with "output must pass `yarn validate`" instead of restating rules
that would drift.

**A live flag makes prose stale.** Honoring `draft` turned the validator's own
`dead-frontmatter` warning into a lie and contradicted `blog-write`, which told authors not
to use it. Behavior and the prose describing it have to move in the same commit.

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

  **Root cause: FIXED.** `package-lock.json` was tracked alongside `yarn.lock`, so any
  `npm install` recreated the chimera. Now untracked. Note `.gitignore` had listed
  `/package-lock.json` all along — gitignore does not apply to already-tracked files, so
  the rule sat inert. **Removing the repo's copy did not silence the Next.js "multiple
  lockfiles" warning**; a stray `/home/edwardmangini/package-lock.json` outside the repo
  still makes Next infer the home directory as workspace root.

- **~~3 real errors in `data/blog/examples/`.~~ FIXED** by deleting the directory — 11
  starter posts that Velite ingested (`pattern: 'blog/**/*.mdx'`) and served alongside real
  writing. Site went from 44 to 33 posts.

- **~~`next-env.d.ts` vs ESLint.~~ FIXED** via `.eslintignore`. Next.js regenerates the file
  with a triple-slash reference that `@typescript-eslint/triple-slash-reference` rejects, so
  the pre-commit hook blocked a file nobody hand-edits and every build left the tree dirty.

- **`git rm` stages immediately.** The example deletions were staged the moment I ran
  `git rm -r`, so a later `git commit` of unrelated files swept them in under a message that
  never mentioned them. Caught before pushing and redone with `git reset --soft`. **Check
  `git show --stat` against the message, not just `git add` arguments.**

- **lint-staged fails on partially-staged files.** When prettier rewrites a file that has
  both staged and unstaged changes, restoring the unstaged half hits a merge conflict and
  the whole commit reverts. Run prettier first, or stage the file whole.

### Dependabot (2026-08-01)

**Most of the 59 alerts were an artifact of the duplicate lockfile.** 36 were against
`package-lock.json` — already untracked in `5c686c2`, so they close when `develop` merges.
Only 23 were real, across 33 unique advisories. **Count alerts per manifest before
estimating the work**; the headline number was inflated ~2.5x by a file that no longer
exists.

**`next` was 13 of the 23.** A single patch bump (15.5.18 → 15.5.21) cleared 8 CVEs. The
skew mattered too: `eslint-config-next` and `@next/bundle-analyzer` sat at **14.2.3** while
next was on 15 — a major behind, dragging vulnerable `glob@10.3.10` with them.

**`resolutions.sharp = ^0.35.0` is deliberate; do not remove it casually.** Both `next`
(`^0.34.3`) and `velite` (`^0.34.5`) cap sharp below the patched 0.35.0, so the override is
the only way to get the libvips fixes. Revisit once both widen their ranges. Verified
working rather than assumed: sharp encodes, the build passes, and `/_next/image` returns a
resized WebP.

**Optional follow-up:** `next.config.js` allows `picsum.photos` in `remotePatterns`, used
only as a fallback in `layouts/PostBanner.tsx` — a layout no post selects, since none sets
`layout:`. It remains a live third-party proxy target via `/_next/image`. Removing it would
close the untrusted-input path that made the sharp advisory relevant here at all.

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
