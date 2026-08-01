---
name: blog-validate
description: Use when checking a blog post in data/blog before committing, publishing, or after any edit to a post body or frontmatter — catches the MDX silent-drop bug, unencoded DOIs, and Velite schema violations. Trigger on "validate this post", "check my post", "is this post OK", or before running blog-publish.
---

# Validate a blog post

Velite type-checks frontmatter but never inspects the body. MDX parses a raw `<` in prose
as the start of a JSX tag, so a post can vanish from the built site **with no build error**.
That is the bug this guards against. It has shipped here before — commit `974922b`.

## Run it

```bash
yarn validate data/blog/2026/my-post.mdx   # one post
yarn validate:all                          # every post, including data/blog/examples
```

Exit code is `1` if there are errors, `0` if only warnings. Warnings never block.

Run this **before** `blog-publish` and after any edit to a post body.

## Reading the output

### Errors — these break the site

| Rule                  | Meaning                                                                | Fix                                                                  |
| --------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `raw-angle-bracket`   | A bare `<` in prose. MDX reads it as JSX and drops the post.           | Escape as `\<`, wrap in backticks, or percent-encode if in a URL.    |
| `doi-encoding`        | Unencoded `<`/`>` inside a DOI.                                        | `<` → `%3C`, `>` → `%3E`. Legacy SICI DOIs hit this constantly.      |
| `unknown-element`     | Lowercase tag that is not real HTML — usually prose, not a tag.        | Escape the `<`.                                                      |
| `undefined-component` | Capitalized tag. JSX resolves it as a variable, and it is not defined. | Only `Image` and `TOCInline` exist (`components/MDXComponents.tsx`). |
| `html-comment`        | `<!-- -->` is invalid in MDX v2.                                       | Use `{/* ... */}`.                                                   |
| `required-field`      | Missing `title` or `date`.                                             | Velite requires both; the build fails.                               |
| `date-format`         | Date string is not `YYYY-MM-DD`.                                       | Quote it: `date: '2026-07-17'`.                                      |
| `unknown-author`      | `authors:` entry with no file in `data/authors/`.                      | Use `default`, or add the author file.                               |

### Warnings — worth knowing, never fatal

| Rule                  | Meaning                                                                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dead-frontmatter`    | `draft:` or `tags:`. Neither is in the Velite schema nor read anywhere in the codebase. **`draft: true` does not prevent publication.** Do not rely on it. |
| `unknown-frontmatter` | Key outside the schema; silently stripped at build.                                                                                                        |
| `unquoted-date`       | YAML parsed the date as a timestamp. Valid, but quote it to match other posts.                                                                             |
| `missing-summary`     | No `summary`; post listings will have nothing to show.                                                                                                     |
| `year-mismatch`       | File is in `data/blog/<year>/` that disagrees with `date`. Convention only.                                                                                |

## Interpreting results for the user

- **Report errors plainly and stop.** Do not publish a post with errors.
- **Do not auto-fix silently.** Show the offending line and the fix, then let the user confirm —
  an escaped character changes rendered prose.
- **Do not strip `draft:`/`tags:` from existing posts** as a side effect of validating. All
  6 published posts carry them; removing them is a separate decision.
- The 3 errors in `data/blog/examples/` are pre-existing starter-template content
  (`sparrowhawk` author, `BlogNewsletterForm`). Mention them once; don't re-flag every run.

## Adding a rule

Rules live in `scripts/validate-post.mjs`, tests in `scripts/validate-post.test.mjs`.
Every rule must have a test, and the whole real corpus must stay at zero errors:

```bash
yarn test
```

A validator that cries wolf on real posts gets ignored, which is worse than no validator.
If a new rule flags any of the 6 published posts, the rule is wrong — not the post.

## Next step

Clean? → `blog-publish` to build, verify, and commit.
