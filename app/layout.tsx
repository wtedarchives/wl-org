import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PersistentRadioRoot } from "@/components/persistent-radio";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WysteriaLane.org",
    /** Child `metadata.title` values must omit " – WysteriaLane.org"; this template adds it. */
    template: "%s – WysteriaLane.org",
  },
  description: "WysteriaLane.org",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <PersistentRadioRoot>{children}</PersistentRadioRoot>
        </Providers>
      </body>
    </html>
  );
}
