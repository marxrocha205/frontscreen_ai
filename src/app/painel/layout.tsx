"use client"

import { ReactNode, Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { LayoutDashboard, Users, Activity, HardDrive, Radio, Settings, ShieldCheck, Database, CreditCard, Menu, X } from 'lucide-react'

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'dashboard'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'sessions', label: 'Sessions', icon: Activity },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'websockets', label: 'Websockets', icon: Radio },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ]

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-zinc-950 text-zinc-100 min-h-screen">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950 z-20">
        <div className="flex items-center gap-3">
          <img src="/logobranco-semfundo.png" alt="ScreenAI Logo" className="h-8 object-contain" />
          <h2 className="text-lg font-semibold tracking-tight">Admin</h2>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 text-zinc-300"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-30" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-40 transform 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        transition-transform duration-300 ease-in-out
        w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col p-4 flex-shrink-0
      `}>
        <div className="hidden md:flex items-center gap-3 mb-8 px-2 mt-2">
          <img src="/logobranco-semfundo.png" alt="ScreenAI Logo" className="h-10 object-contain" />
          <h2 className="text-lg font-semibold tracking-tight">ScreenAI Admin</h2>
        </div>
        <nav className="flex flex-col gap-1">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id
            return (
              <Link
                key={tab.id}
                href={`/painel?tab=${tab.id}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${isActive
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto px-2 pb-2 text-xs text-zinc-600">
          <Link href="/login" className="hover:text-zinc-400 transition-colors">
            &larr; Back to Platform
          </Link>
        </div>
      </div>
      {/* CORREÇÃO: Fundo escuro restaurado */}
      <div className="flex-1 overflow-y-auto bg-zinc-950">
        {children}
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-zinc-950" />}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  )
}
