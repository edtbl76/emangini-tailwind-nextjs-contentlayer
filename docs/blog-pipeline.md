# Blog pipeline

How the seven `blog-*` skills map onto the Method AI-DLC Lite loop in `AGENTS.md`, and how
they stay in order.

---

## The mapping

| AIDLC Lite | Skill             | Produces                                    | Gate            |
| ---------- | ----------------- | ------------------------------------------- | --------------- |
| **Frame**  | `blog-hypothesis` | Falsifiable claim, audience, falsifier      | —               |
| **Frame**  | `blog-research`   | Findings, gaps, verified APA references     | —               |
| **Plan**   | `blog-thesis`     | Thesis sentence, delta, strongest objection | **human owned** |
| **Plan**   | `blog-outline`    | Section order, register, per-section debt   | —               |
| **Build**  | `blog-write`      | `data/blog/<year>/<slug>.mdx`               | —               |
| **Ship**   | `blog-validate`   | Zero errors from `yarn validate`            | —               |
| **Ship**   | `blog-publish`    | Verified build, commit on `develop`         | **human owned** |

Lite defines exactly one mandatory checkpoint: _"you approve the Plan before Build starts."_
`blog-thesis` **is** that checkpoint. `blog-publish` adds a second because pushing is
outward-facing, which is a different kind of irreversibility.

### Why the pipeline gained three stages

It shipped with four skills — research, write, validate, publish — and no equivalent of the
Plan gate. The gap showed up the first time it ran on a real post:

- **No hypothesis stage.** Research began from a topic rather than a claim, so nothing could
  be falsified, only supported.
- **No thesis stage.** The claim moved from _"SDD extends earlier and later than
  development"_ to _"specs written from the middle are unanchored, and the executable
  property was lost."_ Materially larger, arrived at over three findings, noticed only
  because someone asked. `blog-write` would have faithfully drafted the stale one.
- **No outline stage.** Ordering constraints accumulated during research as ad-hoc decisions
  with nowhere to live.

The suite skipped the single mandatory checkpoint of the profile it was built under.

---

## Staying in order

**Skills cannot chain themselves.** Nothing in Claude Code invokes the next skill when one
finishes, so sequence cannot live in the conversation — conversations get resumed, forked,
and restarted cold.

Order lives in the working doc instead. Three mechanisms, weakest to strongest:

### 1. Each skill names its successor

Every `SKILL.md` ends with a **Next step**. Advisory: it works when an agent is reading
along and fails silently when one is invoked directly.

### 2. Each skill declares a prerequisite

Every skill past the first opens with **Prerequisite**, naming the H2 section that must
already exist in the working doc. An agent invoked cold checks the file, not its memory.

### 3. The stage script enforces it

```bash
yarn stage docs/research/<slug>.md                    # where is this post?
yarn stage docs/research/<slug>.md --require outline  # exit 1 if blocked
```

State is derived from the document: an H2 proves a stage produced something, and a ticked
checkbox in the `## Stage` block proves the gate was approved. Prose alone never counts as
sign-off — a written-but-unapproved `## Thesis` reports as `AWAITING APPROVAL` and still
blocks everything downstream.

This is the layer that survives a cold start, and it is checkable rather than remembered.

---

## The working doc

One file per post, `docs/research/<slug>.md`, snake_case slug matching the eventual post.
Sections accumulate in pipeline order; each skill owns its own and appends rather than
rewrites.

```markdown
# <Working title>

## Stage

- [x] Hypothesis
- [x] Research
- [ ] Thesis _(gate — human approval)_
- [ ] Outline
- [ ] Draft

## Hypothesis <- blog-hypothesis

## Question <- blog-research

## Findings <- blog-research

## Gaps <- blog-research

## Decisions <- accumulates across stages

## Thesis <- blog-thesis

## Outline <- blog-outline

## References <- blog-research
```

Detected section names are `Hypothesis`, `Findings`, `Thesis`, `Outline` — renaming those
four breaks stage detection. The rest are conventional.

### Legacy docs

Docs predating the pipeline (`spec_driven_delivery.md`,
`defense_in_depth_guardrails.md`) have `Findings` but no `Stage` block or `Hypothesis`.
They report as needing the hypothesis backfilled, which is accurate — the claim was never
written down before evidence was gathered. Backfilling is optional; nothing forces it.

---

## Running the whole thing

```bash
yarn stage docs/research/my_post.md    # check position before and after each stage
yarn validate data/blog/2026/my_post.mdx
yarn test
```

The pipeline is deliberately **not** automated end to end. Two of the seven stages are human
gates, and the value of the middle stages comes from argument rather than throughput — every
material improvement to the SDD post came from disagreement, not from another pass.
