import type { ApiDocsEndpoint } from "@/lib/public-api-docs"

import { ApiDocsCodeBlock } from "./api-docs-code-block"
import { ApiDocsHeading } from "./api-docs-heading"

function ApiDocsFieldsTable({
  columns,
  fields,
}: {
  columns: [string, string, string]
  fields: { name: string; type: string; description: string }[]
}) {
  return (
    <div className="api-docs-table-wrap">
      <table className="api-docs-table">
        <thead>
          <tr>
            <th>{columns[0]}</th>
            <th>{columns[1]}</th>
            <th className="api-docs-table-desc">{columns[2]}</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field.name}>
              <td>
                <code className="api-docs-inline-code">{field.name}</code>
              </td>
              <td>{field.type}</td>
              <td className="api-docs-table-desc">{field.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ApiDocsEndpointSection({
  endpoint,
  baseUrl,
}: {
  endpoint: ApiDocsEndpoint
  baseUrl: string
}) {
  return (
    <section className="api-docs-section">
      <ApiDocsHeading id={endpoint.id} level={2}>
        {endpoint.title}
      </ApiDocsHeading>
      <p className="api-docs-lead">{endpoint.summary}</p>

      <div className="api-docs-request">
        <span className="api-docs-method">GET</span>
        <code className="api-docs-request-url">
          {baseUrl}
          {endpoint.path}
        </code>
      </div>

      {endpoint.params.length > 0 ?
        <>
          <ApiDocsHeading id={`${endpoint.id}-parameters`} level={3}>
            Query parameters
          </ApiDocsHeading>
          <ApiDocsFieldsTable
            columns={["Name", "Type", "Description"]}
            fields={endpoint.params.map((param) => ({
              name: param.name,
              type: `${param.type}${param.required ? ", required" : ""}`,
              description: param.description,
            }))}
          />
        </>
      : null}

      <ApiDocsHeading id={`${endpoint.id}-response`} level={3}>
        Response fields
      </ApiDocsHeading>
      <ApiDocsFieldsTable
        columns={["Field", "Type", "Description"]}
        fields={endpoint.responseFields}
      />

      {endpoint.responseFieldGroups?.map((group) => (
        <div key={group.title}>
          <ApiDocsHeading
            id={`${endpoint.id}-${group.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
            level={3}
          >
            {group.title}
          </ApiDocsHeading>
          {group.description ?
            <p className="api-docs-lead">{group.description}</p>
          : null}
          <ApiDocsFieldsTable
            columns={["Field", "Type", "Description"]}
            fields={group.fields}
          />
        </div>
      ))}

      {endpoint.notes && endpoint.notes.length > 0 ?
        <>
          <ApiDocsHeading id={`${endpoint.id}-notes`} level={3}>
            Notes
          </ApiDocsHeading>
          <ul className="api-docs-list">
            {endpoint.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </>
      : null}

      {endpoint.errors.length > 0 ?
        <>
          <ApiDocsHeading id={`${endpoint.id}-errors`} level={3}>
            Errors
          </ApiDocsHeading>
          <div className="api-docs-table-wrap">
            <table className="api-docs-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th className="api-docs-table-desc">Message</th>
                </tr>
              </thead>
              <tbody>
                {endpoint.errors.map((err) => (
                  <tr key={`${err.status}-${err.message}`}>
                    <td>{err.status}</td>
                    <td className="api-docs-table-desc">
                      <code className="api-docs-inline-code">{`{ "error": "${err.message}" }`}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      : null}

      <ApiDocsHeading id={`${endpoint.id}-example`} level={3}>
        Example response
      </ApiDocsHeading>
      <ApiDocsCodeBlock code={endpoint.exampleResponse} language="json" />

      <ApiDocsHeading id={`${endpoint.id}-curl`} level={3}>
        cURL
      </ApiDocsHeading>
      <ApiDocsCodeBlock code={endpoint.exampleCurl(baseUrl)} language="bash" />
    </section>
  )
}
