"use client"

import * as React from "react"

import { DevAuthMockBar } from "@/components/dev-auth-mock-bar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/components/auth-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={0}>
      <AuthProvider>
        {children}
        <DevAuthMockBar />
      </AuthProvider>
    </TooltipProvider>
  )
}

