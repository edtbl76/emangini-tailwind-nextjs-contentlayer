# Velite Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the content pipeline from Contentlayer2 to Velite, remove the pliny dependency entirely, and delete unused template features (search, analytics, comments, newsletter, tags, drafts).

**Architecture:** Velite replaces Contentlayer as the MDX build tool — it reads the same `data/` directory and generates typed exports in `.velite/`. The pliny utility functions are replaced with ~15 lines of custom code in `lib/content-utils.ts`. Pliny UI components are replaced with small custom components. All dead features (search, analytics, comments, newsletter, tags) are deleted outright.

**Tech Stack:** Next.js 14, Velite, TypeScript, Tailwind CSS, remark/rehype plugin pipeline (GFM, math/KaTeX, citations, Prism)

**Spec:** `docs/superpowers/specs/2026-03-27-velite-migration-design.md`

---

## File Map

**Create:**
- `velite.config.ts` — Velite collection definitions + MDX plugin pipeline
- `lib/content-utils.ts` — `sortPosts`, `allCoreContent`, `coreContent`, `CoreContent<T>`
- `components/MDXContent.tsx` — renders Velite's compiled MDX via `velite/client`
- `components/TOC.tsx` — renders Velite's structured TOC array
- `components/Pre.tsx` — copy-to-clipboard code block wrapper

**Delete:**
- `contentlayer.config.ts`
- `app/tags/` (entire directory)
- `app/tag-data.json`
- `app/api/newsletter/route.ts`
- `components/KBarCustomSearchProvider.tsx`
- `components/SearchButton.tsx`
- `components/Comments.tsx`
- `layouts/ListLayoutWithTags.tsx`

**Modify:**
- `package.json` — swap dependencies
- `tsconfig.json` — add `.velite` path alias, remove contentlayer alias
- `.gitignore` — add `.velite/`
- `next.config.js` — swap plugin, clean CSP
- `siteMetadata.js` — remove dead feature config
- `app/layout.tsx` — remove Analytics + SearchProvider
- `app/page.tsx` — update imports
- `app/blog/page.tsx` — update imports
- `app/blog/page/[page]/page.tsx` — update imports
- `app/blog/[...slug]/page.tsx` — update imports + MDX renderer
- `app/about/page.tsx` — update imports + MDX renderer
- `app/sitemap.ts` — update import
- `layouts/PostLayout.tsx` — remove tags, comments
- `layouts/PostSimple.tsx` — remove tags, comments
- `layouts/PostBanner.tsx` — remove tags, comments
- `layouts/AuthorLayout.tsx` — update imports + MDX renderer
- `layouts/ListLayout.tsx` — remove tag rendering
- `components/MDXComponents.tsx` — replace pliny UI components
- `components/Header.tsx` — remove SearchButton
- `components/ScrollTopAndComment.tsx` — remove comment-scroll button

---

## Task 1: Update Dependencies and Project Config

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `.gitignore`

- [ ] **Step 1: Verify reading-time is installed**

```bash
grep '"reading-time"' package.json
```

Expected: a line like `"reading-time": "1.5.0"`. If missing, add it to the install command in the next step.

- [ ] **Step 2: Swap packages**

```bash
yarn remove contentlayer contentlayer2 next-contentlayer2 pliny
yarn add velite remark-code-titles
# Only add reading-time if the grep above returned nothing:
# yarn add reading-time
```

Expected: no install errors. Ignore TypeScript errors for now — imports will break until Task 9+.

- [ ] **Step 2: Update tsconfig.json paths**

In `tsconfig.json`, replace the `contentlayer/generated` path entry and add Velite's alias. The `paths` object should become:

```json
"paths": {
  "@/components/*": ["components/*"],
  "@/data/*": ["data/*"],
  "@/layouts/*": ["layouts/*"],
  "@/css/*": ["css/*"],
  "@/content": ["./.velite"]
}
```

Also update `include` — remove the `.contentlayer` entries and add `.velite`:

```json
"include": [
  "next-env.d.ts",
  "**/*.js",
  "**/*.mjs",
  "**/*.ts",
  "**/*.tsx",
  "**/*.json",
  ".velite",
  ".next/types/**/*.ts"
]
```

- [ ] **Step 3: Add .velite to .gitignore**

Add this line to `.gitignore`:
```
.velite
```

- [ ] **Step 4: Commit**

