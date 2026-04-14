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

interface SetlistWtedLoginRequiredDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SetlistWtedLoginRequiredDialog({
  open,
  onOpenChange,
}: SetlistWtedLoginRequiredDialogProps) {
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
          <AlertDialogDescription>
            You must be logged in to request songs on WTED Goose Radio.
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
