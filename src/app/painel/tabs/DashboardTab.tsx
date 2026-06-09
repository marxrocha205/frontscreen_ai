"use client"

import { useEffect, useState } from "react"
import { Users, MessageSquare, Loader2, DollarSign, BrainCircuit, Activity, Zap, RefreshCw } from "lucide-react"
import { MetricCard } from "../components/MetricCard"
import { TrendsChart, TrendData } from "../components/TrendsChart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { config } from "@/lib/config"

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4']

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)

export function DashboardTab() {
  const [trends, setTrends] = useState<TrendData[]>([])
  const [liveData, setLiveData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1] || localStorage.getItem('access_token')

    const fetchData = async () => {
      try {
        const [metricsRes, trendsRes] = await Promise.all([
          fetch(`${config.apiUrl}/api/admin/metrics`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${config.apiUrl}/api/admin/metrics/trends`, { headers: { Authorization: `Bearer ${token}` } })
        ])

        if (metricsRes.ok) {
          const mJson = await metricsRes.json()
          setLiveData(mJson.data)
        }

        if (trendsRes.ok) {
          const tJson = await trendsRes.json()
          setTrends(tJson.data.map((d: any) => ({
            time: d.date,
            sessions: d.sessions,
            messages: d.messages
          })))
        }
      } catch (e) {
        console.error("Erro ao buscar dados do Dashboard:", e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000) // Atualiza a cada 10s
    return () => clearInterval(interval)
  }, [])

  if (loading || !liveData) return <div className="flex h-64 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1º BLOCO: Finanças e Renovações */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-1">
          <Card className="bg-zinc-950 border-zinc-800 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">Receita Total</CardTitle>
              <DollarSign className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-100">{formatBRL(liveData.total_revenue_brl)}</div>
              <p className="text-xs text-zinc-500 mt-1">Faturamento Consolidado do Período</p>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card className="bg-zinc-950 border-zinc-800 shadow-sm h-full transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">Custo Total (IA)</CardTitle>
              <BrainCircuit className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">${liveData.total_cost_usd?.toFixed(4)}</div>
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">Consumo real em dólares</p>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card className="bg-zinc-950 border-zinc-800 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">Passivo de Créditos</CardTitle>
              <RefreshCw className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-100">{liveData.total_credits_in_circulation?.toLocaleString()}</div>
              <p className="text-xs text-zinc-500 mt-1">Créditos não utilizados pelos clientes</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2º BLOCO: Tráfego e Utilizadores */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        <div className="col-span-1">
          <Card className="bg-zinc-950 border-zinc-800 shadow-sm h-full relative overflow-hidden transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">Total de Clientes</CardTitle>
              <Users className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-100">{liveData.total_users}</div>
              <p className="text-xs text-zinc-500 mt-1">Contas Registradas</p>
            </CardContent>
          </Card>
        </div>

        <MetricCard title="Sessões Ativas" value={liveData.total_sessions} icon={<Activity className="h-4 w-4 text-amber-400" />} description="Chats iniciados" />
        <MetricCard title="Total Conversas" value={liveData.total_messages.toLocaleString()} icon={<MessageSquare className="h-4 w-4 text-indigo-400" />} description="Mensagens trocadas" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">Distribuição de Planos</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">Assinaturas ativas por tipo.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={liveData.subs_by_plan} dataKey="count" nameKey="plan" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {liveData.subs_by_plan?.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }} itemStyle={{ color: '#f4f4f5' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">Custo por API (USD)</CardTitle>
            <CardDescription className="text-zinc-400 text-xs flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Gastos baseados no log de uso
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={liveData.cost_by_model} dataKey="cost_usd" nameKey="model" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} isAnimationActive={false}>
                  {liveData.cost_by_model?.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => `$${Number(value ?? 0).toFixed(4)}`} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-base">Tráfego e Conversas (Últimos 7 Dias)</CardTitle>
          <CardDescription className="text-zinc-400 text-xs">Monitorização do banco de dados.</CardDescription>
        </CardHeader>
        <CardContent>
          {trends.length > 0 ? <TrendsChart data={trends} /> : <div className="text-zinc-500 text-sm py-10 text-center">Sem dados suficientes</div>}
        </CardContent>
      </Card>
    </div>
  )
}