```bash
git add package.json tsconfig.json .gitignore yarn.lock
git commit -m "chore: swap contentlayer/pliny for velite, add remark-code-titles"
```

---

## Task 2: Create velite.config.ts

**Files:**
- Create: `velite.config.ts`
- Delete: `contentlayer.config.ts`

`★ Note:` This is the most critical file. The `transform` function receives `(data, { meta })` where `meta.path` is the relative path from the content root. If this API differs from what's shown, check Velite's docs at https://velite.js.org/guide/define-collections.

- [ ] **Step 1: Create velite.config.ts**

```typescript
import { defineConfig, defineCollection, s } from 'velite'
import readingTime from 'reading-time'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkCodeTitles from 'remark-code-titles'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypeCitation from 'rehype-citation'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypePresetMinify from 'rehype-preset-minify'
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'
import path from 'path'

const root = process.cwd()

const icon = fromHtmlIsomorphic(
  `<span class="content-header-link">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 linkicon">
  <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
  <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
  </svg>
  </span>`,
  { fragment: true }
)

const blogs = defineCollection({
  name: 'Blog',
  pattern: 'blog/**/*.mdx',
  schema: s
    .object({
      title: s.string(),
      date: s.isodate(),
      lastmod: s.isodate().optional(),
      summary: s.string().optional(),
      images: s.array(s.string()).optional(),
      authors: s.array(s.string()).optional(),
      layout: s.string().optional(),
      bibliography: s.string().optional(),
      body: s.mdx(),
      toc: s.toc(),
      raw: s.raw(),
    })
    .transform((data, { meta }) => {
      // NOTE: Velite's transform context shape — use `meta.path` if the second
      // argument destructures as `{ meta }`, or `data._meta.path` if Velite
      // exposes _meta directly on data. The Step 2 verification will confirm which.
      const { raw, ...rest } = data
      return {
        ...rest,
        slug: meta.path.replace(/^blog\//, ''),
        path: meta.path,
        readingTime: readingTime(raw),
      }
    }),
})

const authors = defineCollection({
  name: 'Authors',
  pattern: 'authors/**/*.mdx',
  schema: s
    .object({
      name: s.string(),
      avatar: s.string().optional(),
      occupation: s.string().optional(),
      company: s.string().optional(),
      email: s.string().optional(),
      twitter: s.string().optional(),
      linkedin: s.string().optional(),
      github: s.string().optional(),
      layout: s.string().optional(),
      body: s.mdx(),
    })
    .transform((data, { meta }) => ({
      ...data,
      slug: meta.path.replace(/^authors\//, ''),
      path: meta.path,
    })),
})

export default defineConfig({
  root: 'data',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:6][ext]',
    clean: true,
  },
  collections: { blogs, authors },
  mdx: {
    remarkPlugins: [remarkGfm, remarkMath, remarkCodeTitles],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'prepend',
          headingProperties: { className: ['content-header'] },
          content: icon,
        },
      ],
      rehypeKatex,
      [rehypeCitation, { path: path.join(root, 'data') }],
      [rehypePrismPlus, { defaultLanguage: 'js', ignoreMissing: true }],
      rehypePresetMinify,
    ],
  },
})
```

- [ ] **Step 2: Verify Velite can run**

```bash
npx velite build
```

Expected: `.velite/` directory created with `index.d.ts`, `blogs.json`, `authors.json`. If you get errors about the transform `meta` argument, check the Velite docs — the transform signature may be `(data, ctx)` where path is accessed as `ctx.meta.path` or `data._meta.path`.

- [ ] **Step 3: Delete contentlayer.config.ts**

```bash
git rm contentlayer.config.ts
```

- [ ] **Step 4: Commit**

```bash
git add velite.config.ts .velite/
git commit -m "feat: add velite.config.ts with blog and authors collections"
```

---

## Task 3: Create lib/content-utils.ts

**Files:**
- Create: `lib/content-utils.ts`

- [ ] **Step 1: Create the file**

