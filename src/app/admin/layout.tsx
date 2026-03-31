"use client"

import { ReactNode, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { LayoutDashboard, Users, Activity, HardDrive, Radio, Settings, ShieldCheck, Database, CreditCard } from 'lucide-react'

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'dashboard'

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'sessions', label: 'Sessions', icon: Activity },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'websockets', label: 'Websockets', icon: Radio },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'vad-logs', label: 'VAD Logs', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'audit', label: 'Audit', icon: ShieldCheck },
  ]

  return (
    <div className="flex h-full w-full bg-zinc-950 text-zinc-100 min-h-screen">
      <div className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col p-4 flex-shrink-0">
         <div className="flex items-center gap-2 mb-8 px-2 mt-2">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
            <h2 className="text-lg font-semibold tracking-tight">ScreenAI Admin</h2>
         </div>
         <nav className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id
              return (
                <Link 
                  key={tab.id} 
                  href={`/admin?tab=${tab.id}`} 
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                    isActive 
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
      <AdminLayoutContent children={children} />
    </Suspense>
  )
}