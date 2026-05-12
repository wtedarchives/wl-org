"use client"

export function WlHomeV2ArchiveAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="wl-home-v2-archive-admin-layout">
      <div className="wl-home-v2-archive-admin-layout__inner">{children}</div>
    </div>
  )
}
