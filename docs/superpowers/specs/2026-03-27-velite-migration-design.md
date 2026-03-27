# Velite Migration Design

**Date:** 2026-03-27
**Status:** Approved

## Problem

The site uses `contentlayer2` (community fork of the abandoned Contentlayer project) as its content pipeline. Node 22+ removed support for the `assert` keyword in import statements, which Contentlayer relies on internally. This produces a `SyntaxError: Unexpected identifier 'assert'` at build time, making the site unbuildable on modern Node versions.

## Goals

- Replace `contentlayer2` / `next-contentlayer2` with Velite
- Remove the `pliny` dependency entirely
- Delete unused template features (analytics, comments, search, newsletter, tags, drafts)
- Produce a leaner, self-contained codebase the owner fully understands and controls

## Out of Scope

- UI redesign
- Migrating MDX post content
- Adding new features

---

## Architecture Overview

The migration has two parallel tracks executed together.

### Track A — Content Pipeline (Contentlayer → Velite)

- Delete `contentlayer.config.ts`, add `velite.config.ts`
- Replace the `withContentlayer` wrapper in `next.config.js` with `VeliteWebpackPlugin` added inside the existing `webpack` callback
- Velite generates `.velite/` with typed exports — `blogs` and `authors` collections replace `allBlogs` / `allAuthors` / `Blog` / `Authors` from `contentlayer/generated`
- Full remark/rehype plugin pipeline carries over into `velite.config.ts`
- Add `lib/content-utils.ts` (~15 lines) to replace pliny's content utilities
- Tag count generation (`createTagCount`) and search index generation (`createSearchIndex`) are both deleted — no `complete` hook needed

### Track B — Pliny Removal + Dead Feature Deletion

All pliny imports are replaced with custom equivalents or deleted outright. The replacements are small enough to inline — no new third-party libraries needed.

---

## Velite Configuration

### Blog Collection Schema

| Field | Velite Type | Notes |
|---|---|---|
| `title` | `s.string()` | required |
| `date` | `s.isodate()` | required |
| `lastmod` | `s.isodate().optional()` | |
| `summary` | `s.string().optional()` | |
| `images` | `s.array(s.string()).optional()` | |
| `authors` | `s.array(s.string()).optional()` | |
| `layout` | `s.string().optional()` | |
| `bibliography` | `s.string().optional()` | |
| `body` | `s.mdx()` | compiled MDX |
| `toc` | `s.toc()` | structured `{ title, url, depth }[]` |
| `readingTime` | computed in `transform` | via `reading-time` package |
| `slug` | computed in `transform` | derived from `_meta.path` |
| `path` | computed in `transform` | derived from `_meta.path` |

**Removed from schema:** `tags`, `draft`, `structuredData`, `filePath`, `canonicalUrl`

**Draft removal note:** Draft support is removed entirely by dropping the `draft` field from the schema. Any `.filter(p => !p.draft)` call sites in page files must also be removed — no separate files need to be deleted.

### Authors Collection Schema

All fields `s.string().optional()` except `name` (`s.string()` required): `name`, `avatar`, `occupation`, `company`, `email`, `twitter`, `linkedin`, `github`, `layout`. Computed: `slug`, `path`.

### MDX Plugin Pipeline

**Remark:** `remarkGfm`, `remarkMath`, `remarkCodeTitles`

**Rehype:** `rehypeSlug`, `rehypeAutolinkHeadings` (with existing heroicon SVG), `rehypeKatex`, `rehypeCitation`, `rehypePrismPlus`, `rehypePresetMinify`

**Dropped remark plugins:** `remarkExtractFrontmatter` (Velite handles frontmatter natively), `remarkImgToJsx` (replaced by standard Next.js `<Image>` in MDX)

---

## New Files

### `lib/content-utils.ts`

Replaces `pliny/utils/contentlayer`. Exports:

- `sortPosts(posts)` — sort array by `date` descending
- `allCoreContent(posts)` — map posts stripping `body` field (for list views)
- `coreContent(post)` — strip `body` from a single post
- `CoreContent<T>` — type alias `Omit<T, 'body'>`

### `velite.config.ts`

