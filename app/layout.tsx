import type { Metadata, Viewport } from "next";
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

/**
 * Locks pinch zoom (discouraged for a11y; chosen to avoid iOS input-focus zoom
 * and keep layout stable on phones — prefer raising form font sizes later).
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "WysteriaLane.org",
    /**
     * `(main)` and other segments: child titles omit the suffix; this adds it.
     * Homepage and future peers live under `(wl-home-v2)` with `— WysteriaLane.org` (see that layout).
     */
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
