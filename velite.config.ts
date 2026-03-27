import { defineConfig, defineCollection, s } from 'velite'
import readingTime from 'reading-time'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkCodeTitles from 'remark-code-titles'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypeCitation from 'rehype-citation'
import rehypeRaw from 'rehype-raw'
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
      const { raw, ...rest } = data
      // meta.path is the absolute file path; derive relative path from data root
      const relativePath = meta.path
        .replace(path.join(root, 'data') + '/', '')
        .replace(/\.mdx?$/, '')
      return {
        ...rest,
        slug: relativePath.replace(/^blog\//, ''),
        path: relativePath,
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
    .transform((data, { meta }) => {
      const relativePath = meta.path
        .replace(path.join(root, 'data') + '/', '')
        .replace(/\.mdx?$/, '')
      return {
        ...data,
        slug: relativePath.replace(/^authors\//, ''),
        path: relativePath,
      }
    }),
})

export default defineConfig({
  root: 'data',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:6][ext]',
    clean: false,
  },
  collections: { blogs, authors },
  mdx: {
    remarkPlugins: [remarkGfm, remarkMath, remarkCodeTitles],
    rehypePlugins: [
      [
        rehypeRaw,
        {
          passThrough: [
            'mdxjsEsm',
            'mdxJsxFlowElement',
            'mdxJsxTextElement',
            'mdxFlowExpression',
            'mdxTextExpression',
          ],
        },
      ],
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
