import dynamic from "next/dynamic"
import { SetlistBreadcrumbProvider } from "@/components/setlist-breadcrumb-context"
import { SiteHeader } from "@/components/site-header"
import { YearBreadcrumbProvider } from "@/components/year-breadcrumb-context"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

const AppSidebar = dynamic(
  () => import("@/components/app-sidebar").then((mod) => mod.AppSidebar),
  {
    ssr: false,
    loading: () => (
      <div
        className="hidden shrink-0 md:block"
        style={{ width: "var(--sidebar-width)" }}
      />
    ),
  }
)

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
      <AppSidebar variant="inset" />
      <SidebarInset>
        <YearBreadcrumbProvider>
          <SetlistBreadcrumbProvider>
            <SiteHeader />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              {children}
            </div>
            {modal}
          </SetlistBreadcrumbProvider>
        </YearBreadcrumbProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
