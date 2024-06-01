import React, { useEffect, useRef } from 'react'

const NewsletterGroveForm: React.FC = () => {
  const divRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const scriptElement = document.createElement('script')
    scriptElement.src = 'https://emangini.ck.page/0f15515414/index.js'
    scriptElement.async = true
    scriptElement.dataset.uid = '0f15515414'

    divRef.current?.appendChild(scriptElement)
  }, [])

  return <div ref={divRef}></div>
}

export default NewsletterGroveForm
