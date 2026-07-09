"use client"

import * as React from "react"
import { QueryClientProvider } from "@tanstack/react-query"

import { DevAuthMockBar } from "@/components/dev-auth-mock-bar"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/components/auth-context"
import { createArchiveQueryClient } from "@/lib/archive-query-client"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(createArchiveQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <AuthProvider>
          {children}
          <DevAuthMockBar />
          <Toaster richColors closeButton position="top-center" />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

