"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, BarChart3, Home, TrendingUp } from "lucide-react"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center">
            <BarChart3 className="h-6 w-6 text-primary mr-2" />
            <span>InfluenceIQ</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent"
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent"
          >
            <BarChart3 className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/top-creators"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent"
          >
            <TrendingUp className="h-5 w-5" />
            <span>Top Creators</span>
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

