"use client"

import { useCallback, useState } from "react"

export function ApiDocsCodeBlock({
  code,
  language,
}: {
  code: string
  language: "json" | "bash"
}) {
  const [copied, setCopied] = useState(false)
  const lines = code.split("\n")

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [code])

  return (
    <div className="api-docs-code">
      <div className="api-docs-code-head">
        <span className="api-docs-code-lang">{language}</span>
        <button type="button" className="api-docs-code-copy" onClick={onCopy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="api-docs-code-body">
        <ol className="api-docs-code-lines" aria-hidden="true">
          {lines.map((_, index) => (
            <li key={index}>{index + 1}</li>
          ))}
        </ol>
        <pre className="api-docs-code-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}
