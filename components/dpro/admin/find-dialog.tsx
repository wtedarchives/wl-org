"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getUserProfileUrl } from "@/lib/user-profile-url"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FindDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FindDialog({ open, onOpenChange }: FindDialogProps) {
  const router = useRouter()
  const [showId, setShowId] = useState("")
  const [userId, setUserId] = useState("")

  const handleFindShow = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = showId.trim()
    if (!trimmed) return
    onOpenChange(false)
    router.push(getSetlistArchiveUrl(trimmed))
    setShowId("")
  }

  const handleFindUser = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = userId.trim()
    if (!trimmed) return
    onOpenChange(false)
    router.push(getUserProfileUrl(trimmed))
    setUserId("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Find</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <form onSubmit={handleFindShow} className="space-y-2">
            <Label htmlFor="show-id">Show ID</Label>
            <div className="flex gap-2">
              <Input
                id="show-id"
                placeholder="Enter show UUID"
                value={showId}
                onChange={(e) => setShowId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!showId.trim()}>
                Go
              </Button>
            </div>
          </form>
          <form onSubmit={handleFindUser} className="space-y-2">
            <Label htmlFor="user-id">User ID</Label>
            <div className="flex gap-2">
              <Input
                id="user-id"
                placeholder="Enter user UUID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!userId.trim()}>
                Go
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
