import { authors } from '@/content'
import type { Authors } from '@/content'
import MDXContent from '@/components/MDXContent'
import AuthorLayout from '@/layouts/AuthorLayout'
import { coreContent } from '@/lib/content-utils'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'About' })

export default function Page() {
  const author = authors.find((p) => p.slug === 'default') as Authors
  const mainContent = coreContent(author)

  return (
    <>
      <AuthorLayout content={mainContent}>
        <MDXContent code={author.body} />
      </AuthorLayout>
    </>
  )
}
