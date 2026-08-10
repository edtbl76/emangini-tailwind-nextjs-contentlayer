#!/usr/bin/env node
/**
 * Report — and enforce — where a post sits in the blog pipeline.
 *
 * Skills cannot chain themselves: nothing in Claude Code invokes the next skill when one
 * finishes. Order therefore cannot live in the conversation, because a conversation can be
 * resumed, forked, or restarted from cold. It lives in the working doc instead, and this
 * script reads it.
 *
 * The doc is the ground truth for pipeline position, which is the same argument the
 * pipeline exists to make about specs.
 *
 * Usage:
 *   node scripts/blog-stage.mjs docs/research/my_post.md
 *   node scripts/blog-stage.mjs docs/research/my_post.md --require thesis
 *
 * With --require <stage>, exits non-zero if that stage's prerequisites are unmet.
 */

import fs from 'node:fs'
import path from 'node:path'

/**
 * The pipeline, in order.
 *
 * `section` is the H2 whose presence proves the stage produced something. `gated` marks a
 * stage that additionally needs a ticked checkbox in the Stage block — human approval,
 * which the presence of prose cannot demonstrate.
 */
export const STAGES = [
  { name: 'hypothesis', section: 'Hypothesis', skill: 'blog-hypothesis', gated: false },
  { name: 'research', section: 'Findings', skill: 'blog-research', gated: false },
  { name: 'thesis', section: 'Thesis', skill: 'blog-thesis', gated: true },
  { name: 'outline', section: 'Outline', skill: 'blog-outline', gated: false },
  { name: 'draft', section: null, skill: 'blog-write', gated: false },
]

/** H2 headings present in the doc, lowercased. */
export function headings(raw) {
  return raw
    .split('\n')
    .filter((line) => /^##\s+/.test(line))
    .map((line) => line.replace(/^##\s+/, '').trim().toLowerCase())
}

/**
 * Checkbox states from the Stage block, e.g. `- [x] Thesis` -> { thesis: true }.
 *
 * Trailing annotations are tolerated: `- [ ] Thesis _(gate — human approval)_` still keys
 * on "thesis", so the template can explain itself without breaking the parse.
 */
export function checkboxes(raw) {
  const found = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*-\s*\[([ xX])\]\s*([A-Za-z][A-Za-z ]*?)(?:\s*[_(].*)?$/)
    if (m) found[m[2].trim().toLowerCase()] = m[1].toLowerCase() === 'x'
  }
  return found
}

/**
 * Evaluate every stage against the doc.
 *
 * A stage is `done` when its section exists and, if gated, its box is ticked. `current` is
 * the first stage that is not done — the one to run next.
 */
export function evaluate(raw) {
  const present = new Set(headings(raw))
  const ticks = checkboxes(raw)

  const stages = STAGES.map((stage) => {
    const hasSection = stage.section ? present.has(stage.section.toLowerCase()) : false
    const approved = stage.gated ? ticks[stage.name] === true : true
    return {
      ...stage,
      hasSection,
      approved,
      done: hasSection && approved,
      // A gated stage that wrote its section but was never approved is the interesting
      // failure: work happened, sign-off did not.
      awaitingApproval: stage.gated && hasSection && !approved,
    }
  })

  return { stages, current: stages.find((s) => !s.done) ?? null }
}

/** Prerequisites for a stage are every stage before it. */
export function blockers(raw, target) {
  const idx = STAGES.findIndex((s) => s.name === target)
  if (idx === -1) return { unknown: true, missing: [] }
  const { stages } = evaluate(raw)
  return { unknown: false, missing: stages.slice(0, idx).filter((s) => !s.done) }
}

// ---- CLI -----------------------------------------------------------------------

function main(argv) {
  const args = argv.filter((a) => !a.startsWith('--'))
  const requireIdx = argv.indexOf('--require')
  const required = requireIdx !== -1 ? argv[requireIdx + 1] : null
  const file = args[0]

  if (!file) {
    console.error('Usage: node scripts/blog-stage.mjs <working-doc.md> [--require <stage>]')
    return 2
  }

  let raw
  try {
    raw = fs.readFileSync(file, 'utf8')
  } catch {
    console.error(`  ✗ cannot read ${file}`)
    return 2
  }

  const { stages, current } = evaluate(raw)

  console.log(`\n  ${path.basename(file)}\n`)
  for (const s of stages) {
    const mark = s.done ? '✓' : s.awaitingApproval ? '!' : '·'
    const note = s.awaitingApproval
      ? '  written, AWAITING APPROVAL'
      : s.done
        ? ''
        : `  ← run ${s.skill}`
    console.log(`    ${mark} ${s.name.padEnd(11)}${note}`)
  }

  console.log(
    current
      ? `\n  next: ${current.skill}${current.awaitingApproval ? ' (needs human approval, not more writing)' : ''}\n`
      : '\n  pipeline complete through outline\n'
  )

  if (required) {
    const { unknown, missing } = blockers(raw, required)
    if (unknown) {
      console.error(`  ✗ unknown stage "${required}"`)
      return 2
    }
    if (missing.length) {
      console.error(`  ✗ ${required} is blocked by: ${missing.map((s) => s.name).join(', ')}`)
      console.error(`    run ${missing[0].skill} first\n`)
      return 1
    }
    console.log(`  ✓ ${required} is unblocked\n`)
  }

  return 0
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)
) {
  process.exit(main(process.argv.slice(2)))
}
