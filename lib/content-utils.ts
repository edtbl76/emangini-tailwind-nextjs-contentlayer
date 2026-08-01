export type CoreContent<T> = Omit<T, 'body'>

/**
 * Posts that belong on the site.
 *
 * `draft: true` holds a post back from every surface: listings, pagination, its own
 * route, the sitemap, and the RSS feed. Filtering lives here rather than at each call
 * site so a new surface cannot quietly forget to check — which is exactly how the flag
 * came to be decorative in the first place.
 */
export function publishedPosts<T extends { draft?: boolean }>(posts: T[]): T[] {
  return posts.filter((post) => !post.draft)
}

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
