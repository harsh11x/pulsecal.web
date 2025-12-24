import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PulseCal - Healthcare Management Platform",
  description: "Enterprise healthcare SaaS platform for comprehensive medical management, appointment scheduling, and patient care solutions",
  generator: "v0.app",
  metadataBase: new URL('https://pulsecal.com'),
  keywords: ["healthcare", "medical management", "appointment scheduling", "patient care", "telemedicine", "clinic management"],
  authors: [{ name: "PulseCal" }],
  openGraph: {
    title: "PulseCal - Healthcare Management Platform",
    description: "Enterprise healthcare SaaS platform for comprehensive medical management",
    url: "https://pulsecal.com",
    siteName: "PulseCal",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "PulseCal Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PulseCal - Healthcare Management Platform",
    description: "Enterprise healthcare SaaS platform for comprehensive medical management",
    images: ["/logo.jpg"],
  },
  icons: {
    icon: [
      {
        url: "/logo.jpg",
        sizes: "any",
      },
    ],
    apple: "/logo.jpg",
    shortcut: "/logo.jpg",
  },
}

export const viewport: Viewport = {
  themeColor: "#3498db",
  width: "device-width",
  initialScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body className={`font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
