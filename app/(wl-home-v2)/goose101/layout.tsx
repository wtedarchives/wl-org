import { Fraunces } from "next/font/google"

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-goose101-serif",
})

export default function Goose101RouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={fraunces.variable}>{children}</div>
}
