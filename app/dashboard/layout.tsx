'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Brain, LogOut, BarChart3, Users, Zap, Settings, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: BarChart3 },
    { href: '/dashboard/customers', label: 'Customers', icon: Users },
    { href: '/dashboard/segments', label: 'Segments', icon: Zap },
    { href: '/dashboard/import', label: 'Import Data', icon: FileText },
    { href: '/dashboard/insights', label: 'AI Insights', icon: Brain },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="h-16 border-b border-border flex items-center gap-2 px-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Lyrtic</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-2">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 h-16 flex items-center px-6">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-4">
              <button className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 transition">
                <span className="sr-only">Notifications</span>
                <span>🔔</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
