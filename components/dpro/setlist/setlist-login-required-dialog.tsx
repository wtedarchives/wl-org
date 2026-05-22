"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SetlistLoginRequiredDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Defaults to the rating copy for backward compatibility. */
  description?: string
}

export function SetlistLoginRequiredDialog({
  open,
  onOpenChange,
  description = "You must be logged in to rate this show.",
}: SetlistLoginRequiredDialogProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogin = () => {
    onOpenChange(false)
    router.push(`/login?from=${encodeURIComponent(pathname || "/")}`)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Login Required</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogin}>Log In</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
