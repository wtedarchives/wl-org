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
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: {
    default: "WTEDRadio.com",
    /**
     * All routes use `(wl-home-v2)`; child titles omit the suffix except the homepage group.
     */
    template: "%s – WTEDRadio.com",
  },
  description: "WTEDRadio.com",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/192.png", sizes: "192x192", type: "image/png" },
      { url: "/512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "WTED",
    statusBarStyle: "black-translucent",
  },
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
