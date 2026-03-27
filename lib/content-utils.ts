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