The core Velite configuration file. Defines `blogs` and `authors` collections using `defineCollection`, configures the MDX plugin pipeline (see schema tables above), and exports the config via `defineConfig`. The `blogs` collection uses a `transform` function to compute `readingTime`, `slug`, and `path` from each document's `_meta`.

### `components/MDXContent.tsx`

Replaces `pliny/mdx-components` `MDXLayoutRenderer`. Uses Velite's `useMDXComponent` hook (from `velite/client`) to turn Velite's compiled MDX `code` string into a renderable React component. Accepts `code: string` and `components: MDXComponents` props — identical call signature to what layouts already use.

### `components/TOC.tsx`

Replaces `pliny/ui/TOCInline`. Renders Velite's structured `toc` array (`{ title, url, depth }[]`) as a nested list. Small, typed, no runtime parsing needed.

### `components/Pre.tsx`

Replaces `pliny/ui/Pre`. Client component wrapping `<pre>` with a copy-to-clipboard button. Uses the Clipboard API.

---

## Files Deleted

| File | Reason |
|---|---|
| `contentlayer.config.ts` | Replaced by `velite.config.ts` |
| `app/tags/` (entire directory) | Tag system removed |
| `app/tag-data.json` | Tag count artifact — tag system removed |
| `app/api/newsletter/route.ts` | Newsletter removed |
| `components/KBarCustomSearchProvider.tsx` | Search removed |
| `components/SearchButton.tsx` | Search removed |
| `components/Comments.tsx` | Comments removed (never active — empty giscus env vars) |
| `layouts/ListLayoutWithTags.tsx` | Tag system removed |

---

## Modified Files

| File | Changes |
|---|---|
| `next.config.js` | Remove `withContentlayer`; add `VeliteWebpackPlugin` in webpack callback; clean up CSP (remove giscus, umami, convertkit domains) |
| `app/layout.tsx` | Remove `Analytics`, `SearchProvider`, `pliny/search/algolia.css` |
| `app/page.tsx` | Update content imports; update utility imports |
| `app/blog/page.tsx` | Update content imports; update utility imports |
| `app/blog/page/[page]/page.tsx` | Update content imports; update utility imports |
| `app/blog/[...slug]/page.tsx` | Update imports; swap `MDXLayoutRenderer` → `MDXContent`; remove JSON-LD block |
| `app/about/page.tsx` | Update imports; swap `MDXLayoutRenderer` → `MDXContent` |
| `app/sitemap.ts` | Update content import |
| `layouts/PostLayout.tsx` | Update imports; remove tag rendering; remove Comments |
| `layouts/PostSimple.tsx` | Update imports; remove tag rendering; remove Comments |
| `layouts/PostBanner.tsx` | Update imports; remove tag rendering; remove Comments |
| `layouts/AuthorLayout.tsx` | Update type import; swap `MDXLayoutRenderer` → `MDXContent` |
| `layouts/ListLayout.tsx` | Update imports; remove tag rendering |
| `components/MDXComponents.tsx` | Replace `TOCInline` / `Pre` / `BlogNewsletterForm` with custom components |
| `components/Header.tsx` | Remove `SearchButton` import and render call |
| `components/ScrollTopAndComment.tsx` | Strip comment-scroll button; keep scroll-to-top only |
| `siteMetadata.js` | Remove `analytics`, `comments`, `search`, `newsletter` keys; remove `PlinyConfig` type annotation |

---

## Dependency Changes

**Remove:**
- `contentlayer` (original, present in package.json alongside the fork)
- `contentlayer2`
- `next-contentlayer2`
- `pliny`

**Add:**
- `velite`

**Already present (no action needed):**
- `reading-time` — already in `dependencies`, used by the `readingTime` transform in `velite.config.ts`

---

## What Is Preserved

- All 42 MDX blog posts — no content changes
- Full remark/rehype plugin pipeline (GFM, math/KaTeX, citations, Prism, TOC, reading time, auto-linked headings)
- Three post layouts (PostLayout, PostSimple, PostBanner)
- Author profiles
- Tailwind CSS + dark mode
- Vercel deployment — no configuration changes needed
