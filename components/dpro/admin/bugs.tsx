"use client"

import { useEffect, useState } from "react"
import { AlertCircle, ExternalLink } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { BugsResolveModal } from "@/components/dpro/admin/bugs-resolve-modal"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Bug {
  bug_id: string
  bug_type: string
  bug_submissiondate: string
  bug_contactemail: string | null
  bug_detail: string | null
  bug_completion: boolean
  bug_file_url?: string | null
}

function CopyToClipboard({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      className={
        "wl-home-v2-archive-admin-bugs-copy" +
        (copied ? " wl-home-v2-archive-admin-bugs-copy--copied" : "")
      }
      onClick={handleCopy}
    >
      {copied ? "Copied!" : text}
    </button>
  )
}

export function Bugs() {
  const { session } = useAuth()
  const token = session?.token ?? null
  const [bugs, setBugs] = useState<Bug[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchBugs = async () => {
    if (!supabase) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("bugs")
        .select(
          "bug_id, bug_type, bug_submissiondate, bug_contactemail, bug_detail, bug_completion, bug_file_url"
        )
        .order("bug_submissiondate", { ascending: false })

      if (error) throw error
      setBugs(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bugs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBugs()

    if (!supabase) return
    const channel = supabase
      .channel("bugs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bugs" },
        () => fetchBugs()
      )
      .subscribe()

    return () => {
      supabase?.removeChannel(channel)
    }
  }, [])

  const handleRowClick = (bug: Bug) => {
    if (bug.bug_completion) return
    setSelectedBug(bug)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedBug(null)
  }

  const markAsResolved = async () => {
    if (!selectedBug || !token) return
    try {
      setUpdating(true)
      const { error: err } = await invokeDproAdmin(token, {
        action: "bugs_delete",
        bug_id: selectedBug.bug_id,
      })
      if (err) throw new Error(err)
      setBugs((prev) => prev.filter((b) => b.bug_id !== selectedBug.bug_id))
      handleModalClose()
    } catch (err) {
      setError(
        err instanceof Error ? "Failed to delete: " + err.message : "Failed"
      )
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="wl-home-v2-archive-admin-root wl-home-v2-archive-admin-bugs-loading">
        <div className="wl-home-v2-archive-admin-bugs-loading-dots" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <p className="wl-home-v2-archive-admin-bugs-loading-text">
          Loading bugs…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="wl-home-v2-archive-admin-root wl-home-v2-archive-admin-banner wl-home-v2-archive-admin-banner--error">
        <AlertCircle className="wl-home-v2-archive-admin-banner-icon" aria-hidden />
        <p className="wl-home-v2-archive-admin-banner-text">
          Error loading bugs: {error}
        </p>
      </div>
    )
  }

  if (bugs.length === 0) {
    return (
      <div className="wl-home-v2-archive-admin-root wl-home-v2-archive-admin-bugs-empty">
        No bugs have been reported yet.
      </div>
    )
  }

  return (
    <div className="wl-home-v2-archive-admin-root wl-home-v2-archive-admin-bugs">
      <h2 className="wl-home-v2-archive-admin-bugs-title">Bug Tracker</h2>

      <div className="wl-home-v2-archive-admin-bugs-table-wrap">
        <Table className="wl-home-v2-archive-admin-bugs-table table-fixed min-w-[1080px]">
          <TableHeader className="wl-home-v2-archive-admin-bugs-thead text-sm">
            <TableRow>
              <TableHead className="min-w-[120px] w-[120px]">Type</TableHead>
              <TableHead className="min-w-[100px] w-[100px]">Submitted</TableHead>
              <TableHead className="min-w-[160px] w-[160px]">Contact Email</TableHead>
              <TableHead className="min-w-[500px] w-[500px]">Details</TableHead>
              <TableHead className="min-w-[80px] w-[80px]">File</TableHead>
              <TableHead className="min-w-[80px] w-[80px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bugs.map((bug) => (
              <TableRow
                key={bug.bug_id}
                className={
                  bug.bug_completion
                    ? "wl-home-v2-archive-admin-bugs-row wl-home-v2-archive-admin-bugs-row--done"
                    : "wl-home-v2-archive-admin-bugs-row wl-home-v2-archive-admin-bugs-row--open"
                }
                onClick={() => handleRowClick(bug)}
              >
                <TableCell className="min-w-[120px] w-[120px] font-medium">
                  {bug.bug_type ?? "N/A"}
                </TableCell>
                <TableCell className="min-w-[100px] w-[100px] wl-home-v2-archive-admin-bugs-cell-muted">
                  {formatDate(bug.bug_submissiondate)}
                </TableCell>
                <TableCell className="min-w-[160px] w-[160px] break-all">
                  {bug.bug_contactemail ?
                    <CopyToClipboard text={bug.bug_contactemail} />
                  : "N/A"}
                </TableCell>
                <TableCell className="min-w-[500px] w-[500px] max-w-[500px] whitespace-normal break-words">
                  {bug.bug_detail ?? "No details provided"}
                </TableCell>
                <TableCell className="min-w-[80px] w-[80px]">
                  {bug.bug_file_url ?
                    <a
                      href={bug.bug_file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="wl-home-v2-archive-admin-bugs-file-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="size-3" aria-hidden />
                      View
                    </a>
                  : "—"}
                </TableCell>
                <TableCell className="min-w-[80px] w-[80px]">
                  <Badge
                    variant={bug.bug_completion ? "secondary" : "outline"}
                    className={
                      bug.bug_completion ?
                        "wl-home-v2-archive-admin-bugs-status wl-home-v2-archive-admin-bugs-status--resolved"
                      : "wl-home-v2-archive-admin-bugs-status wl-home-v2-archive-admin-bugs-status--open"
                    }
                  >
                    {bug.bug_completion ? "Resolved" : "Open"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BugsResolveModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setSelectedBug(null)
        }}
        selectedBug={selectedBug}
        updating={updating}
        onConfirm={() => void markAsResolved()}
        onCancel={handleModalClose}
      />
    </div>
  )
}
