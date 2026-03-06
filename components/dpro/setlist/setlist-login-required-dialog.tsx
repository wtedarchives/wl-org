"use client"

import { useRouter } from "next/navigation"
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
}

export function SetlistLoginRequiredDialog({
  open,
  onOpenChange,
}: SetlistLoginRequiredDialogProps) {
  const router = useRouter()

  const handleLogin = () => {
    onOpenChange(false)
    router.push("/login")
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Login Required</AlertDialogTitle>
          <AlertDialogDescription>
            You must be logged in to rate this show.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogin}>Log In</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
