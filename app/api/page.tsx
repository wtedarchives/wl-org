import type { Metadata } from "next"

import { ApiDocsPage } from "@/components/api-docs/api-docs-page"
import { getPublicApiBaseUrl } from "@/lib/public-api-base-url"

export const metadata: Metadata = {
  title: { absolute: "API Reference – WTEDRadio.com" },
  description:
    "Public read API for the WTED setlist archive. API key required.",
}

export default function ApiReferencePage() {
  const baseUrl = getPublicApiBaseUrl()

  return <ApiDocsPage baseUrl={baseUrl} />
}
