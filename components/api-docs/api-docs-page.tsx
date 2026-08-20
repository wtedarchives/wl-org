import { ApiDocsCodeBlock } from "@/components/api-docs/api-docs-code-block"
import { ApiDocsEndpointSection } from "@/components/api-docs/api-docs-endpoint-section"
import { ApiDocsHeading } from "@/components/api-docs/api-docs-heading"
import { ApiDocsShell } from "@/components/api-docs/api-docs-shell"
import {
  PUBLIC_API_ENDPOINTS,
  PUBLIC_API_NAV,
  PUBLIC_API_VERSION,
} from "@/lib/public-api-docs"

import "./api-docs.css"

const NAV_GROUPS = [
  {
    label: "Get started",
    ids: ["overview", "authentication", "responses"],
  },
  {
    label: "Endpoints",
    ids: ["discography", "discography-entry", "groups", "personnel", "personnel-entry"],
  },
  {
    label: "More",
    ids: ["notes"],
  },
] as const

export function ApiDocsPage({ baseUrl }: { baseUrl: string }) {
  const navById = Object.fromEntries(PUBLIC_API_NAV.map((item) => [item.id, item]))

  return (
    <ApiDocsShell
      sidebar={
        <nav className="api-docs-nav" aria-label="API sections">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="api-docs-nav-group">
              <p className="api-docs-nav-group-label">{group.label}</p>
              <ul className="api-docs-nav-list">
                {group.ids.map((id) => {
                  const item = navById[id]
                  if (!item) return null
                  return (
                    <li key={item.id}>
                      <a className="api-docs-nav-link" href={`#${item.id}`}>
                        {item.endpoint ?
                          <span className="api-docs-nav-method">GET</span>
                        : null}
                        <span>{item.label}</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      }
      toc={
        <>
          <p className="api-docs-toc-title">On this page</p>
          <ul className="api-docs-toc-list">
            {PUBLIC_API_NAV.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ul>
        </>
      }
    >
      <article className="api-docs-article">
        <p className="api-docs-kicker">v{PUBLIC_API_VERSION}</p>
        <h1 className="api-docs-h1">WTED ARCHIVES API</h1>
        <p className="api-docs-lede">
          Read-only HTTP access to published archive data. All requests use GET.
          An API key is required on every call. Only the fields listed for each
          endpoint are returned.
        </p>

        <section className="api-docs-section">
          <ApiDocsHeading id="overview" level={2}>
            Overview
          </ApiDocsHeading>
          <p className="api-docs-lead">Base URL for all operations:</p>
          <ApiDocsCodeBlock code={baseUrl} language="bash" />
          <p className="api-docs-lead">
            Append the endpoint path. Only HTTP GET is supported.
          </p>
        </section>

        <section className="api-docs-section">
          <ApiDocsHeading id="authentication" level={2}>
            Authentication
          </ApiDocsHeading>
          <p className="api-docs-lead">
            Include your API key on every request using one of these headers:
          </p>
          <ApiDocsCodeBlock
            code={`X-API-Key: YOUR_KEY\n\nAuthorization: Bearer YOUR_KEY`}
            language="bash"
          />
          <p className="api-docs-lead">
            Keys are issued by WTED. Store them in environment variables — never
            commit them to source control or expose them in client-side code.
          </p>
          <p className="api-docs-lead">
            Missing, invalid, or revoked keys return HTTP 401:
          </p>
          <ApiDocsCodeBlock code={`{ "error": "Unauthorized" }`} language="json" />
        </section>

        <section className="api-docs-section">
          <ApiDocsHeading id="responses" level={2}>
            Responses
          </ApiDocsHeading>
          <p className="api-docs-lead">Successful responses use HTTP 200:</p>
          <ApiDocsCodeBlock
            code={`{
  "data": [ ... ],
  "meta": { "count": 42 }
}`}
            language="json"
          />
          <p className="api-docs-lead">
            Errors return a plain object without the data wrapper:
          </p>
          <ApiDocsCodeBlock
            code={`{ "error": "Human-readable message" }`}
            language="json"
          />
          <ApiDocsHeading id="http-status-codes" level={3}>
            HTTP status codes
          </ApiDocsHeading>
          <div className="api-docs-table-wrap">
            <table className="api-docs-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th className="api-docs-table-desc">Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>200</td>
                  <td className="api-docs-table-desc">Success</td>
                </tr>
                <tr>
                  <td>400</td>
                  <td className="api-docs-table-desc">
                    Bad or missing query parameter
                  </td>
                </tr>
                <tr>
                  <td>401</td>
                  <td className="api-docs-table-desc">
                    Missing, invalid, or revoked API key
                  </td>
                </tr>
                <tr>
                  <td>404</td>
                  <td className="api-docs-table-desc">Resource not found</td>
                </tr>
                <tr>
                  <td>405</td>
                  <td className="api-docs-table-desc">
                    Method not allowed (only GET is supported)
                  </td>
                </tr>
                <tr>
                  <td>500</td>
                  <td className="api-docs-table-desc">Server error</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {PUBLIC_API_ENDPOINTS.map((endpoint) => (
          <ApiDocsEndpointSection
            key={endpoint.id}
            endpoint={endpoint}
            baseUrl={baseUrl}
          />
        ))}

        <section className="api-docs-section">
          <ApiDocsHeading id="notes" level={2}>
            Notes
          </ApiDocsHeading>
          <ul className="api-docs-list">
            <li>Read-only — no POST, PUT, PATCH, or DELETE operations.</li>
            <li>
              Only the documented fields are returned; no other tables or columns
              are exposed.
            </li>
            <li>
              Contact WTED to request a new API key or revoke an existing one.
            </li>
          </ul>
        </section>
      </article>
    </ApiDocsShell>
  )
}
