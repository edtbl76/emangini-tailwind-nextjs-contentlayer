import { sortPosts, allCoreContent } from '@/lib/content-utils'
import { blogs } from '@/content'
import Main from './Main'

export default async function Page() {
  const sortedPosts = sortPosts(blogs)
  const posts = allCoreContent(sortedPosts)
  return <Main posts={posts} />
}
