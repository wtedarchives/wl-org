"use client"

import dynamic from "next/dynamic"

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

export function AppSidebarClient(
  props: React.ComponentProps<typeof import("@/components/app-sidebar").AppSidebar>
) {
  return <AppSidebar {...props} />
}
