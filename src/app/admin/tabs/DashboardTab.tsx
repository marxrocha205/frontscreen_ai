"use client"

import { useEffect, useState } from "react"
import { Users, MessageSquare, History, Loader2, DollarSign, BrainCircuit, Activity, Zap } from "lucide-react"
import { MetricCard } from "../components/MetricCard"
import { TrendsChart, TrendData } from "../components/TrendsChart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4'];

const INITIAL_STATE = {
  total_users: 168,
  total_revenue_brl: 1907.00,
  subs_by_plan: [
    { plan: "Free", count: 137 },
    { plan: "Pro", count: 22 }, 
    { plan: "Plus", count: 9 }  
  ]
}

export function DashboardTab() {
  const [loading, setLoading] = useState(true)
  const [trends, setTrends] = useState<TrendData[]>([])

  // Convertido para Reais (BRL)
  const [liveData, setLiveData] = useState({
    online_users: 42,
    active_sessions: 135,
    total_messages: 94532,
    total_sessions: 18420,
    total_cost_brl: 724.25, 
    cost_by_model: [
      { model: "ElevenLabs", cost_brl: 322.10 },
      { model: "ClaudAI", cost_brl: 218.01 },
      { model: "Gemini", cost_brl: 116.02 },
      { model: "OpenAI", cost_brl: 68.12 }
    ]
  })

  useEffect(() => {
    const generate24hTrends = () => {
      const data: TrendData[] = []
      const now = new Date()
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now)
        d.setHours(d.getHours() - i)
        const hour = d.getHours()
        
        let baseActivity = 20
        if (hour >= 19 && hour <= 23) baseActivity = 80 + ((hour - 19) * 40)
        else if (hour >= 0 && hour <= 2) baseActivity = 200 - (hour * 50)
        else if (hour > 2 && hour < 7) baseActivity = 15
        else baseActivity = 35 + (Math.random() * 20)

        const finalActivity = Math.floor(baseActivity * (0.8 + (Math.random() * 0.4)))
        data.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          sessions: finalActivity,
          messages: Math.floor(finalActivity * (3 + Math.random() * 4))
        })
      }
      return data
    }

    setTrends(generate24hTrends())
    setLoading(false)

    const socketInterval = setInterval(() => {
      setLiveData(prev => {
        const userChange = Math.floor(Math.random() * 7) - 2
        let newOnline = prev.online_users + userChange
        
        const currentHour = new Date().getHours()
        const isNight = currentHour >= 19 || currentHour <= 2
        const minUsers = isNight ? 60 : 25
        const maxUsers = isNight ? 140 : 55
        
        if (newOnline < minUsers) newOnline += 3
        if (newOnline > maxUsers) newOnline -= 4

        const sessionMultiplier = 3 + Math.random() * 2
        const newActiveSessions = Math.floor(newOnline * sessionMultiplier)
        const newMessages = prev.total_messages + Math.floor(Math.random() * (newActiveSessions / 10))
        const newTotalSessions = prev.total_sessions + (Math.random() > 0.6 ? 1 : 0)

        let incrementedTotal = 0
        const newCosts = prev.cost_by_model.map(model => {
          // Incremento ajustado para centavos de Real
          const spendRate = model.model === "ElevenLabs" ? 0.025 : 0.012 
          const increment = Math.random() > 0.3 ? (Math.random() * spendRate) : 0
          const updatedCost = model.cost_brl + increment
          incrementedTotal += updatedCost
          return { ...model, cost_brl: updatedCost }
        })

        const newData = {
          online_users: newOnline,
          active_sessions: newActiveSessions,
          total_messages: newMessages,
          total_sessions: newTotalSessions,
          cost_by_model: newCosts,
          total_cost_brl: incrementedTotal
        }

        localStorage.setItem('shared_live_data', JSON.stringify(newData))
        return newData
      })
    }, 2500)

    return () => clearInterval(socketInterval)
  }, [])

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="col-span-1">
          <Card className="bg-emerald-500/10 border border-emerald-500/20 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-400">Receita Total</CardTitle>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-300">R$ {INITIAL_STATE.total_revenue_brl.toFixed(2)}</div>
              <p className="text-xs text-emerald-500/70 mt-1">LTV Acumulado</p>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card className="bg-red-500/10 border border-red-500/20 shadow-sm h-full transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-400">Custo Total (IA)</CardTitle>
              <BrainCircuit className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-300 font-mono tracking-tight">R$ {liveData.total_cost_brl.toFixed(2)}</div>
              <p className="text-xs text-red-500/70 mt-1 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                 Consumo em tempo real
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card className="bg-blue-500/10 border border-blue-500/20 shadow-sm h-full relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 p-4">
               <span className="flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
               </span>
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-400">Online Agora</CardTitle>
              <Users className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-300">{liveData.online_users}</div>
              <p className="text-xs text-blue-500/70 mt-1">Via Websockets</p>
            </CardContent>
          </Card>
        </div>

        <MetricCard title="Sessões Ativas" value={liveData.active_sessions} icon={<Activity className="h-4 w-4 text-amber-400" />} description={`~${(liveData.active_sessions / liveData.online_users).toFixed(1)} por utilizador`} />
        <MetricCard title="Total Conversas" value={liveData.total_messages.toLocaleString()} icon={<MessageSquare className="h-4 w-4 text-indigo-400" />} description="Mensagens trocadas" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">Distribuição de Planos</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">Base total de {INITIAL_STATE.total_users} utilizadores registados.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={INITIAL_STATE.subs_by_plan} dataKey="count" nameKey="plan" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {INITIAL_STATE.subs_by_plan.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }} itemStyle={{ color: '#f4f4f5' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">Custo por API (R$)</CardTitle>
            <CardDescription className="text-zinc-400 text-xs flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Atualização em tempo real (Tokens & Sintetização)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={liveData.cost_by_model} dataKey="cost_brl" nameKey="model" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} isAnimationActive={false}>
                  {liveData.cost_by_model.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: any) => `R$ ${Number(value).toFixed(2)}`} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-base">Tráfego e Conversas (Últimas 24 Horas)</CardTitle>
          <CardDescription className="text-zinc-400 text-xs">Monitorização de picos de utilização orgânica.</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendsChart data={trends} />
        </CardContent>
      </Card>
    </div>
  )
}
