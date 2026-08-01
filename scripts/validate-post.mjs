#!/usr/bin/env node
/**
 * Pre-flight validation for blog posts in data/blog.
 *
 * Exists because the highest-impact failure mode here is silent: MDX parses a raw `<`
 * in the body as the start of a JSX tag, and the post vanishes from the site without a
 * build error. Velite's schema type-checks frontmatter but never inspects the body, so
 * nothing else in the pipeline catches it. See commit 974922b, where a legacy SICI DOI
 * (`...18:7<509::AID-SMJ882>3.0.CO;2-Z`) did exactly that.
 *
 * Usage:  node scripts/validate-post.mjs data/blog/2026/*.mdx
 * Exits 1 if any error-severity finding is present. Warnings never fail the run.
 */

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

/**
 * Capitalized components available to MDX bodies, from components/MDXComponents.tsx.
 *
 * JSX resolves a capitalized name as a variable reference, so anything not in this set
 * is undefined at render time. Lowercase names are intrinsic HTML elements and need no
 * declaration — see HTML_ELEMENTS.
 */
export const MDX_COMPONENTS = new Set(['Image', 'TOCInline'])

/** Lowercase tags MDX passes straight through to HTML. */
export const HTML_ELEMENTS = new Set([
  'a',
  'abbr',
  'address',
  'article',
  'aside',
  'audio',
  'b',
  'blockquote',
  'br',
  'button',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'dd',
  'del',
  'details',
  'dfn',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'li',
  'main',
  'mark',
  'nav',
  'ol',
  'p',
  'picture',
  'pre',
  'q',
  's',
  'samp',
  'section',
  'small',
  'source',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
])

/** Frontmatter keys the Velite schema accepts. Anything else is silently stripped. */
export const SCHEMA_KEYS = new Set([
  'title',
  'date',
  'lastmod',
  'summary',
  'images',
  'authors',
  'layout',
  'bibliography',
  'draft',
])

/** Keys inherited from the starter template that no longer do anything. */
export const DEAD_KEYS = new Set(['tags'])

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Check a frontmatter date field against what Velite actually accepts.
 *
 * s.isodate() is:
 *   stringType().refine(v => !isNaN(Date.parse(v))).transform(v => new Date(v).toISOString())
 *
 * So the only hard requirement is that Date.parse succeeds — '2024-06-04 00:00:00' is
 * accepted and normalized, as three of the 2024 posts demonstrate. Anything parseable but
 * not plain YYYY-MM-DD is a house-style nudge, not a build failure. Being stricter here
 * than the schema would flag working posts, which is how a validator gets ignored.
 */
function checkDate(value, field) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? finding('error', 'date-format', 1, `\`${field}\` is not a parseable date.`)
      : finding(
          'warn',
          'unquoted-date',
          1,
          `\`${field}\` is unquoted, so YAML parsed it as a timestamp rather than a string.`,
          `Quote it as '${value.toISOString().slice(0, 10)}' to match the other posts.`
        )
  }

  const text = String(value)

  if (ISO_DATE.test(text)) return null

  if (Number.isNaN(Date.parse(text))) {
    return finding(
      'error',
      'date-format',
      1,
      `\`${field}\` is "${text}", which Date.parse cannot read; s.isodate() rejects it.`,
      'Use YYYY-MM-DD.'
    )
  }

  return finding(
    'warn',
    'nonstandard-date',
    1,
    `\`${field}\` is "${text}". Velite accepts it and normalizes to ISO, but posts here use YYYY-MM-DD.`,
    `Consider '${new Date(text).toISOString().slice(0, 10)}'.`
  )
}

/**
 * Blank out fenced code blocks, inline code spans, and the frontmatter block, replacing
 * them with empty or space-filled lines.
 *
 * Returns an array parallel to the source lines so a finding's index is still its real
 * line number. Masking rather than deleting is what keeps the reported line numbers
 * honest in a 300-line essay.
 */
