"use client"

import { MagnifyingGlass } from "@phosphor-icons/react"
import {
  useCallback,
  useId,
  useState,
  type FormEvent,
  type RefObject,
} from "react"

import {
  fetchSiteSearch,
  SITE_SEARCH_MIN_QUERY_LENGTH,
  type SiteSearchResponse,
} from "@/lib/site-search"

import { WlHomeV2SiteSearchResults } from "./wl-home-v2-site-search-results"

export function useSiteSearchForm(accessToken: string | null | undefined) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SiteSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const resetPanel = useCallback(() => {
    setPanelOpen(false)
    setResults(null)
    setError(null)
    setHint(null)
    setLoading(false)
  }, [])

  const submit = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim()
      setPanelOpen(true)
      setHint(null)
      setError(null)

      if (!accessToken && process.env.NODE_ENV !== "development") {
        setResults(null)
        setLoading(false)
        setError("You must be signed in to search.")
        return
      }

      if (trimmed.length < SITE_SEARCH_MIN_QUERY_LENGTH) {
        setResults(null)
        setLoading(false)
        setHint(`Enter at least ${SITE_SEARCH_MIN_QUERY_LENGTH} characters.`)
        return
      }

      setLoading(true)
      setResults(null)
      try {
        const data = await fetchSiteSearch(accessToken, trimmed)
        setResults(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed")
        setResults(null)
      } finally {
        setLoading(false)
      }
    },
    [accessToken],
  )

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    hint,
    panelOpen,
    setPanelOpen,
    submit,
    resetPanel,
  }
}

type WlHomeV2SiteSearchFieldProps = {
  formRef?: RefObject<HTMLFormElement | null>
  inputId?: string
  query: string
  onQueryChange: (value: string) => void
  onSubmit: (query: string) => void
  autoFocus?: boolean
  placeholder?: string
  className?: string
}

export function WlHomeV2SiteSearchField({
  formRef,
  inputId,
  query,
  onQueryChange,
  onSubmit,
  autoFocus,
  placeholder = "Search WTED...",
  className,
}: WlHomeV2SiteSearchFieldProps) {
  const generatedId = useId()
  const id = inputId ?? generatedId

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(query)
  }

  return (
    <form
      ref={formRef}
      className={["wl-home-v2-site-search-field", className]
        .filter(Boolean)
        .join(" ")}
      onSubmit={onFormSubmit}
      role="search"
    >
      <label htmlFor={id} className="sr-only">
        Search WTED
      </label>
      <input
        id={id}
        type="search"
        name="q"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        className="wl-home-v2-site-search-input"
      />
      <button
        type="submit"
        className="wl-home-v2-site-search-submit"
        aria-label="Search"
      >
        <MagnifyingGlass size={16} weight="bold" aria-hidden />
      </button>
    </form>
  )
}

type WlHomeV2SiteSearchPanelBodyProps = {
  results: SiteSearchResponse | null
  loading: boolean
  error: string | null
  hint: string | null
  onNavigate?: () => void
}

export function WlHomeV2SiteSearchPanelBody({
  results,
  loading,
  error,
  hint,
  onNavigate,
}: WlHomeV2SiteSearchPanelBodyProps) {
  return (
    <WlHomeV2SiteSearchResults
      results={results}
      loading={loading}
      error={error}
      hint={hint}
      onNavigate={onNavigate}
    />
  )
}
