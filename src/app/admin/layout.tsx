'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ReactNode } from 'react'
import { I18nProvider, useI18n } from '@/lib/i18n/context'

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { locale, setLocale, t } = useI18n()

  const TABS = [
    { label: t('admin', 'dashboard'), href: '/admin' },
    { label: t('admin', 'curriculum'), href: '/admin/curriculum' },
    { label: t('admin', 'schoolInput'), href: '/admin/school-input' },
    { label: t('admin', 'rewards'), href: '/admin/rewards' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t('admin', 'title')}</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocale(locale === 'en' ? 'ko' : 'en')}
              className="text-sm px-3 py-1 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
            >
              {locale === 'en' ? '🇰🇷 한국어' : '🇺🇸 English'}
            </button>
            <span className="text-sm text-gray-400">{t('admin', 'admin')}</span>
          </div>
        </div>
      </header>

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

      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </I18nProvider>
  )
}
