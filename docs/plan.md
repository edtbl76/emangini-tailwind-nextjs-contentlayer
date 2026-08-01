# Plan

Method AI-DLC — Lite profile. Frames in `frame.md`. **This plan is the human gate.**

---

## Blog authoring skill suite

Four skills in `.claude/skills/`, each a `SKILL.md` with `name` + `description` frontmatter.
Independent and composable: each names the next as a suggested follow-up, none auto-invokes.

Citations are **APA prose with pre-encoded DOIs**, matching every real post.
`references-data.bib` is left untouched.

### Task order

Dependency-ordered. The validation rules are the shared contract — Write and Publish both
depend on them being right, so they are built and tested first.

| #   | Task                                               | Output                                  | Verifiable by                                                        |
| --- | -------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| 1   | Extract the validation rules into a script         | `scripts/validate-post.mjs`             | `node scripts/validate-post.mjs <file>` exits non-zero on a bad post |
| 2   | Tests for the rules, incl. the real DOI regression | `scripts/validate-post.test.mjs`        | `node --test scripts/` passes                                        |
| 3   | Wire a `validate` npm script                       | `package.json`                          | `yarn validate data/blog/2026/*.mdx` runs clean on all 6 real posts  |
| 4   | `blog-validate` skill wrapping the script          | `.claude/skills/blog-validate/SKILL.md` | Invoking it on `harness_engineering.mdx` reports clean               |
| 5   | `blog-write` skill                                 | `.claude/skills/blog-write/SKILL.md`    | Scaffolds a post that passes task 3                                  |
| 6   | `blog-research` skill                              | `.claude/skills/blog-research/SKILL.md` | Produces an APA list whose DOIs pass task 1                          |
| 7   | `blog-publish` skill                               | `.claude/skills/blog-publish/SKILL.md`  | Dry-run on a scratch post; build succeeds                            |
| 8   | Record what we learned                             | `docs/learned.md`                       | —                                                                    |

### Validation rules (task 1)

The contract. Each is a verified failure mode, not a guess.

| Rule                                            | Severity  | Why                                                   |
| ----------------------------------------------- | --------- | ----------------------------------------------------- |
| Raw `<` or `>` in body outside code fences      | **error** | Silently drops the whole post — the core bug          |
| DOI containing unencoded `<`/`>`                | **error** | Commit `974922b`; legacy SICI DOIs hit this routinely |
| Missing `title` or `date`                       | **error** | Velite schema requires them; build fails              |
| `date` not ISO `YYYY-MM-DD`                     | **error** | `s.isodate()` rejects it                              |
| Year directory ≠ year in `date`                 | warn      | Convention only, not enforced by the schema           |
| `authors` entry with no file in `data/authors/` | **error** | Renders a broken author                               |
| Missing `summary`                               | warn      | Optional in schema; used in listings                  |
| `draft:` or `tags:` present                     | warn      | Dead frontmatter — see below                          |

### Decisions to confirm

1. **Dead frontmatter.** `draft:` and `tags:` do nothing (`frame.md` finding 2). The plan
   has `blog-write` **omit** them from new posts and `blog-validate` **warn** on them in
   existing ones, rather than silently propagating cargo. It does not rewrite your 6
   existing posts. Say so if you'd rather keep them for consistency.

2. **`draft: true` is a trap.** Nothing honors it, so a post you believe is a draft
   publishes. Out of scope to fix here — flagging it as a real latent bug worth its own
   change.

3. **Publish never pushes unasked.** `blog-publish` will build, verify, and stage a commit
   on `develop`, then stop and confirm before any push. Pushing is outward-facing.

### Riskiest assumption

That a regex-based check can reliably tell a real JSX tag from a raw `<` inside prose.
Fenced code blocks and inline backticks must be stripped before scanning, or the validator
will cry wolf on every code sample in a technical post. Task 2 tests this directly against
`harness_engineering.mdx`, the longest real post, which must come back clean.

### Not doing

Migrating to BibTeX · touching `references-data.bib` · rewriting existing posts ·
adding a test framework dependency · fixing the `draft:` bug.
