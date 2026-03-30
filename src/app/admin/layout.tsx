'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ReactNode } from 'react'

const TABS = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Curriculum', href: '/admin/curriculum' },
  { label: 'School Input', href: '/admin/school-input' },
  { label: 'Rewards & Messages', href: '/admin/rewards' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">AK Learning Platform</h1>
          <span className="text-sm text-gray-400">Admin</span>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-5xl mx-auto flex gap-1 -mb-px">
          {TABS.map((tab) => {
            const isActive = tab.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(tab.href)

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-amber-500 text-amber-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
