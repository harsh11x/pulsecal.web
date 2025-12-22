"use client"

import type React from "react"

import { useState } from "react"
import { Navbar } from "./Navbar"
import { Sidebar } from "./Sidebar"
import { MobileNav } from "./MobileNav"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="hidden md:block w-64 border-r">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 relative flex">
          <div className="flex-1 w-full min-w-0">
            {children}
          </div>

          {/* Right Panel - Dual Side Panel Logic */}
          <div className="hidden xl:block w-80 ml-6 shrink-0 relative">
            <div className="sticky top-0 space-y-4">
              {/* This would ideally be dynamic based on the user type or passed as a prop */}
              {/* For now, we'll put a placeholder or a 'Quick Actions' component */}
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="font-semibold mb-2">Quick Actions</h3>
                <div className="grid gap-2">
                  <button className="text-sm text-left p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors">
                    + New Appointment
                  </button>
                  <button className="text-sm text-left p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors">
                    + Add Patient record
                  </button>
                  <button className="text-sm text-left p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors">
                    Check Notifications
                  </button>
                </div>
              </div>

              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="font-semibold mb-2">Upcoming Alerts</h3>
                <p className="text-sm text-muted-foreground">No urgent alerts.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <MobileNav />

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>
    </div>
  )
}
