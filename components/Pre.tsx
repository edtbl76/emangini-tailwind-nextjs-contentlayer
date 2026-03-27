'use client'

import { useState, useRef } from 'react'

interface PreProps extends React.HTMLAttributes<HTMLPreElement> {
  children?: React.ReactNode
}

export default function Pre({ children, ...rest }: PreProps) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  function handleCopy() {
    const text = preRef.current?.textContent ?? ''
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="relative">
      <pre ref={preRef} {...rest}>
        {children}
      </pre>
      <button
        aria-label="Copy code"
        className="absolute right-2 top-2 rounded px-2 py-1 text-xs text-gray-300 hover:bg-gray-700"
        onClick={handleCopy}
        type="button"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
