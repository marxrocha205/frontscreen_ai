"use client"

import { useEffect, useState } from "react"
import { Users, MessageSquare, Coins, History, Loader2, AlertCircle, DollarSign, BrainCircuit, Activity } from "lucide-react"
import { MetricCard } from "../components/MetricCard"
import { TrendsChart, TrendData } from "../components/TrendsChart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];

export function DashboardTab() {
  const [metrics, setMetrics] = useState<any>(null)
  const [trends, setTrends] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. DADOS FAKE: MÉTRICAS PRINCIPAIS
    const fakeMetrics = {
      total_users: 214,
      total_sessions: 15420,
      total_messages: 89432,
      total_revenue_brl: 1907.00, // VALOR ALVO
      total_cost_usd: 18.45,
      online_users: Math.floor(Math.random() * 15) + 12, // Entre 12 e 27 usuários online
      cost_by_model: [
        { model: "gpt-4o", cost_usd: 12.20 },
        { model: "claude-3.5-sonnet", cost_usd: 4.15 },
        { model: "gemini-1.5-pro", cost_usd: 2.10 }
      ],
      subs_by_plan: [
        { plan: "Free", count: 114 },
        { plan: "Pro", count: 68 },
        { plan: "Plus", count: 32 }
      ]
    }

    // 2. DADOS FAKE: GRÁFICO DE 30 DIAS (Gerando histórico)
    const generate30DaysTrends = () => {
      const data: TrendData[] = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        
        // Simula receita diária para somar visualmente algo em torno do valor total
        const dailyRevenue = Math.floor(Math.random() * 40) + 30 
        
        data.push({
          date: `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`,
          full_date: d.toISOString(),
          users: Math.floor(Math.random() * 8) + 2, // Novos usuários no dia
          sessions: Math.floor(Math.random() * 150) + 50, // Sessões no dia
          revenue: dailyRevenue
        })
      }
      return data
    }

    // Simula um tempo de carregamento para parecer real
    setTimeout(() => {
      setMetrics(fakeMetrics)
      setTrends(generate30DaysTrends())
      setLoading(false)
    }, 800)

  }, [])

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>

  return (
    <div className="space-y-6">
      
      {/* 1. NÚMEROS GIGANTES (Financeiro + KPIs) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        
        {/* Receita em Verde */}
        <div className="col-span-1">
          <Card className="bg-emerald-500/10 border border-emerald-500/20 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-400">Receita Total</CardTitle>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-300">R$ {metrics?.total_revenue_brl.toFixed(2)}</div>
              <p className="text-xs text-emerald-500/70 mt-1">LTV Acumulado</p>
            </CardContent>
          </Card>
        </div>

        {/* Custo em Vermelho */}
        <div className="col-span-1">
          <Card className="bg-red-500/10 border border-red-500/20 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-400">Custo Total (IA)</CardTitle>
              <BrainCircuit className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-300">$ {metrics?.total_cost_usd.toFixed(2)}</div>
              <p className="text-xs text-red-500/70 mt-1">Custo global de APIs</p>
            </CardContent>
          </Card>
        </div>

        {/* Usuários Online (NOVO) */}
        <div className="col-span-1">
          <Card className="bg-blue-500/10 border border-blue-500/20 shadow-sm h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
               <span className="flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
               </span>
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-400">Online Agora</CardTitle>
              <Activity className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-300">{metrics?.online_users}</div>
              <p className="text-xs text-blue-500/70 mt-1">Tempo real</p>
            </CardContent>
          </Card>
        </div>

        <MetricCard title="Utilizadores" value={metrics?.total_users || 0} icon={<Users className="h-4 w-4 text-zinc-400" />} description="Contas registadas" />
        <MetricCard title="Sessões Totais" value={metrics?.total_sessions || 0} icon={<History className="h-4 w-4 text-zinc-400" />} description="Conversas geradas" />
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
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={metrics.subs_by_plan} dataKey="count" nameKey="plan" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {metrics.subs_by_plan.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }} itemStyle={{ color: '#f4f4f5' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico: Custos por IA */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">Custo por Modelo (USD)</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">Onde o dinheiro da infraestrutura está a ser gasto.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={metrics.cost_by_model} dataKey="cost_usd" nameKey="model" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {metrics.cost_by_model.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }} 
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* 3. GRÁFICO DE TENDÊNCIAS (30 DIAS) */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-base">Desempenho e Receita Diária (Últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendsChart data={trends} />
        </CardContent>
      </Card>

    </div>
  )
}
