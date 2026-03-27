import 'css/prism.css'
import 'katex/dist/katex.css'

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
  const authorDetails = authorList
    .map((author) => authors.find((p) => p.slug === author))
    .filter((a): a is Authors => a !== undefined)
    .map((a) => coreContent(a))
  const mainContent = coreContent(post)
  const Layout = layouts[(post.layout as keyof typeof layouts) || defaultLayout]

  return (
    <Layout content={mainContent} authorDetails={authorDetails} next={next} prev={prev}>
      <MDXContent code={post.body} toc={post.toc} />
    </Layout>
  )
}
