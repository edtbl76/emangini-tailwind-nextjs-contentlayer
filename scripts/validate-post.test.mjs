/**
 * Tests for scripts/validate-post.mjs
 *
 * Run: node --test scripts/
 *
 * The two tests that matter most are the DOI regression (the bug that actually shipped,
 * fixed in 974922b) and the false-positive guards. A validator that flags every code
 * sample in a technical essay is worse than no validator, because it trains you to
 * ignore it.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { validatePost, maskNonProse, readKnownAuthors } from './validate-post.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const errorsOf = (findings) => findings.filter((f) => f.severity === 'error')
const rulesOf = (findings) => findings.map((f) => f.rule)

/** Minimal valid post, so each test isolates the one thing it is checking. */
function post(body, frontmatter = '') {
  return `---
title: 'Test Post'
date: '2026-01-15'
summary: 'A summary.'
${frontmatter}---

${body}
`
}

describe('DOI encoding — the regression from commit 974922b', () => {
  // The exact line that shipped broken.
  const brokenDoi =
    'Teece, D. J., Pisano, G., & Shuen, A. (1997). Dynamic capabilities and strategic management. Strategic Management Journal, 18(7), 509–533. https://doi.org/10.1002/(SICI)1097-0266(199708)18:7<509::AID-SMJ882>3.0.CO;2-Z'

  test('flags the unencoded SICI DOI as an error', () => {
    const findings = validatePost({ raw: post(brokenDoi), filePath: 'data/blog/2026/x.mdx' })
    const errors = errorsOf(findings)

    assert.equal(errors.length, 1, 'expected exactly one error')
    assert.equal(errors[0].rule, 'doi-encoding')
    assert.match(errors[0].hint, /%3C/)
  })

  test('accepts the percent-encoded DOI that fixed it', () => {
    const fixedDoi = brokenDoi.replace('<', '%3C').replace('>', '%3E')
    const findings = validatePost({ raw: post(fixedDoi), filePath: 'data/blog/2026/x.mdx' })

    assert.deepEqual(errorsOf(findings), [], 'encoded DOI must be clean')
  })
})

