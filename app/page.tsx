import { sortPosts, allCoreContent, publishedPosts } from '@/lib/content-utils'
import { blogs } from '@/content'
import Main from './Main'

export default async function Page() {
  const sortedPosts = sortPosts(publishedPosts(blogs))
  const posts = allCoreContent(sortedPosts)
  return <Main posts={posts} />
}
