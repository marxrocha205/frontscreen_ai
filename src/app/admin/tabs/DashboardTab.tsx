"use client"

import { useEffect, useState } from "react"
import { Users, MessageSquare, Coins, History, Loader2, AlertCircle } from "lucide-react"
import { MetricCard } from "../components/MetricCard"

// Tipagem movida para o contexto onde é realmente utilizada
interface AdminMetrics {
  total_users: number
  total_sessions: number
  total_messages: number
  total_credits_in_circulation: number
}

export function DashboardTab() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // AbortController: Boa prática sênior para cancelar requisições 
    // caso o usuário troque de aba antes do fetch terminar.
    const controller = new AbortController()

    async function fetchMetrics() {
      try {
        const token = localStorage.getItem("access_token")
        if (!token) throw new Error("Não autenticado")

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        })

        if (!res.ok) throw new Error("Falha ao carregar métricas")

        const data = await res.json()
        setMetrics(data.data)
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()

    // Cleanup function do useEffect
    return () => controller.abort()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500 gap-2">
        <AlertCircle className="h-5 w-5" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard 
        title="Total Users" 
        value={metrics?.total_users || 0} 
        icon={<Users className="h-4 w-4 text-muted-foreground" />} 
        description="Registered accounts" 
      />
      <MetricCard 
        title="Sessions" 
        value={metrics?.total_sessions || 0} 
        icon={<History className="h-4 w-4 text-muted-foreground" />} 
        description="Active & past chats" 
      />
      <MetricCard 
        title="Messages" 
        value={metrics?.total_messages || 0} 
        icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />} 
        description="Total interactions" 
      />
      <MetricCard 
        title="Active Credits" 
        value={metrics?.total_credits_in_circulation || 0} 
        icon={<Coins className="h-4 w-4 text-muted-foreground" />} 
        description="System liabilities" 
      />
    </div>
  )
}