describe('raw angle brackets in prose', () => {
  test('flags a bare `<` that would silently drop the post', () => {
    const findings = validatePost({
      raw: post('Latency stayed < 100ms under load.'),
      filePath: 'data/blog/2026/x.mdx',
    })
    const errors = errorsOf(findings)

    assert.equal(errors.length, 1)
    assert.equal(errors[0].rule, 'raw-angle-bracket')
  })

  test('flags a capitalized component that MDX cannot resolve', () => {
    const findings = validatePost({
      raw: post('<Callout>Not a real component.</Callout>'),
      filePath: 'data/blog/2026/x.mdx',
    })
    const errors = errorsOf(findings)

    assert.ok(errors.length >= 1)
    assert.equal(errors[0].rule, 'undefined-component')
    assert.match(errors[0].message, /Callout/)
  })

  test('allows components that MDXComponents actually provides', () => {
    const findings = validatePost({
      raw: post('<Image src="/x.png" alt="x" />\n\n<TOCInline toc={props.toc} />'),
      filePath: 'data/blog/2026/x.mdx',
    })

    assert.deepEqual(errorsOf(findings), [])
  })

  test('allows lowercase HTML that MDX passes straight through', () => {
    const findings = validatePost({
      raw: post('<div className="x">\n  <video><source src="/a.mp4" /></video>\n</div>'),
      filePath: 'data/blog/2026/x.mdx',
    })

    assert.deepEqual(errorsOf(findings), [], 'intrinsic HTML elements are always valid JSX')
  })

  test('flags a lowercase name that is not a real HTML element', () => {
    // The silent-drop bug in disguise: prose where `<` happens to precede a letter.
    const findings = validatePost({
      raw: post('Values under <yield are discarded.'),
      filePath: 'data/blog/2026/x.mdx',
    })
    const errors = errorsOf(findings)

    assert.equal(errors.length, 1)
    assert.equal(errors[0].rule, 'unknown-element')
  })

  test('flags HTML comments, which MDX v2 rejects', () => {
    const findings = validatePost({
      raw: post('<!-- a note to self -->'),
      filePath: 'data/blog/2026/x.mdx',
    })
    const errors = errorsOf(findings)

    assert.ok(errors.some((f) => f.rule === 'html-comment'))
    assert.match(errors.find((f) => f.rule === 'html-comment').hint, /\{\/\*/)
  })

  test('reports the correct line number in a multi-line body', () => {
    const body = ['Intro paragraph.', '', 'Second paragraph.', '', 'Here is a < problem.'].join('\n')
    const findings = validatePost({ raw: post(body), filePath: 'data/blog/2026/x.mdx' })
    const errors = errorsOf(findings)

    assert.equal(errors.length, 1)
    // Frontmatter is 6 lines (--- through ---), then a blank, then the body starts at 8.
    const lines = post(body).split('\n')
    assert.equal(lines[errors[0].line - 1], 'Here is a < problem.')
  })
})

describe('false-positive guards', () => {
  test('ignores `<` inside a fenced code block', () => {
    const body = ['Some prose.', '', '```ts', 'if (a < b) return <Foo />', '```', '', 'More prose.'].join(
      '\n'
    )
    const findings = validatePost({ raw: post(body), filePath: 'data/blog/2026/x.mdx' })

    assert.deepEqual(errorsOf(findings), [], 'code fences must be exempt')
  })

  test('ignores `<` inside an inline code span', () => {
    const findings = validatePost({
      raw: post('Use the `a < b` comparison, or `<div>` directly.'),
      filePath: 'data/blog/2026/x.mdx',
    })

    assert.deepEqual(errorsOf(findings), [])
  })

  test('ignores `<` appearing in frontmatter values', () => {
    const findings = validatePost({
      raw: post('Clean body.', "images: ['/a<b.png']\n"),
      filePath: 'data/blog/2026/x.mdx',
    })

    assert.deepEqual(errorsOf(findings), [])
  })

  test('does not flag a bare `>` used as a markdown blockquote', () => {
    const findings = validatePost({
      raw: post('> A quoted line.\n> And another.'),
      filePath: 'data/blog/2026/x.mdx',
    })

    assert.deepEqual(errorsOf(findings), [])
  })
})

describe('frontmatter rules', () => {
  test('errors when title is missing', () => {
    const raw = "---\ndate: '2026-01-15'\n---\n\nBody.\n"
    const findings = validatePost({ raw, filePath: 'data/blog/2026/x.mdx' })

    assert.ok(rulesOf(errorsOf(findings)).includes('required-field'))
  })

  test('errors when date is missing', () => {
    const raw = "---\ntitle: 'X'\n---\n\nBody.\n"
    const findings = validatePost({ raw, filePath: 'data/blog/2026/x.mdx' })

    assert.ok(rulesOf(errorsOf(findings)).includes('required-field'))
  })

  test('errors on a non-ISO date string', () => {
    const raw = "---\ntitle: 'X'\ndate: 'July 17, 2026'\n---\n\nBody.\n"
    const findings = validatePost({ raw, filePath: 'data/blog/2026/x.mdx' })
    const errors = errorsOf(findings)

    assert.ok(rulesOf(errors).includes('date-format'))
  })

  test('warns rather than errors on an unquoted YAML timestamp', () => {
    // YAML parses this into a Date before we see it — a valid date, just not verbatim.
    const raw = "---\ntitle: 'X'\ndate: 2021-08-07T15:32:14Z\n---\n\nBody.\n"
    const findings = validatePost({ raw, filePath: 'data/blog/2021/x.mdx' })

    assert.deepEqual(errorsOf(findings), [], 'a real date must not be an error')
    const warn = findings.find((f) => f.rule === 'unquoted-date')
    assert.ok(warn, 'should nudge toward quoting')
    assert.match(warn.hint, /'2021-08-07'/)
  })

  test('still derives the year from an unquoted date for the directory check', () => {
    const raw = "---\ntitle: 'X'\ndate: 2021-08-07T15:32:14Z\n---\n\nBody.\n"
    const findings = validatePost({ raw, filePath: 'data/blog/2019/x.mdx' })

    assert.ok(rulesOf(findings).includes('year-mismatch'))
  })

  test('errors on an author with no file in data/authors', () => {
    const raw = "---\ntitle: 'X'\ndate: '2026-01-15'\nauthors: ['nobody']\n---\n\nBody.\n"
    const findings = validatePost({
      raw,
      filePath: 'data/blog/2026/x.mdx',
      knownAuthors: new Set(['default']),
    })

    assert.ok(rulesOf(errorsOf(findings)).includes('unknown-author'))
  })

  test('accepts an author that does exist', () => {
    const raw = "---\ntitle: 'X'\ndate: '2026-01-15'\nauthors: ['default']\n---\n\nBody.\n"
    const findings = validatePost({
      raw,
      filePath: 'data/blog/2026/x.mdx',
      knownAuthors: new Set(['default']),
    })

    assert.deepEqual(errorsOf(findings), [])
  })

  test('warns — never errors — on dead draft/tags frontmatter', () => {
    const findings = validatePost({
      raw: post('Body.', "draft: false\ntags: ['a']\n"),
      filePath: 'data/blog/2026/x.mdx',
    })

    assert.deepEqual(errorsOf(findings), [], 'dead keys must not fail a build')
    const dead = findings.filter((f) => f.rule === 'dead-frontmatter')
    assert.equal(dead.length, 2)
    assert.ok(dead.find((f) => f.message.includes('draft')).hint.includes('still publishes'))
  })

  test('warns on a year directory that disagrees with the date', () => {
    const findings = validatePost({ raw: post('Body.'), filePath: 'data/blog/2019/x.mdx' })

    assert.ok(rulesOf(findings).includes('year-mismatch'))
    assert.deepEqual(errorsOf(findings), [], 'a convention mismatch must not be fatal')
  })
})

describe('maskNonProse', () => {
  test('preserves line count so reported line numbers stay accurate', () => {
    const raw = post(['a', '```', 'code', '```', 'b'].join('\n'))
    assert.equal(maskNonProse(raw).length, raw.split('\n').length)
  })

  test('preserves column positions when masking inline code', () => {
    const [line] = maskNonProse('the `abc` end')
    assert.equal(line.length, 'the `abc` end'.length)
    assert.equal(line, 'the       end')
  })
})

describe('the real corpus', () => {
  const realPosts = ['2026', '2025'].flatMap((year) => {
    const dir = path.join(repoRoot, 'data', 'blog', year)
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => path.join(dir, f))
  })

  const knownAuthors = readKnownAuthors(path.join(repoRoot, 'data', 'authors'))

  test('finds all 6 published posts', () => {
    assert.equal(realPosts.length, 6)
  })

  for (const file of realPosts) {
    test(`${path.relative(repoRoot, file)} has zero errors`, () => {
      const raw = fs.readFileSync(file, 'utf8')
      const errors = errorsOf(validatePost({ raw, filePath: file, knownAuthors }))

      assert.deepEqual(
        errors,
        [],
        `false positive on a real post:\n${errors.map((e) => `  ${e.rule}: ${e.message}`).join('\n')}`
      )
    })
  }
})
