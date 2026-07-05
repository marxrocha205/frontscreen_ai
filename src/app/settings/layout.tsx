"use client"

import { ReactNode, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, User, Palette, Mic, Menu, X, Settings } from 'lucide-react'
import { useI18n } from '@/context/i18n-context'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { t, language } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const { isLoggedIn, hasHydrated, syncFromStorage } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    syncFromStorage()
  }, [syncFromStorage])

  useEffect(() => {
    if (hasHydrated && !isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, hasHydrated, router])

  const navItems = [
    {
      label: language === 'pt-BR' ? 'Configurar Perfil' : 'Profile Settings',
      icon: Settings,
      href: '/settings',
      active: pathname === '/settings' || pathname === '/settings/profile'
    },
    // Futuras abas (comentadas ou desabilitadas visualmente, mas o usuário pediu só 1 por enquanto, então deixarei as outras ocultas ou com aspecto de "em breve" se quisesse. Vamos manter apenas 1 conforme solicitado: "no momento só terá 1")
  ]

  return (
    <div className="flex h-[100dvh] w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">

      {/* Mobile Header / Sidebar Toggle */}
      <div className="lg:hidden absolute top-0 left-0 right-0 h-16 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md z-40 flex items-center px-4">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 flex items-center justify-center pr-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-name-bg.png" alt="ScreenAI" className="h-7 w-auto object-contain drop-shadow-md" />
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative z-60 lg:z-0 h-full w-72 bg-[#0a0a0a] border-r border-zinc-800/50
        flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header - Back to App */}
        <div className="p-6 pb-6 border-b border-zinc-800/50 flex items-center justify-between">
          <button
            onClick={() => router.push('/app')}
            className="flex items-center gap-2 text-[15px] font-semibold text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
            {language === 'pt-BR' ? 'Configurações' : 'Settings'}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1 -mr-2 text-zinc-400 hover:text-white transition-colors rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 mt-4">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{language === 'pt-BR' ? 'Geral' : 'General'}</span>
          </div>
          {navItems.map((item, idx) => {
            const Icon = item.icon
            return (
              <Link
                key={idx}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${item.active
                    ? 'bg-zinc-800/80 text-white shadow-sm ring-1 ring-zinc-700/50'
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${item.active ? 'text-zinc-400' : 'text-zinc-500'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative bg-zinc-950 pt-16 lg:pt-0">
        <div className="max-w-3xl mx-auto w-full p-6 md:p-10 lg:p-12 min-h-full">
          {children}
        </div>
      </div>
    </div>
  )
}
