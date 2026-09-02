import { echoFontClassName } from "@/components/echo/echo-fonts"

export default function ArchiveEchoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={`${echoFontClassName} contents`}>{children}</div>
}