```typescript
export type CoreContent<T> = Omit<T, 'body'>

export function sortPosts<T extends { date: string }>(posts: T[]): T[] {
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function allCoreContent<T extends { body: unknown }>(posts: T[]): CoreContent<T>[] {
  return posts.map(({ body: _body, ...rest }) => rest as CoreContent<T>)
}

export function coreContent<T extends { body: unknown }>(post: T): CoreContent<T> {
  const { body: _body, ...rest } = post
  return rest as CoreContent<T>
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: Errors only from files still importing from `contentlayer/generated` or `pliny` — those will be fixed in later tasks. No errors from `lib/content-utils.ts` itself.

- [ ] **Step 3: Commit**

```bash
git add lib/content-utils.ts
git commit -m "feat: add content-utils to replace pliny/utils/contentlayer"
```

---

## Task 4: Create components/MDXContent.tsx

**Files:**
- Create: `components/MDXContent.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useMDXComponent } from 'velite/client'
import type { MDXComponents } from 'mdx/types'

interface MDXContentProps {
  code: string
  components?: MDXComponents
  toc?: unknown // passed through to MDX context if needed; layouts receive toc via content prop
}

export default function MDXContent({ code, components }: MDXContentProps) {
  const Component = useMDXComponent(code)
  return <Component components={components} />
}
```

`★ Note:` If `velite/client` does not export `useMDXComponent`, check Velite's docs. The alternative is importing it from `next-mdx-remote` or using a bare Function-constructor pattern — but prefer Velite's built-in if available.

- [ ] **Step 2: Commit**

```bash
git add components/MDXContent.tsx
git commit -m "feat: add MDXContent component to replace pliny MDXLayoutRenderer"
```

---

## Task 5: Create components/TOC.tsx and components/Pre.tsx

**Files:**
- Create: `components/TOC.tsx`
- Create: `components/Pre.tsx`

- [ ] **Step 1: Create TOC.tsx**

Velite's `s.toc()` produces `{ title: string; url: string; depth: number }[]`.

```tsx
export interface TocEntry {
  title: string
  url: string
  depth: number
}

interface TOCProps {
  toc: TocEntry[]
}

export default function TOC({ toc }: TOCProps) {
  if (!toc.length) return null
  return (
    <div className="toc">
      <ul>
        {toc.map((entry) => (
          <li key={entry.url} style={{ paddingLeft: `${(entry.depth - 2) * 1}rem` }}>
            <a href={entry.url}>{entry.title}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Create Pre.tsx**

```tsx
'use client'
import { useRef, useState } from 'react'

export default function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const text = preRef.current?.textContent ?? ''
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="relative">
      <pre ref={preRef} {...props}>
        {children}
      </pre>
      <button
        aria-label="Copy code"
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-200 hover:bg-gray-600"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/TOC.tsx components/Pre.tsx
git commit -m "feat: add TOC and Pre components to replace pliny UI"
```

---

## Task 6: Delete Dead Files

**Files:** All files listed in the spec's "Files Deleted" table.

- [ ] **Step 1: Delete files**

```bash
git rm contentlayer.config.ts 2>/dev/null || true
git rm -r app/tags/
git rm app/tag-data.json
git rm app/api/newsletter/route.ts
git rm components/KBarCustomSearchProvider.tsx
git rm components/SearchButton.tsx
git rm components/Comments.tsx
git rm layouts/ListLayoutWithTags.tsx
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: delete dead features (tags, search, newsletter, comments)"
```

---

## Task 7: Update next.config.js and siteMetadata.js

**Files:**
- Modify: `next.config.js`
- Modify: `data/siteMetadata.js`

- [ ] **Step 1: Update next.config.js**

Replace the entire file with:

```javascript
const { VeliteWebpackPlugin } = require('velite/webpack')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src * blob: data:;
  media-src *.s3.amazonaws.com;
  connect-src *;
  font-src 'self';
`

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

/** @type {import('next/dist/next-server/server/config').NextConfig} **/
module.exports = () => {
  const plugins = [withBundleAnalyzer]
  return plugins.reduce((acc, next) => next(acc), {
    reactStrictMode: true,
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    eslint: {
      dirs: ['app', 'components', 'layouts', 'scripts'],
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'picsum.photos',
        },
      ],
    },
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: securityHeaders,
        },
      ]
    },
    webpack: (config) => {
      config.plugins.push(new VeliteWebpackPlugin())
      config.module.rules.push({
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      })
      return config
    },
  })
}
```

`★ Note:` If `velite/webpack` is not a valid import path, check Velite's Next.js docs. The plugin export may be at `'velite'` directly.

- [ ] **Step 2: Update siteMetadata.js**

Remove the `analytics`, `comments`, `search`, and `newsletter` keys, and remove the `PlinyConfig` type annotation comment. The file should become:

```javascript
const siteMetadata = {
  title: '@emangini.com',
  author: 'Edward Mangini',
  headerTitle: '@emangini',
  description:
    'This is where I unpack thoughts and research on technology, business and leadership.',
  language: 'en-us',
  theme: 'system',
  siteUrl: 'https://emangini.com',
  siteRepo: 'https://github.com/edtbl76/emangini-tailwind-nextjs-contentlayer',
  socialBanner: '/static/images/twitter-card.png',
  email: 'me@emangini.com',
  github: 'https://github.com/edtbl76',
  x: 'https://twitter.com/edward_mangini',
  linkedin: 'https://www.linkedin.com/in/edwardmangini',
  locale: 'en-US',
}

