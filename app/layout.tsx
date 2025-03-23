import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Providers } from "@/components/providers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart3 } from "lucide-react"
import { MobileNav } from "@/components/mobile-nav"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "InfluenceIQ - YouTube Creator Influence Analysis",
  description: "Analyze YouTube creators based on credibility, influence, and engagement",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <header className="border-b">
              <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link href="/" className="flex items-center">
                  <BarChart3 className="h-6 w-6 text-primary mr-2" />
                  <span className="font-bold text-xl">InfluenceIQ</span>
                </Link>
                <nav className="hidden md:block">
                  <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                      <Button variant="ghost">Dashboard</Button>
                    </Link>
                    <Link href="/top-creators">
                      <Button variant="ghost">Top Creators</Button>
                    </Link>
                  </div>
                </nav>
                <MobileNav />
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6">
              <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                <p>InfluenceIQ - YouTube Creator Influence Analysis</p>
                <p className="mt-1">Built with Next.js and Firebase</p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}



import './globals.css'