export function maskNonProse(raw) {
  const lines = raw.split('\n')
  const masked = []

  let inFence = false
  let inFrontmatter = false
  let seenFrontmatterStart = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Frontmatter: only when `---` is the very first line of the file.
    if (i === 0 && line.trim() === '---') {
      inFrontmatter = true
      seenFrontmatterStart = true
      masked.push('')
      continue
    }
    if (inFrontmatter) {
      if (line.trim() === '---') inFrontmatter = false
      masked.push('')
      continue
    }

    // Fenced code blocks (``` or ~~~), including the fence lines themselves.
    if (/^\s*(```+|~~~+)/.test(line)) {
      inFence = !inFence
      masked.push('')
      continue
    }
    if (inFence) {
      masked.push('')
      continue
    }

    // Inline code spans, space-filled to preserve column positions.
    masked.push(line.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length)))
  }

  void seenFrontmatterStart
  return masked
}

function finding(severity, rule, line, message, hint) {
  return { severity, rule, line, message, ...(hint ? { hint } : {}) }
}

/**
 * Validate a single post.
 *
 * @param {object} opts
 * @param {string} opts.raw        Full file contents, frontmatter included.
 * @param {string} opts.filePath   Path used for the year-directory check and reporting.
 * @param {Set<string>} [opts.knownAuthors] Author slugs that exist in data/authors.
 * @returns {Array<{severity:string, rule:string, line:number, message:string, hint?:string}>}
 */
export function validatePost({ raw, filePath, knownAuthors }) {
  const findings = []

  // ---- Frontmatter -------------------------------------------------------------
  let data = {}
  try {
    data = matter(raw).data ?? {}
  } catch (err) {
    findings.push(
      finding('error', 'frontmatter-parse', 1, `Frontmatter is not valid YAML: ${err.message}`)
    )
    return findings
  }

  if (!data.title) {
    findings.push(
      finding(
        'error',
        'required-field',
        1,
        'Missing `title`. Velite requires it; the build fails without it.'
      )
    )
  }

  if (!data.date) {
    findings.push(
      finding(
        'error',
        'required-field',
        1,
        'Missing `date`. Velite requires it; the build fails without it.'
      )
    )
  } else {
    const dateFinding = checkDate(data.date, 'date')
    if (dateFinding) findings.push(dateFinding)
  }

  if (data.lastmod) {
    const lastmodFinding = checkDate(data.lastmod, 'lastmod')
    if (lastmodFinding) findings.push(lastmodFinding)
  }

  if (!data.summary) {
    findings.push(
      finding(
        'warn',
        'missing-summary',
        1,
        'No `summary`. Post listings will have nothing to show.'
      )
    )
  }

  // Year directory is convention only — the schema derives slug from the path and does
  // not care, so a mismatch is a tidiness issue rather than a break.
  const isoDate =
    data.date instanceof Date
      ? Number.isNaN(data.date.getTime())
        ? null
        : data.date.toISOString().slice(0, 10)
      : ISO_DATE.test(String(data.date))
        ? String(data.date)
        : null

  if (isoDate) {
    const dirYear = path.basename(path.dirname(filePath))
    const dateYear = isoDate.slice(0, 4)
    if (/^\d{4}$/.test(dirYear) && dirYear !== dateYear) {
      findings.push(
        finding('warn', 'year-mismatch', 1, `File sits in ${dirYear}/ but \`date\` is ${dateYear}.`)
      )
    }
  }

  if (knownAuthors && Array.isArray(data.authors)) {
    for (const author of data.authors) {
      if (!knownAuthors.has(author)) {
        findings.push(
          finding(
            'error',
            'unknown-author',
            1,
            `Author "${author}" has no file in data/authors/. The byline will render broken.`
          )
        )
      }
    }
  }

  // Held-back posts are legitimate, but it is worth saying out loud — a draft that was
  // meant to ship looks identical to one that was not.
  if (data.draft === true) {
    findings.push(
      finding(
        'warn',
        'draft-post',
        1,
        '`draft: true` — this post is excluded from listings, its own route, the sitemap, and RSS.',
        'Set it to false (or remove the key) when you are ready to publish.'
      )
    )
  }

  for (const key of Object.keys(data)) {
    if (DEAD_KEYS.has(key)) {
      findings.push(
        finding(
          'warn',
          'dead-frontmatter',
          1,
          `\`${key}:\` is not in the Velite schema and is not read anywhere in the codebase.`,
          'Silently stripped at build time; the tag UI was removed.'
        )
      )
    } else if (!SCHEMA_KEYS.has(key)) {
      findings.push(
        finding(
          'warn',
          'unknown-frontmatter',
          1,
          `\`${key}:\` is not in the Velite schema and will be stripped.`
        )
      )
    }
  }

  // ---- Body --------------------------------------------------------------------
  const lines = maskNonProse(raw)

  lines.forEach((line, idx) => {
    const lineNo = idx + 1

    // HTML comments are not valid in MDX v2+.
    let commentAt = line.indexOf('<!--')
    if (commentAt !== -1) {
      findings.push(
        finding(
          'error',
          'html-comment',
          lineNo,
          'HTML comment `<!--` is not valid MDX and will break the build.',
          'Use an MDX expression comment instead: {/* ... */}'
        )
      )
    }

    for (let col = 0; col < line.length; col++) {
      if (line[col] !== '<') continue
      if (line.startsWith('<!--', col)) continue // already reported above

      const rest = line.slice(col)
      const tag = rest.match(/^<\/?([A-Za-z][A-Za-z0-9.]*)/)
      const name = tag?.[1]

      // JSX semantics: lowercase resolves to an intrinsic HTML element, capitalized
      // resolves to a variable that must be in scope.
      if (name && HTML_ELEMENTS.has(name)) continue
      if (name && MDX_COMPONENTS.has(name)) continue

      const excerpt = rest.slice(0, 60).trimEnd()
      const inDoi = /https?:\/\/(dx\.)?doi\.org\/\S*$/.test(line.slice(0, col))
      const isComponentName = name && /^[A-Z]/.test(name)

      if (inDoi) {
        findings.push(
          finding(
            'error',
            'doi-encoding',
            lineNo,
            `Unencoded angle bracket inside a DOI: ${excerpt}`,
            'Percent-encode it: `<` becomes %3C and `>` becomes %3E. Legacy SICI DOIs hit this routinely.'
          )
        )
      } else if (isComponentName) {
        findings.push(
          finding(
            'error',
            'undefined-component',
            lineNo,
            `\`<${name}>\` is capitalized, so MDX resolves it as a component — but it is not provided: ${excerpt}`,
            `components/MDXComponents.tsx provides only: ${[...MDX_COMPONENTS].join(', ')}.`
          )
        )
      } else if (name) {
        findings.push(
          finding(
            'error',
            'unknown-element',
            lineNo,
            `\`<${name}>\` is not a known HTML element: ${excerpt}`,
            'If this is prose rather than a tag, escape it as \\< or wrap it in backticks.'
          )
        )
      } else {
        findings.push(
          finding(
            'error',
            'raw-angle-bracket',
            lineNo,
            `Raw \`<\` in prose will be parsed as JSX and silently drop this post: ${excerpt}`,
            'Escape as \\<, wrap it in backticks, or percent-encode it if part of a URL.'
          )
        )
      }
    }
  })

  return findings
}

