/**
 * Tests for scripts/blog-stage.mjs
 *
 * The case that matters most is the gated stage: a Thesis section can exist while approval
 * has not happened. If the script treated written prose as sign-off, the one human gate in
 * the pipeline would enforce nothing.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { evaluate, blockers, headings, checkboxes, STAGES } from './blog-stage.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const doc = (sections, stageBlock = '') => `# Post\n\n${stageBlock}\n${sections.join('\n\n')}\n`
const section = (name) => `## ${name}\n\nbody text`

const stageBlock = (ticked = []) =>
  '## Stage\n\n' +
  STAGES.map((s) => {
    const label = s.name[0].toUpperCase() + s.name.slice(1)
    const gate = s.gated ? ' _(gate — human approval)_' : ''
    return `- [${ticked.includes(s.name) ? 'x' : ' '}] ${label}${gate}`
  }).join('\n')

describe('parsing', () => {
  test('reads H2 headings only', () => {
    const raw = '# Title\n## Hypothesis\n### Sub\n## Findings\n'
    assert.deepEqual(headings(raw), ['hypothesis', 'findings'])
  })

  test('reads checkbox state', () => {
    const raw = '- [x] Hypothesis\n- [ ] Thesis\n'
    assert.deepEqual(checkboxes(raw), { hypothesis: true, thesis: false })
  })

  test('tolerates trailing annotations on a checkbox label', () => {
    // The template annotates the gate; the parser must still key on the stage name.
    const raw = '- [ ] Thesis _(gate — human approval)_\n'
    assert.equal(checkboxes(raw).thesis, false)
  })
})

describe('stage evaluation', () => {
  test('an empty doc starts at hypothesis', () => {
    const { current } = evaluate(doc([]))
    assert.equal(current.name, 'hypothesis')
    assert.equal(current.skill, 'blog-hypothesis')
  })

  test('hypothesis alone advances to research', () => {
    const { current } = evaluate(doc([section('Hypothesis')], stageBlock(['hypothesis'])))
    assert.equal(current.name, 'research')
  })

  test('findings advance to thesis', () => {
    const raw = doc([section('Hypothesis'), section('Findings')], stageBlock(['hypothesis']))
    assert.equal(evaluate(raw).current.name, 'thesis')
  })
})

describe('the thesis gate', () => {
  const written = doc(
    [section('Hypothesis'), section('Findings'), section('Thesis')],
    stageBlock(['hypothesis'])
  )

  test('a written but unapproved thesis does not count as done', () => {
    const thesis = evaluate(written).stages.find((s) => s.name === 'thesis')

    assert.equal(thesis.hasSection, true, 'section was written')
    assert.equal(thesis.approved, false, 'but never approved')
    assert.equal(thesis.done, false, 'so the stage is not complete')
    assert.equal(thesis.awaitingApproval, true)
  })

  test('an unapproved thesis blocks the outline', () => {
    const { missing } = blockers(written, 'outline')
    assert.deepEqual(
      missing.map((s) => s.name),
      ['thesis']
    )
  })

  test('ticking the box releases the gate', () => {
    const approved = doc(
      [section('Hypothesis'), section('Findings'), section('Thesis')],
      stageBlock(['hypothesis', 'thesis'])
    )

    assert.equal(evaluate(approved).current.name, 'outline')
    assert.deepEqual(blockers(approved, 'outline').missing, [])
  })
})

describe('blockers', () => {
  test('names every unmet prerequisite, earliest first', () => {
    const { missing } = blockers(doc([]), 'outline')
    assert.deepEqual(
      missing.map((s) => s.name),
      ['hypothesis', 'research', 'thesis']
    )
  })

  test('reports an unknown stage rather than passing it', () => {
    assert.equal(blockers(doc([]), 'nonsense').unknown, true)
  })

  test('a fully staged doc blocks nothing', () => {
    const raw = doc(
      [section('Hypothesis'), section('Findings'), section('Thesis'), section('Outline')],
      stageBlock(['hypothesis', 'thesis'])
    )
    assert.deepEqual(blockers(raw, 'draft').missing, [])
  })
})

describe('real working docs', () => {
  // Both predate the pipeline. They must degrade gracefully rather than throw — a legacy
  // doc should be reported as mid-pipeline, not treated as corrupt.
  const legacy = fs
    .readdirSync(path.join(repoRoot, 'docs', 'research'))
    .filter((f) => f.endsWith('.md'))

  test('finds the existing research docs', () => {
    assert.ok(legacy.length >= 1, 'expected at least one working doc')
  })

  for (const file of legacy) {
    test(`${file} evaluates without throwing`, () => {
      const raw = fs.readFileSync(path.join(repoRoot, 'docs', 'research', file), 'utf8')
      const { stages, current } = evaluate(raw)

      assert.equal(stages.length, STAGES.length)
      // Pre-pipeline docs have Findings but no Hypothesis section, so they report as
      // needing the hypothesis backfilled — correct, and better than silently passing.
      assert.ok(current === null || typeof current.skill === 'string')
    })
  }
})
