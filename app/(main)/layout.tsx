import { Suspense } from "react"
import { AppSidebarClient } from "@/components/app-sidebar-client"
import { MobileRadioBar } from "@/components/mobile-radio-bar"
import { SetlistBreadcrumbProvider } from "@/components/setlist-breadcrumb-context"
import { SiteHeader } from "@/components/site-header"
import { SubmitModalHandler } from "@/components/submit-modal-handler"
import { YearBreadcrumbProvider } from "@/components/year-breadcrumb-context"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function MainLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebarClient variant="inset" />
      <SidebarInset>
        <YearBreadcrumbProvider>
          <SetlistBreadcrumbProvider>
            <MobileRadioBar />
            <SiteHeader />
            <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
              {children}
            </div>
            {modal}
            <Suspense fallback={null}>
              <SubmitModalHandler />
            </Suspense>
          </SetlistBreadcrumbProvider>
        </YearBreadcrumbProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
