import { Bricolage_Grotesque, Figtree } from "next/font/google"

export const echoDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-echo-display",
})

export const echoBody = Figtree({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-echo-body",
})

export const echoFontClassName = `${echoDisplay.variable} ${echoBody.variable}`
