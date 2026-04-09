"use client"

import { useEffect, useState } from "react"
import { Users, MessageSquare, Coins, History, Loader2, AlertCircle, DollarSign, BrainCircuit } from "lucide-react"
import { MetricCard } from "../components/MetricCard"
import { TrendsChart, TrendData } from "../components/TrendsChart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { config } from "@/lib/config"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface AdminMetrics {
  total_users: number
  total_sessions: number
  total_messages: number
  total_credits_in_circulation: number
  total_revenue_brl: number
  total_cost_usd: number
  cost_by_model: { model: string, cost_usd: number }[]
  subs_by_plan: { plan: string, count: number }[]
}

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];

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
        const baseUrl = config.apiUrl

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

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>
  if (error) return <div className="flex h-64 items-center justify-center text-red-500 gap-2"><AlertCircle className="h-5 w-5" /><p>{error}</p></div>

  return (
    <div className="space-y-6">
      
      {/* 1. NÚMEROS GIGANTES (Financeiro + KPIs) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Receita em Verde */}
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
          <Card className="bg-emerald-500/10 border border-emerald-500/20 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-400">Receita Total</CardTitle>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-300">R$ {metrics?.total_revenue_brl.toFixed(2)}</div>
              <p className="text-xs text-emerald-500/70 mt-1">Processado via AlphaPay</p>
            </CardContent>
          </Card>
        </div>

        {/* Custo em Vermelho */}
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
          <Card className="bg-red-500/10 border border-red-500/20 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-400">Custo Total (IA)</CardTitle>
              <BrainCircuit className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-300">$ {metrics?.total_cost_usd.toFixed(4)}</div>
              <p className="text-xs text-red-500/70 mt-1">Custo global de APIs</p>
            </CardContent>
          </Card>
        </div>

        <MetricCard title="Utilizadores" value={metrics?.total_users || 0} icon={<Users className="h-4 w-4 text-zinc-400" />} description="Contas registadas" />
        <MetricCard title="Sessões Ativas" value={metrics?.total_sessions || 0} icon={<History className="h-4 w-4 text-zinc-400" />} description="Conversas criadas" />
      </div>

      {/* 2. GRÁFICOS DE PIZZA (Distribuição) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        
        {/* Gráfico: Assinaturas Ativas */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">Distribuição de Planos</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">Utilizadores ativos por tipo de assinatura.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {metrics?.subs_by_plan && metrics.subs_by_plan.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.subs_by_plan} dataKey="count" nameKey="plan" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {metrics.subs_by_plan.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }} itemStyle={{ color: '#f4f4f5' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-sm">Sem dados de assinaturas.</div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico: Custos por IA */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">Custo por Modelo (USD)</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">Onde o dinheiro da infraestrutura está a ser gasto.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
             {metrics?.cost_by_model && metrics.cost_by_model.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.cost_by_model} dataKey="cost_usd" nameKey="model" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {metrics.cost_by_model.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => `$${Number(value).toFixed(4)}`}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-zinc-500 text-sm">Sem dados de consumo.</div>
             )}
          </CardContent>
        </Card>

      </div>

      {/* 3. GRÁFICO DE TENDÊNCIAS (Já existia) */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-base">Crescimento da Plataforma (7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {trends.length > 0 ? <TrendsChart data={trends} /> : <div className="h-[300px] flex items-center justify-center text-zinc-500">Sem dados.</div>}
        </CardContent>
      </Card>

    </div>
  )
}