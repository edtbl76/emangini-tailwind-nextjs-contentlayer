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
    const body = ['Intro paragraph.', '', 'Second paragraph.', '', 'Here is a < problem.'].join(
      '\n'
    )
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
    const body = [
      'Some prose.',
      '',
      '```ts',
      'if (a < b) return <Foo />',
      '```',
      '',
      'More prose.',
    ].join('\n')
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

  test('errors only when Date.parse cannot read the date', () => {
    const raw = "---\ntitle: 'X'\ndate: 'sometime last autumn'\n---\n\nBody.\n"
    const findings = validatePost({ raw, filePath: 'data/blog/2026/x.mdx' })

    assert.ok(rulesOf(errorsOf(findings)).includes('date-format'))
  })

  test('warns — never errors — on a parseable non-ISO date', () => {
    // s.isodate() only requires Date.parse to succeed, then normalizes. Three of the 2024
    // posts use this exact shape and build fine; erroring here would flag working content.
    const raw = "---\ntitle: 'X'\ndate: '2024-06-04 00:00:00'\n---\n\nBody.\n"
    const findings = validatePost({ raw, filePath: 'data/blog/2024/x.mdx' })

    assert.deepEqual(errorsOf(findings), [], 'Velite accepts this, so we must too')
    const warn = findings.find((f) => f.rule === 'nonstandard-date')
    assert.ok(warn)
    assert.match(warn.hint, /2024-06-04/)
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

  test('warns — never errors — on dead tags frontmatter', () => {
    const findings = validatePost({
      raw: post('Body.', "tags: ['a']\n"),
      filePath: 'data/blog/2026/x.mdx',
    })

    assert.deepEqual(errorsOf(findings), [], 'dead keys must not fail a build')
    const dead = findings.filter((f) => f.rule === 'dead-frontmatter')
    assert.equal(dead.length, 1)
    assert.match(dead[0].message, /tags/)
  })

  test('treats draft as a real schema key, not dead frontmatter', () => {
    const findings = validatePost({
      raw: post('Body.', 'draft: false\n'),
      filePath: 'data/blog/2026/x.mdx',
    })

    assert.deepEqual(errorsOf(findings), [])
    assert.equal(
      findings.filter((f) => f.rule === 'dead-frontmatter').length,
      0,
      'draft is honored by publishedPosts() and belongs to the schema'
    )
    assert.equal(findings.filter((f) => f.rule === 'draft-post').length, 0)
  })

  test('warns that a draft post will not appear on the site', () => {
    const findings = validatePost({
      raw: post('Body.', 'draft: true\n'),
      filePath: 'data/blog/2026/x.mdx',
    })

    assert.deepEqual(errorsOf(findings), [], 'a draft is legitimate, not an error')
    const draft = findings.find((f) => f.rule === 'draft-post')
    assert.ok(draft, 'should say the post is held back')
    assert.match(draft.message, /excluded/)
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
  // Every year, not just the recent ones. Checking only 2025-2026 hid a false positive in
  // the 2024 posts for a full round of work — a rule is only trustworthy against all of it.
  const blogRoot = path.join(repoRoot, 'data', 'blog')
  const realPosts = fs
    .readdirSync(blogRoot)
    .filter((entry) => /^\d{4}$/.test(entry))
    .flatMap((year) =>
      fs
        .readdirSync(path.join(blogRoot, year))
        .filter((f) => f.endsWith('.mdx'))
        .map((f) => path.join(blogRoot, year, f))
    )

  const knownAuthors = readKnownAuthors(path.join(repoRoot, 'data', 'authors'))

  test('finds every published post', () => {
    assert.ok(realPosts.length >= 30, `expected the full corpus, saw ${realPosts.length}`)
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
