import type { ApiDocsEndpoint } from "@/lib/bot-read-api-docs"

import { ApiDocsCodeBlock } from "./api-docs-code-block"

export function ApiDocsEndpointSection({
  endpoint,
  baseUrl,
}: {
  endpoint: ApiDocsEndpoint
  baseUrl: string
}) {
  return (
    <section className="api-docs-section" id={endpoint.id}>
      <div className="api-docs-section-head">
        <span className="api-docs-method">GET</span>
        <h2 className="api-docs-section-title">{endpoint.title}</h2>
      </div>
      <p className="api-docs-lead">{endpoint.summary}</p>

      <div className="api-docs-callout">
        <span className="api-docs-callout-label">Request</span>
        <code className="api-docs-request-url">
          GET {baseUrl}
          {endpoint.query}
        </code>
      </div>

      <h3 className="api-docs-subtitle">Query parameters</h3>
      <div className="api-docs-table-wrap">
        <table className="api-docs-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Required</th>
              <th>Type</th>
              <th className="api-docs-table-desc">Description</th>
            </tr>
          </thead>
          <tbody>
            {endpoint.params.map((param) => (
              <tr key={param.name}>
                <td>
                  <code>{param.name}</code>
                </td>
                <td>{param.required ? "Yes" : "No"}</td>
                <td>{param.type}</td>
                <td className="api-docs-table-desc">{param.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="api-docs-subtitle">Response fields</h3>
      <p className="api-docs-muted">Each item in the data array includes:</p>
      <div className="api-docs-table-wrap">
        <table className="api-docs-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th className="api-docs-table-desc">Description</th>
            </tr>
          </thead>
          <tbody>
            {endpoint.responseFields.map((field) => (
              <tr key={field.name}>
                <td>
                  <code>{field.name}</code>
                </td>
                <td>{field.type}</td>
                <td className="api-docs-table-desc">{field.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {endpoint.notes && endpoint.notes.length > 0 ?
        <>
          <h3 className="api-docs-subtitle">Notes</h3>
          <ul className="api-docs-list">
            {endpoint.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </>
      : null}

      {endpoint.errors.length > 0 ?
        <>
          <h3 className="api-docs-subtitle">Errors</h3>
          <div className="api-docs-table-wrap">
            <table className="api-docs-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {endpoint.errors.map((err) => (
                  <tr key={`${err.status}-${err.message}`}>
                    <td>{err.status}</td>
                    <td>
                      <code>{`{ "error": "${err.message}" }`}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      : null}

      <h3 className="api-docs-subtitle">Example response</h3>
      <ApiDocsCodeBlock code={endpoint.exampleResponse} language="json" />

      <h3 className="api-docs-subtitle">cURL</h3>
      <ApiDocsCodeBlock code={endpoint.exampleCurl(baseUrl)} language="bash" />
    </section>
  )
}
