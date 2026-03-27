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
