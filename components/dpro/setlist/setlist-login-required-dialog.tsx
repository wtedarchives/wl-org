"use client"

import {
  useWlHomeV2LoginAction,
} from "@/components/wl-home-v2/wl-home-v2-open-login-context"
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
  const openLogin = useWlHomeV2LoginAction()

  const handleLogin = () => {
    onOpenChange(false)
    openLogin()
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
