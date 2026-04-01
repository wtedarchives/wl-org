import { Suspense } from "react"
import { AppSidebarClient } from "@/components/app-sidebar-client"
import { MobileRadioBar } from "@/components/mobile-radio-bar"
import { PersistentRadioRoot } from "@/components/persistent-radio"
import { PublicProfileBreadcrumbProvider } from "@/components/public-profile-breadcrumb-context"
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
    <PersistentRadioRoot>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "2.75rem",
          } as React.CSSProperties
        }
      >
        <AppSidebarClient variant="inset" />
        <SidebarInset>
          <YearBreadcrumbProvider>
            <SetlistBreadcrumbProvider>
              <PublicProfileBreadcrumbProvider>
                <MobileRadioBar />
                <SiteHeader />
                <div
                  id="main-inset-scroll"
                  className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto"
                >
                  {children}
                </div>
                {modal}
                <Suspense fallback={null}>
                  <SubmitModalHandler />
                </Suspense>
              </PublicProfileBreadcrumbProvider>
            </SetlistBreadcrumbProvider>
          </YearBreadcrumbProvider>
        </SidebarInset>
      </SidebarProvider>
    </PersistentRadioRoot>
  )
}
