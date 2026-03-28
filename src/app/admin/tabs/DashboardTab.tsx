"use client"

import { useEffect, useState } from "react"
import { Users, MessageSquare, Coins, History, Loader2, AlertCircle } from "lucide-react"
import { MetricCard } from "../components/MetricCard"
import { TrendsChart, TrendData } from "../components/TrendsChart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface AdminMetrics {
  total_users: number
  total_sessions: number
  total_messages: number
  total_credits_in_circulation: number
}

export function DashboardTab() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [trends, setTrends] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchDashboardData() {
      try {
        const token = localStorage.getItem("access_token")
        if (!token) throw new Error("Não autenticado")

        const headers = { Authorization: `Bearer ${token}` }
        const baseUrl = process.env.NEXT_PUBLIC_API_URL

        // Promise.all executa as chamadas em paralelo, reduzindo o tempo de espera a metade
        const [metricsRes, trendsRes] = await Promise.all([
          fetch(`${baseUrl}/api/admin/metrics`, { headers, signal: controller.signal }),
          fetch(`${baseUrl}/api/admin/metrics/trends?days=7`, { headers, signal: controller.signal })
        ])

        if (!metricsRes.ok || !trendsRes.ok) throw new Error("Falha ao carregar dados da dashboard")

        const metricsData = await metricsRes.json()
        const trendsData = await trendsRes.json()

        setMetrics(metricsData.data)
        setTrends(trendsData.data)
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()

    return () => controller.abort()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
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
    <div className="space-y-6">
      {/* 1. Secção de KPIs (Valores Totais) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Users" 
          value={metrics?.total_users || 0} 
          icon={<Users className="h-4 w-4 text-zinc-400" />} 
          description="Contas registadas" 
        />
        <MetricCard 
          title="Sessions" 
          value={metrics?.total_sessions || 0} 
          icon={<History className="h-4 w-4 text-zinc-400" />} 
          description="Sessões ativas e passadas" 
        />
        <MetricCard 
          title="Messages" 
          value={metrics?.total_messages || 0} 
          icon={<MessageSquare className="h-4 w-4 text-zinc-400" />} 
          description="Total de interações" 
        />
        <MetricCard 
          title="Active Credits" 
          value={metrics?.total_credits_in_circulation || 0} 
          icon={<Coins className="h-4 w-4 text-zinc-400" />} 
          description="Passivo do sistema" 
        />
      </div>

      {/* 2. Secção Gráfica (Tendências Temporais) */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-7 bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Crescimento da Plataforma</CardTitle>
            <CardDescription className="text-zinc-400">
              Volume de novas sessões e utilizadores nos últimos 7 dias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trends.length > 0 ? (
              <TrendsChart data={trends} />
            ) : (
              <div className="h-[350px] flex items-center justify-center text-zinc-500">
                Sem dados suficientes para gerar o gráfico.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}