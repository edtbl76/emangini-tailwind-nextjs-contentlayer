interface TocEntry {
  title: string
  url: string
  depth: number
  items?: TocEntry[]
}

interface TOCProps {
  toc: TocEntry[]
  indentDepth?: number
  fromHeading?: number
  toHeading?: number
  asDisclosure?: boolean
  exclude?: string | string[]
}

export default function TOC({ toc, fromHeading = 1, toHeading = 6, exclude = '' }: TOCProps) {
  const excludeList = Array.isArray(exclude) ? exclude : [exclude]

  function renderItems(items: TocEntry[], depth: number): React.ReactNode {
    return items
      .filter((item) => item.depth >= fromHeading && item.depth <= toHeading)
      .filter((item) => !excludeList.some((ex) => ex && item.title.toLowerCase().includes(ex.toLowerCase())))
      .map((item) => (
        <li key={item.url}>
          <a href={item.url}>{item.title}</a>
          {item.items && item.items.length > 0 && (
            <ul>{renderItems(item.items, depth + 1)}</ul>
          )}
        </li>
      ))
  }

  return (
    <div className="toc">
      <ul>{renderItems(toc, 0)}</ul>
    </div>
  )
}