/** Read the author slugs that actually exist, so the author check has real data. */
export function readKnownAuthors(authorsDir) {
  try {
    return new Set(
      fs
        .readdirSync(authorsDir)
        .filter((f) => f.endsWith('.mdx'))
        .map((f) => f.replace(/\.mdx$/, ''))
    )
  } catch {
    return undefined
  }
}

// ---- CLI -----------------------------------------------------------------------

function main(argv) {
  const files = argv.filter((a) => !a.startsWith('-'))

  if (files.length === 0) {
    console.error('Usage: node scripts/validate-post.mjs <file.mdx> [...]')
    return 2
  }

  const knownAuthors = readKnownAuthors(path.join(process.cwd(), 'data', 'authors'))

  let errors = 0
  let warnings = 0

  for (const file of files) {
    let raw
    try {
      raw = fs.readFileSync(file, 'utf8')
    } catch {
      console.error(`  ✗ ${file}: cannot read file`)
      errors++
      continue
    }

    const findings = validatePost({ raw, filePath: file, knownAuthors })
    const fileErrors = findings.filter((f) => f.severity === 'error')
    const fileWarnings = findings.filter((f) => f.severity === 'warn')

    errors += fileErrors.length
    warnings += fileWarnings.length

    if (findings.length === 0) {
      console.log(`  ✓ ${file}`)
      continue
    }

    console.log(`\n  ${fileErrors.length ? '✗' : '!'} ${file}`)
    for (const f of findings) {
      const mark = f.severity === 'error' ? 'ERROR' : 'warn '
      console.log(`      ${mark} ${f.rule} (line ${f.line})`)
      console.log(`            ${f.message}`)
      if (f.hint) console.log(`            → ${f.hint}`)
    }
  }

  console.log(`\n  ${files.length} file(s): ${errors} error(s), ${warnings} warning(s)\n`)

  return errors > 0 ? 1 : 0
}

// Only run the CLI when executed directly, so tests can import the module cleanly.
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)
) {
  process.exit(main(process.argv.slice(2)))
}
