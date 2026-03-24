import { ReactNode } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Users, Activity, HardDrive, Radio, Settings, ShieldCheck, Database, CreditCard } from 'lucide-react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const tabs = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Users', icon: Users },
    { label: 'Sessions', icon: Activity },
    { label: 'Storage', icon: HardDrive },
    { label: 'Websockets', icon: Radio },
    { label: 'Billing', icon: CreditCard },
    { label: 'VAD Logs', icon: Database },
    { label: 'Settings', icon: Settings },
    { label: 'Audit', icon: ShieldCheck },
  ]

  return (
    <div className="flex h-full w-full bg-zinc-950 text-zinc-100 min-h-screen">
      <div className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col p-4 flex-shrink-0">
         <div className="flex items-center gap-2 mb-8 px-2 mt-2">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
            <h2 className="text-lg font-semibold tracking-tight">ScreenAI Admin</h2>
         </div>
         <nav className="flex flex-col gap-1">
            {tabs.map((tab, i) => (
              <a key={i} href="#" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${i === 0 ? 'bg-zinc-900 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'}`}>
                 <tab.icon className="w-4 h-4" />
                 {tab.label}
              </a>
            ))}
         </nav>
         
         <div className="mt-auto px-2 pb-2 text-xs text-zinc-600">
           <Link href="/login" className="hover:text-zinc-400 transition-colors">
             &larr; Back to Platform
           </Link>
         </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
