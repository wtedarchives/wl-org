import type { Metadata } from "next"

import { ApiDocsPage } from "@/components/api-docs/api-docs-page"
import { getBotReadApiBaseUrl } from "@/lib/bot-read-api-base-url"

export const metadata: Metadata = {
  title: { absolute: "API Reference – WTEDRadio.com" },
  description:
    "Public read API for the WTED setlist archive — tours, shows, setlists, and songs.",
}

export default function ApiReferencePage() {
  const baseUrl = getBotReadApiBaseUrl()

  return <ApiDocsPage baseUrl={baseUrl} />
}