module.exports = siteMetadata
```

- [ ] **Step 3: Commit**

```bash
git add next.config.js data/siteMetadata.js
git commit -m "chore: swap contentlayer webpack plugin for velite, clean up siteMetadata"
```

---

## Task 8: Update app/layout.tsx and Components

**Files:**
- Modify: `app/layout.tsx`
- Modify: `components/Header.tsx`
- Modify: `components/MDXComponents.tsx`
- Modify: `components/ScrollTopAndComment.tsx`

- [ ] **Step 1: Update app/layout.tsx**

Remove the `Analytics`, `SearchProvider`, and `pliny/search/algolia.css` imports. The file becomes:

```tsx
import 'css/tailwind.css'

import { Space_Grotesk } from 'next/font/google'
import Header from '@/components/Header'
import SectionContainer from '@/components/SectionContainer'
import Footer from '@/components/Footer'
import siteMetadata from '@/data/siteMetadata'
import { ThemeProviders } from './theme-providers'
import { Metadata } from 'next'

const space_grotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.siteUrl),
  title: {
    default: siteMetadata.title,
    template: `%s | ${siteMetadata.title}`,
  },
  description: siteMetadata.description,
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: './',
    siteName: siteMetadata.title,
    images: [siteMetadata.socialBanner],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: './',
    types: {
      'application/rss+xml': `${siteMetadata.siteUrl}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    title: siteMetadata.title,
    card: 'summary_large_image',
    images: [siteMetadata.socialBanner],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={siteMetadata.language}
      className={`${space_grotesk.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <link rel="icon" href="/static/favicons/favicon.ico" />
      <link rel="apple-touch-icon" sizes="76x76" href="/static/favicons/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/static/favicons/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/static/favicons/favicon-16x16.png" />
      <link
        rel="manifest"
        href="/static/favicons/site.webmanifest"
        crossOrigin={'use-credentials'}
      />
      <link rel="mask-icon" href="/static/favicons/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="theme-color" media="(prefers-color-scheme: light)" content="#fff" />
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000" />
      <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
      <body className="bg-white pl-[calc(100vw-100%)] text-black antialiased dark:bg-gray-950 dark:text-white">
        <ThemeProviders>
          <SectionContainer>
            <div className="flex h-screen flex-col justify-between font-sans">
              <Header />
              <main className="mb-auto">{children}</main>
              <Footer />
            </div>
          </SectionContainer>
        </ThemeProviders>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Update components/Header.tsx**

Read the current file, then remove the `SearchButton` import and the `<SearchButton />` render call. The rest of the header stays unchanged.

- [ ] **Step 3: Update components/MDXComponents.tsx**

```tsx
import Pre from './Pre'
import TOC from './TOC'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'

export const components: MDXComponents = {
  Image,
  TOCInline: TOC,
  a: CustomLink,
  pre: Pre,
  table: TableWrapper,
}
```

- [ ] **Step 4: Update components/ScrollTopAndComment.tsx**

Read the current file. Remove the comment-scroll button (the `<button>` with `aria-label="Scroll To Comment"` and its surrounding conditional). Also remove the `handleScrollToComment` function and the `comments` reference. Keep only the scroll-to-top button logic.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx components/Header.tsx components/MDXComponents.tsx components/ScrollTopAndComment.tsx
git commit -m "chore: remove pliny analytics/search from layout, update MDX components"
```

---

## Task 9: Update App Routes (page, blog list, sitemap)

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/blog/page.tsx`
- Modify: `app/blog/page/[page]/page.tsx`
- Modify: `app/sitemap.ts`

For each file: replace `import { allBlogs } from 'contentlayer/generated'` with `import { blogs } from '@/content'`, replace `import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'` with `import { sortPosts, allCoreContent } from '@/lib/content-utils'`, and rename `allBlogs` → `blogs` at each usage site. Remove any `.filter(p => !p.draft)` calls.

- [ ] **Step 1: Update app/page.tsx**

```tsx
import { sortPosts, allCoreContent } from '@/lib/content-utils'
import { blogs } from '@/content'
// ... rest of imports unchanged

const MAX_DISPLAY = 5

export default async function Home() {
  const sortedPosts = allCoreContent(sortPosts(blogs))
  // ... rest of component unchanged, replace allBlogs with blogs
}
```

- [ ] **Step 2: Update app/blog/page.tsx**

Same pattern: swap imports, rename `allBlogs` → `blogs`.

- [ ] **Step 3: Update app/blog/page/[page]/page.tsx**

Same pattern.

- [ ] **Step 4: Update app/sitemap.ts**

```typescript
import { blogs } from '@/content'
// Replace allBlogs with blogs throughout
```

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/blog/page.tsx "app/blog/page/[page]/page.tsx" app/sitemap.ts
git commit -m "chore: update page routes to use velite content"
```

---

## Task 10: Update Blog Post and About Pages

**Files:**
- Modify: `app/blog/[...slug]/page.tsx`
- Modify: `app/about/page.tsx`

- [ ] **Step 1: Update app/blog/[...slug]/page.tsx**

This is the most complex route. Key changes:
1. Replace contentlayer imports with Velite
2. Replace pliny utility imports with local utilities
3. Swap `MDXLayoutRenderer` for `MDXContent`
4. Remove the JSON-LD `<script>` block (structuredData is gone)
5. Remove the `coreContent` wrap where it references `post.structuredData`

```tsx
import 'css/prism.css'
import 'katex/dist/katex.css'
import { components } from '@/components/MDXComponents'
import MDXContent from '@/components/MDXContent'
import { allCoreContent, coreContent, sortPosts } from '@/lib/content-utils'
import { blogs, authors } from '@/content'
import type { Blog, Authors } from '@/content'
import PostSimple from '@/layouts/PostSimple'
import PostLayout from '@/layouts/PostLayout'
import PostBanner from '@/layouts/PostBanner'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { notFound } from 'next/navigation'

const defaultLayout = 'PostLayout'
const layouts = {
  PostSimple,
  PostLayout,
  PostBanner,
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata | undefined> {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  const post = blogs.find((p) => p.slug === slug)
  if (!post) return

  const publishedAt = new Date(post.date).toISOString()
  const modifiedAt = new Date(post.lastmod || post.date).toISOString()
  let imageList = [siteMetadata.socialBanner]
  if (post.images) {
    imageList = post.images
  }
  const ogImages = imageList.map((img) => ({
    url: img.includes('http') ? img : siteMetadata.siteUrl + img,
  }))

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      siteName: siteMetadata.title,
      locale: 'en_US',
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      url: './',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: imageList,
    },
  }
}

export const generateStaticParams = async () => {
  return blogs.map((p) => ({ slug: p.slug.split('/') }))
}

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  const sortedCoreContents = allCoreContent(sortPosts(blogs))
  const postIndex = sortedCoreContents.findIndex((p) => p.slug === slug)
  if (postIndex === -1) return notFound()

  const prev = sortedCoreContents[postIndex + 1]
  const next = sortedCoreContents[postIndex - 1]
  const post = blogs.find((p) => p.slug === slug) as Blog
  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResult = authors.find((p) => p.slug === author)
    return coreContent(authorResult as Authors)
  })
  const mainContent = coreContent(post)
  const Layout = layouts[post.layout as keyof typeof layouts || defaultLayout]

  return (
    <Layout content={mainContent} authorDetails={authorDetails} next={next} prev={prev}>
      <MDXContent code={post.body.code} components={components} toc={post.toc} />
    </Layout>
  )
}
```

- [ ] **Step 2: Update app/about/page.tsx**

Read the current file, then apply:
1. Replace `import { Authors, allAuthors } from 'contentlayer/generated'` with `import { authors } from '@/content'` and `import type { Authors } from '@/content'`
2. Replace `import { MDXLayoutRenderer } from 'pliny/mdx-components'` with `import MDXContent from '@/components/MDXContent'`
3. Replace `import { coreContent } from 'pliny/utils/contentlayer'` with `import { coreContent } from '@/lib/content-utils'`
4. Replace `allAuthors.find(...)` with `authors.find(...)`
5. Replace `<MDXLayoutRenderer ... />` with `<MDXContent code={authorDetails.body.code} />`

- [ ] **Step 3: Commit**

```bash
git add "app/blog/[...slug]/page.tsx" app/about/page.tsx
git commit -m "chore: update blog post and about routes to use velite"
```

---

## Task 11: Update Layouts

**Files:**
- Modify: `layouts/PostLayout.tsx`
- Modify: `layouts/PostSimple.tsx`
- Modify: `layouts/PostBanner.tsx`
- Modify: `layouts/AuthorLayout.tsx`
- Modify: `layouts/ListLayout.tsx`

For each post layout (PostLayout, PostSimple, PostBanner):
- Replace `import type { Blog, Authors } from 'contentlayer/generated'` with `import type { Blog, Authors } from '@/content'`
- Replace `import { CoreContent } from 'pliny/utils/contentlayer'` with `import type { CoreContent } from '@/lib/content-utils'`
- Replace `import { formatDate } from 'pliny/utils/formatDate'` with inline date formatting (see below)
- Remove the `import Comments from '@/components/Comments'` line
- Remove tag rendering (any JSX referencing `content.tags`)
- Remove `<Comments ... />` and its surrounding conditional
- Remove `import Bleed from 'pliny/ui/Bleed'` if present

Inline date formatting replacement — wherever `formatDate(date)` is used, replace with:
```tsx
new Date(date).toLocaleDateString(siteMetadata.locale, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
```

- [ ] **Step 1: Update PostLayout.tsx**

Read the file, apply all changes above.

- [ ] **Step 2: Update PostSimple.tsx**

Read the file, apply all changes above.

- [ ] **Step 3: Update PostBanner.tsx**

Read the file, apply all changes above. Also remove the `import Bleed from 'pliny/ui/Bleed'` line and any `<Bleed>` wrapper — replace it with a plain `<div>`.

- [ ] **Step 4: Update AuthorLayout.tsx**

Read the file. Replace:
- `import type { Authors } from 'contentlayer/generated'` → `import type { Authors } from '@/content'`
- `import { CoreContent } from 'pliny/utils/contentlayer'` → `import type { CoreContent } from '@/lib/content-utils'`
- MDX rendering: the layout receives children already rendered, so just ensure the children slot is preserved.

- [ ] **Step 5: Update ListLayout.tsx**

Read the file. Replace:
- `import type { Blog } from 'contentlayer/generated'` → `import type { Blog } from '@/content'`
- `import { CoreContent } from 'pliny/utils/contentlayer'` → `import type { CoreContent } from '@/lib/content-utils'`
- `import { formatDate } from 'pliny/utils/formatDate'` → inline date formatting
- Remove tag rendering JSX

- [ ] **Step 6: Commit**

```bash
git add layouts/
git commit -m "chore: update layouts to use velite types, remove tags/comments/pliny"
```

---

## Task 12: Type-Check and Build

**Files:** No new files — fixing type errors.

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -50
```

Fix any errors. Common issues to expect:
- `Blog` / `Authors` type shape differences between Contentlayer and Velite — align field access to the new schema
- `body.code` vs `body` — Velite's `s.mdx()` output is `{ code: string }`, access as `post.body.code`
- `toc` prop type on layouts — ensure layout prop types accept Velite's `TocEntry[]` (from `components/TOC.tsx`)
- Transform `meta` not found — if Velite's transform doesn't expose `{ meta }` as the second arg, switch to accessing `data._meta.path` instead of `meta.path` in `velite.config.ts`

- [ ] **Step 2: Run build**

```bash
yarn build
```

Expected: Clean build with no errors. If Velite fails to resolve the webpack plugin, check the import path — it may be `require('velite')` with `VeliteWebpackPlugin` exported from the main package rather than `velite/webpack`.

- [ ] **Step 3: Verify dev server**

```bash
yarn dev
```

Navigate to:
- `/` — homepage with post list
- `/blog` — blog index
- A post URL (e.g. `/blog/leadership-game-of-empathy`) — post renders with TOC, code highlighting, copy button
- `/about` — author page renders

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: complete velite migration, remove contentlayer and pliny"
```
