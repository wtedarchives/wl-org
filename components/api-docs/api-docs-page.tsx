import Link from "next/link"

import { ApiDocsCodeBlock } from "@/components/api-docs/api-docs-code-block"
import { ApiDocsEndpointSection } from "@/components/api-docs/api-docs-endpoint-section"
import {
  BOT_READ_API_ENDPOINTS,
  BOT_READ_API_NAV,
  BOT_READ_API_VERSION,
} from "@/lib/bot-read-api-docs"

import "./api-docs.css"

export function ApiDocsPage({ baseUrl }: { baseUrl: string }) {
  return (
    <div className="api-docs">
      <header className="api-docs-header">
        <div className="api-docs-header-inner">
          <div className="api-docs-header-copy">
            <div className="api-docs-header-top">
              <p className="api-docs-eyebrow">WTED Setlist Archive</p>
              <Link href="/" className="api-docs-home-link">
                WTEDRadio.com
              </Link>
            </div>
            <h1 className="api-docs-title">Read API</h1>
            <p className="api-docs-description">
              Read-only HTTP access to tours, shows, setlists, and songs. All
              requests use GET. An API key is required on every call.
            </p>
            <span className="api-docs-version">v{BOT_READ_API_VERSION}</span>
          </div>
        </div>
      </header>

      <div className="api-docs-layout">
        <nav className="api-docs-nav" aria-label="API sections">
          <ul className="api-docs-nav-list">
            {BOT_READ_API_NAV.map((item) => (
              <li key={item.id}>
                <a className="api-docs-nav-link" href={`#${item.id}`}>
                  {item.endpoint ?
                    <span className="api-docs-nav-method">GET</span>
                  : null}
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="api-docs-main">
          <section className="api-docs-section" id="overview">
            <h2 className="api-docs-section-title">Overview</h2>
            <p className="api-docs-lead">
              Base URL for all operations:
            </p>
            <ApiDocsCodeBlock code={baseUrl} language="bash" />
            <p className="api-docs-lead">
              Append query parameters to select an operation. Only HTTP GET is
              supported. There is no pagination — each call returns the full
              result set.
            </p>
          </section>

          <section className="api-docs-section" id="authentication">
            <h2 className="api-docs-section-title">Authentication</h2>
            <p className="api-docs-lead">
              Include your API key on every request using one of these headers:
            </p>
            <ApiDocsCodeBlock
              code={`X-API-Key: wted_your_key_here\n\nAuthorization: Bearer wted_your_key_here`}
              language="bash"
            />
            <p className="api-docs-lead">
              Keys are issued by WTED (format{" "}
              <code className="api-docs-inline-code">wted_</code> followed by 64
              hex characters). Store keys in environment variables — never commit
              them to source control or expose them in client-side code.
            </p>
            <p className="api-docs-lead">
              Missing, invalid, or revoked keys return HTTP 401:
            </p>
            <ApiDocsCodeBlock code={`{ "error": "Unauthorized" }`} language="json" />
          </section>

          <section className="api-docs-section" id="responses">
            <h2 className="api-docs-section-title">Responses</h2>
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
            <ApiDocsCodeBlock code={`{ "error": "Human-readable message" }`} language="json" />
            <h3 className="api-docs-subtitle">HTTP status codes</h3>
            <div className="api-docs-table-wrap">
              <table className="api-docs-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>200</td>
                    <td>Success</td>
                  </tr>
                  <tr>
                    <td>400</td>
                    <td>Bad or missing query parameter</td>
                  </tr>
                  <tr>
                    <td>401</td>
                    <td>Missing, invalid, or revoked API key</td>
                  </tr>
                  <tr>
                    <td>404</td>
                    <td>Tour or show not found</td>
                  </tr>
                  <tr>
                    <td>405</td>
                    <td>Method not allowed (only GET is supported)</td>
                  </tr>
                  <tr>
                    <td>500</td>
                    <td>Server error</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="api-docs-section" id="workflow">
            <h2 className="api-docs-section-title">Typical request flow</h2>
            <ol className="api-docs-ordered-list">
              <li>
                <code>?endpoint=tours</code> — list tours; retain{" "}
                <code>tour_id</code>
              </li>
              <li>
                <code>?endpoint=shows&amp;tour_id=…</code> — list shows on that
                tour; retain <code>show_id</code>
              </li>
              <li>
                <code>?endpoint=setlist&amp;show_id=…</code> — load the setlist
                for a show
              </li>
              <li>
                <code>?endpoint=songs</code> — load songs from the archive
              </li>
            </ol>
          </section>

          {BOT_READ_API_ENDPOINTS.map((endpoint) => (
            <ApiDocsEndpointSection
              key={endpoint.id}
              endpoint={endpoint}
              baseUrl={baseUrl}
            />
          ))}

          <section className="api-docs-section" id="notes">
            <h2 className="api-docs-section-title">Notes</h2>
            <ul className="api-docs-list">
              <li>Read-only — no POST, PUT, PATCH, or DELETE operations.</li>
              <li>
                Only the documented fields are returned; no other tables or
                columns are exposed.
              </li>
              <li>
                Invalid endpoint values return:{" "}
                <code className="api-docs-inline-code">
                  {`{ "error": "Missing or invalid endpoint. Use endpoint=tours|shows|setlist|songs" }`}
                </code>
              </li>
              <li>
                <Link href="/archive/submit" className="api-docs-text-link">
                  Contact WTED
                </Link>{" "}
                to request a new API key or revoke an existing one.
              </li>
            </ul>
          </section>
        </main>
      </div>

      <footer className="api-docs-footer">
        <p>WTED Setlist Archive Read API · WTEDRadio.com</p>
      </footer>
    </div>
  )
}
