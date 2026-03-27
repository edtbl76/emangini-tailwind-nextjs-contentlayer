'use client'

import * as runtime from 'react/jsx-runtime'
import { run } from '@mdx-js/mdx'
import { useEffect, useState } from 'react'
import { components } from './MDXComponents'

interface MDXContentProps {
  code: string
  toc?: unknown
}

export default function MDXContent({ code }: MDXContentProps) {
  const [MdxModule, setMdxModule] = useState<{
    default: React.ComponentType<{ components?: typeof components }>
  } | null>(null)

  useEffect(() => {
    run(code, { ...runtime, baseUrl: import.meta.url })
      .then((mod) => setMdxModule(mod as typeof MdxModule))
      .catch(console.error)
  }, [code])

  if (!MdxModule) return null
  const Component = MdxModule.default
  return <Component components={components} />
}
