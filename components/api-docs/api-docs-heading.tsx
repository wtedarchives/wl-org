export function ApiDocsHeading({
  id,
  level,
  children,
}: {
  id: string
  level: 2 | 3
  children: React.ReactNode
}) {
  const Tag = level === 2 ? "h2" : "h3"
  return (
    <Tag id={id} className={level === 2 ? "api-docs-h2" : "api-docs-h3"}>
      <a className="api-docs-anchor" href={`#${id}`} aria-label={`Link to ${id}`}>
        #
      </a>
      {children}
    </Tag>
  )
}
