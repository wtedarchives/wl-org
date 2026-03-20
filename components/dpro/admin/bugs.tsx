"use client"

import { useEffect, useState } from "react"
import { AlertCircle, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <Button
      variant="link"
      size="sm"
      className={`h-auto p-0 font-medium ${copied ? "text-green-600" : ""}`}
      onClick={handleCopy}
    >
      {copied ? "Copied!" : text}
    </Button>
  )
}

export function Bugs() {
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
    if (!selectedBug || !supabase) return
    try {
      setUpdating(true)
      const { error: err } = await supabase
        .from("bugs")
        .delete()
        .eq("bug_id", selectedBug.bug_id)

      if (err) throw err
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
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="flex gap-2">
          <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-4 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
          <div className="h-4 w-4 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
        </div>
        <p className="text-sm text-muted-foreground">Loading bugs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-center gap-2">
        <AlertCircle className="size-5 text-destructive" />
        <p className="text-destructive">Error loading bugs: {error}</p>
      </div>
    )
  }

  if (bugs.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No bugs have been reported yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Bug Tracker</h2>

      <div className="rounded-lg border overflow-x-auto">
        <Table className="table-fixed min-w-[1080px]">
          <TableHeader className="bg-muted text-sm">
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
                    ? "opacity-60"
                    : "cursor-pointer hover:bg-muted/50"
                }
                onClick={() => handleRowClick(bug)}
              >
                <TableCell className="min-w-[120px] w-[120px] font-medium">{bug.bug_type ?? "N/A"}</TableCell>
                <TableCell className="min-w-[100px] w-[100px] text-muted-foreground">
                  {formatDate(bug.bug_submissiondate)}
                </TableCell>
                <TableCell className="min-w-[160px] w-[160px] break-all">
                  {bug.bug_contactemail ? (
                    <CopyToClipboard text={bug.bug_contactemail} />
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell className="min-w-[500px] w-[500px] max-w-[500px] whitespace-normal break-words">
                  {bug.bug_detail ?? "No details provided"}
                </TableCell>
                <TableCell className="min-w-[80px] w-[80px]">
                  {bug.bug_file_url ? (
                    <a
                      href={bug.bug_file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="size-3" />
                      View
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="min-w-[80px] w-[80px]">
                  <Badge
                    variant={bug.bug_completion ? "secondary" : "outline"}
                    className={
                      bug.bug_completion
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-blue-600 text-white border-blue-300 dark:bg-blue-600 dark:text-white dark:border-blue-300"
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

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setSelectedBug(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Bug</DialogTitle>
          </DialogHeader>
          {selectedBug && (
            <div className="min-w-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                Has this bug been resolved?
              </p>
              <div className="min-w-0 overflow-hidden rounded-md border bg-muted/50 p-3 space-y-1">
                <p className="font-medium">{selectedBug.bug_type}</p>
                <p className="break-words text-sm text-muted-foreground">
                  {selectedBug.bug_detail}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleModalClose}>
              No
            </Button>
            <Button
              onClick={markAsResolved}
              disabled={updating}
            >
              {updating ? "Updating..." : "Yes, Resolved"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
