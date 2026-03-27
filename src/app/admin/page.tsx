"use client"

import { useSearchParams } from "next/navigation"
import { DashboardTab } from "./tabs/DashboardTab"
import { UsersTab } from "./tabs/UserTab"
import { SessionsTab } from "./tabs/SessionsTab"

// Importe as outras abas conforme for criando:
// import { UsersTab } from "./tabs/UsersTab"
// import { SessionsTab } from "./tabs/SessionsTab"

/**
 * AdminPage (Orquestrador)
 * Responsabilidade: Ler a URL e renderizar o componente (Aba) correspondente.
 * Sem dependências de Data Fetching direto.
 */
export default function AdminPage() {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'dashboard'

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardTab />
      case 'users':
        // return <UsersTab />  <- Descomente após criar o arquivo
        return <UsersTab />
      case 'sessions':
        // return <SessionsTab /> <- Descomente após criar o arquivo
        return <SessionsTab />
      case 'storage':
        return (
          <div className="flex h-[400px] flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-xl">
            <h3 className="text-lg font-semibold text-zinc-500">Módulo em Desenvolvimento</h3>
            <p className="text-sm text-zinc-400">Integração S3/GCS em breve.</p>
          </div>
        )
      default:
        return (
          <div className="flex h-[400px] flex-col items-center justify-center text-zinc-500">
            Aba não encontrada.
          </div>
        )
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 capitalize">
          {currentTab.replace('-', ' ')}
        </h2>
        <p className="text-zinc-500 text-sm mt-1">
          Monitorização e controlo geral do sistema.
        </p>
      </div>
      
      {/* O renderizador limpo e elegante */}
      {renderContent()}
    </div>
  )
}