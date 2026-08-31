import { Bricolage_Grotesque, Figtree } from "next/font/google"

const echoDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-echo-display",
})

const echoBody = Figtree({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-echo-body",
})

export default function ArchiveEchoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${echoDisplay.variable} ${echoBody.variable} contents`}>
      {children}
    </div>
  )
}
