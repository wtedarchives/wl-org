import { AppSidebarClient } from "@/components/app-sidebar-client"
import { NotFoundContent } from "@/components/not-found-content"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function NotFound() {
  return (
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
        <SiteHeader breadcrumbOverride="Page not found" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-1 flex-col">
              <NotFoundContent />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
