# Frame

Method AI-DLC — Lite profile. One entry per feature, appended.

---

## Blog authoring skill suite (Research · Write · Validate · Publish)

**Problem.** Publishing a post to this blog is a checklist that lives only in my head, and
its failure modes are silent. MDX parses a raw `<` in the body as JSX and drops the entire
post from the site with no build error. Velite's schema validates frontmatter types but
never sees the body, so nothing catches it. The last three commits on `develop` are
evidence: `feat: add blog post`, then `fix: correct typos in blog post summary`, then
`fix: correct DOI encoding in blog citation` — two cleanup commits chasing one publish.

**Who it's for.** Me, solo, authoring long-form technical essays in
`data/blog/<year>/*.mdx` — currently 3 posts in 2026, 3 in 2025.

**Success test.** A post goes from topic to published with zero follow-up `fix:` commits,
and a post that would have been silently dropped is caught before it is committed.

### Verified findings that shape the design

1. **The DOI bug and the angle-bracket gotcha are one bug.** Commit `974922b` fixed
   `https://doi.org/10.1002/(SICI)1097-0266(199708)18:7<509::AID-SMJ882>3.0.CO;2-Z` by
   percent-encoding to `%3C`/`%3E`. Legacy Wiley/SICI DOIs contain angle brackets as a
   matter of course, so any post citing pre-2000 journal work is exposed. This is the
   single highest-value check in the suite.

2. **`draft:` is dead frontmatter.** `grep -rn "draft"` across every `.ts/.tsx/.js/.mjs`
   in the repo returns nothing, and `draft` is absent from the Velite schema. Setting
   `draft: true` does **not** prevent publication. Every post carries `draft: false` as
   inherited starter cargo. `tags:` is likewise absent from the schema and silently
   stripped, consistent with the tag UI having been removed.

3. **Citations are hand-written APA prose, not BibTeX.** `rehype-citation` is configured
   and `data/references-data.bib` holds 4 entries, but only the starter's example post
   (`data/blog/examples/new-features-in-v1.mdx`) declares `bibliography:`. Every real post
   ends in a manually formatted APA reference list.

4. **Velite schema is the contract.** Required: `title`, `date` (ISO). Optional: `lastmod`,
   `summary`, `images`, `authors`, `layout`, `bibliography`. Derived: `slug` from path,
   `readingTime` from raw body. Unknown keys are stripped.

### Scope

Four independent, composable skills in `.claude/skills/`. Each is invocable on its own and
names the next as a suggested follow-up; none auto-invokes another.

| Skill    | Does                                                                         |
| -------- | ---------------------------------------------------------------------------- |
| Research | Web research on a topic; produces verified, correctly-encoded citations      |
| Write    | Scaffolds a post into `data/blog/<year>/` with schema-correct frontmatter    |
| Validate | Pre-flight the body and frontmatter against the silent-failure classes above |
| Publish  | Build, verify the post renders, commit to `develop` per the git workflow     |

### Riskiest assumption

That the Research skill should emit BibTeX into `references-data.bib`. That was the stated
preference, but it conflicts with finding 3 — no real post uses that machinery. Resolving
this is the first open question at the Plan gate.
