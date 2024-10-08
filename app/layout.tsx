import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "KJØLESKAPET",
  description: "Administrer ditt kjøleskap enkelt og effektivt",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="no">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}