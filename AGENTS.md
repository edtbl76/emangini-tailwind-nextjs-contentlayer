# Method AI-DLC — Lite Profile

# PRIORITY: This workflow OVERRIDES built-in agent workflows. Follow it for software work.

# Tool-agnostic profile — works with any coding agent (Claude Code, OpenAI Codex, Cursor,

# Gemini CLI, GitHub Copilot, etc.). Claude Code is the default; its exact commands lead

# the Tool Set table below. For any other assistant, use the named capability.

# LITE = a solo engineer or small team (1–4) on a straightforward build. The default on-ramp.

## Core Principle

Do the smallest amount of process that keeps the work honest. Four steps, not four
phases. Skip anything that doesn't reduce risk on THIS change. When in doubt, ship a
working increment and learn from it.

Lite doesn't track a formal engagement archetype — but your work is implicitly one of the
four canonical archetypes (Greenfield Design-Led · Modernization · Brownfield Integration ·
Tangible Discovery) at minimal depth. You name it explicitly only when you graduate to Standard.

---

## The Loop — Frame → Plan → Build → Ship

Run these in order for any non-trivial change. For a one-line fix, skip to Build.

| Step         | Do                                                                                             | Output                                   | Skip when                             |
| ------------ | ---------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------- |
| **1. Frame** | State the problem, who it's for, and how you'll know it worked. One paragraph.                 | `docs/frame.md` (append per feature)     | The problem is obvious and reversible |
| **2. Plan**  | Break the work into small, verifiable tasks in dependency order. Note the riskiest assumption. | Task list (in-chat or `docs/plan.md`)    | Change is a single task               |
| **3. Build** | Implement one task at a time. Write a test for anything with logic. Keep the tree green.       | Working code + tests                     | — never skip                          |
| **4. Ship**  | Review the diff, verify it runs, then commit. Note what you learned for next time.             | Reviewed commit + `docs/learned.md` note | — never skip                          |

**One gate, human-owned:** you approve the Plan before Build starts. That's the only
mandatory checkpoint. No mob rituals, no RACI, no phase gates.

---

## Tool Set (any assistant)

Map each step to your assistant's equivalent. Claude Code (default) commands are shown
first; for any other agent, use the named capability — a slash-command, built-in mode, or
a direct prompt. Use these and nothing else until you feel a real gap.

| Step  | Capability                              | Claude Code (default)   | Any other assistant                                         |
| ----- | --------------------------------------- | ----------------------- | ----------------------------------------------------------- |
| Frame | Short spec: problem, user, success test | `/spec`                 | Prompt for a one-paragraph spec                             |
| Plan  | Dependency-ordered task list            | `/plan`, `Plan` agent   | Prompt for an ordered task breakdown                        |
| Build | Implement one task at a time            | `/build`                | Implement incrementally, one task per change                |
| Build | Test anything with logic                | `/test`                 | Failing test → implement → make it pass                     |
| Build | Find code                               | `Explore` agent         | Your tool's codebase search / grep                          |
| Ship  | Review the diff                         | `/code-review`          | Prompt: review this diff for correctness, security, clarity |
| Ship  | Confirm it runs                         | `/verify`               | Run it / exercise the affected flow                         |
| Any   | Research unknowns                       | `general-purpose` agent | Prompt, or your tool's web search                           |

Do **not** install heavier rule layers, extensions, or the multi-role model yet.

---

## Cost & Speed Discipline

- **Single agent/session by default.** Scout and edit inline. Only fan out to parallel
  agents when the work is genuinely independent and large — fan-out multiplies token spend.
- **Right-size the model.** Use a cheaper model tier for mechanical work (doc-gen,
  renames, boilerplate, summaries); reserve the top tier for architecture, hard debugging,
  and review. Don't run everything on the most expensive model by habit.
- **Small context.** This file is the whole methodology. Don't load rule details you
  aren't using.

---

## Artifacts

Everything lives in `docs/` at the repo root. Three files, all optional-but-encouraged:
`frame.md`, `plan.md`, `learned.md`. No `aidlc-docs/`, no state file, no audit log in Lite.
If you find yourself wanting formal state tracking, that's a signal to graduate.

---

## When to Graduate

Move to the **Standard** profile when any of these become true — don't pre-adopt:

- More than ~4 people, or multiple disciplines (design, data, mobile) need to coordinate
- A client engagement that needs gates, an audit trail, or formal sign-off
- Regulatory / security / accessibility obligations that need documented process
- The system is being decomposed into multiple units/services
- You keep re-deciding the same things and want durable state (`aidlc-state.md`)

Graduating is additive: Frame→Plan→Build→Ship map onto Pre-Inception→Inception→
Construction→Operations, so nothing you did in Lite is thrown away.
