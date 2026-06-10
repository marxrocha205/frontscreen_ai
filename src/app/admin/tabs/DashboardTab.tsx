"use client"

import { useEffect, useState, useCallback } from "react"
import { Users, MessageSquare, Loader2, DollarSign, BrainCircuit, Activity, Zap, RefreshCw, AlertCircle } from "lucide-react"
import { MetricCard } from "../components/MetricCard"
import { TrendsChart, TrendData } from "../components/TrendsChart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { config } from "@/lib/config"

// ─── Constantes ────────────────────────────────────────────────

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4']

/** Taxa de câmbio USD → BRL (aproximada, atualizar conforme necessário) */
const USD_TO_BRL = 5.45

// ─── Tipos ─────────────────────────────────────────────────────

/**
 * Estrutura retornada pelo endpoint GET /api/admin/metrics
 */
interface DashboardMetrics {
  total_users: number
  total_sessions: number
  total_messages: number
  total_credits_in_circulation: number
  total_revenue_brl: number
  total_cost_usd: number
  cost_by_model: Array<{ model: string; cost_usd: number }>
  subs_by_plan: Array<{ plan: string; count: number }>
}

/**
 * Estrutura de um ponto de tendência diário.
 * Vem do endpoint GET /api/admin/metrics/trends
 */
interface TrendPoint {
  date: string          // "DD/MM"
  full_date: string     // "YYYY-MM-DD"
  users: number
  sessions: number
  messages: number
}

/** Estatísticas do WebSocket (online agora, etc.) */
interface WsStats {
  online_users: number
  active_sessions: number
}

// ─── Utilitários ───────────────────────────────────────────────

/** Formata valor numérico para Real Brasileiro (pt-BR). */
const formatBRL = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

/** Formata valor numérico para Dólar Americano (en-US). */
const formatUSD = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value)

/** Converte USD para BRL usando a taxa de câmbio fixa. */
const usdToBrl = (usd: number): number => usd * USD_TO_BRL

/** Extrai mensagem legível de um erro desconhecido. */
const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Erro inesperado ao carregar os dados."

// ─── Componente Principal ──────────────────────────────────────

/**
 * DashboardTab — Painel de Controlo Principal
 * 
 * Consome dados reais dos seguintes endpoints da API:
 * - GET /api/admin/metrics       → KPIs financeiros e de utilização
 * - GET /api/admin/metrics/trends → Séries temporais (últimos 7 dias por padrão)
 * - GET /api/admin/websockets/stats → Utilizadores online em tempo real
 * 
 * Substitui completamente os dados mock que existiam anteriormente.
 */
export function DashboardTab() {
  // ─── Estados ───────────────────────────────────────────────
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [trends, setTrends] = useState<TrendPoint[]>([])
  const [wsStats, setWsStats] = useState<WsStats>({ online_users: 0, active_sessions: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ─── Funções de Fetch ──────────────────────────────────────

  /** Busca as métricas principais do dashboard. */
  const fetchMetrics = useCallback(async (signal: AbortSignal) => {
    const token = localStorage.getItem("access_token")
    if (!token) throw new Error("Token de autenticação não encontrado.")

    const res = await fetch(`${config.apiUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
      signal
    })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.detail || `Erro HTTP ${res.status} ao carregar métricas.`)
    }

    const json = await res.json()
    setMetrics(json.data)
  }, [])

  /** Busca as tendências diárias para o gráfico de tráfego. */
  const fetchTrends = useCallback(async (signal: AbortSignal) => {
    const token = localStorage.getItem("access_token")
    if (!token) throw new Error("Token de autenticação não encontrado.")

    const res = await fetch(`${config.apiUrl}/api/admin/metrics/trends?days=7`, {
      headers: { Authorization: `Bearer ${token}` },
      signal
    })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.detail || `Erro HTTP ${res.status} ao carregar tendências.`)
    }

    const json = await res.json()

    // Converte os pontos da API para o formato esperado pelo TrendsChart
    const chartData: TrendData[] = (json.data ?? []).map((point: TrendPoint) => ({
      time: point.date,
      sessions: point.sessions,
      messages: point.messages
    }))
    
    setTrends(chartData as unknown as TrendPoint[])
  }, [])

  /** Busca as estatísticas atuais dos WebSockets (online agora). */
  const fetchWsStats = useCallback(async (signal: AbortSignal) => {
    const token = localStorage.getItem("access_token")
    if (!token) return // silencioso; o endpoint pode não estar disponível

    try {
      const res = await fetch(`${config.apiUrl}/api/admin/websockets/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        signal
      })

      if (res.ok) {
        const json = await res.json()
        setWsStats({
          online_users: json.data?.online_users ?? 0,
          active_sessions: json.data?.active_sessions ?? 0
        })
      }
    } catch {
      // Erro silencioso — os WebSockets podem não estar disponíveis em
      // todos os ambientes; usamos fallback do localStorage enquanto isso.
    }
  }, [])

  /** Busca todos os dados de uma só vez (chamada inicial e refresh manual). */
  const fetchAll = useCallback(async () => {
    const controller = new AbortController()
    
    try {
      setLoading(true)
      setError(null)

      await Promise.all([
        fetchMetrics(controller.signal),
        fetchTrends(controller.signal),
        fetchWsStats(controller.signal)
      ])

    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [fetchMetrics, fetchTrends, fetchWsStats])

  // ─── Efeito: Carga Inicial + Polling ───────────────────────

  useEffect(() => {
    const controller = new AbortController()

    // Carga inicial
    fetchAll()

    // Polling suave a cada 30 segundos para manter os dados atualizados
    const pollInterval = setInterval(() => {
      fetchMetrics(controller.signal)
      fetchWsStats(controller.signal)
    }, 30_000)

    return () => {
      controller.abort()
      clearInterval(pollInterval)
    }
  }, [fetchAll, fetchMetrics, fetchWsStats])

  // ─── Estado de Carregamento ────────────────────────────────

  if (loading && !metrics) {
    return (
      <div className="flex h-64 w-full items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="text-zinc-500 text-sm">A carregar métricas do sistema...</span>
      </div>
    )
  }

  // ─── Estado de Erro ────────────────────────────────────────

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-red-500">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAll}
          className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  // ─── Fallback: Dados Parciais ───────────────────────────────

  // Se ainda não temos métricas (mas não estamos mais em loading nem erro),
  // mostramos um estado de fallback com zeros.
  const safeMetrics = metrics ?? {
    total_users: 0,
    total_sessions: 0,
    total_messages: 0,
    total_credits_in_circulation: 0,
    total_revenue_brl: 0,
    total_cost_usd: 0,
    cost_by_model: [],
    subs_by_plan: []
  }

  const totalCostBrl = usdToBrl(safeMetrics.total_cost_usd)

  // Contagem de assinaturas ativas para o bloco de renovações
  const activeSubsTotal = safeMetrics.subs_by_plan.reduce((sum, item) => sum + item.count, 0)
  const proSubs = safeMetrics.subs_by_plan.filter(p => p.plan.toLowerCase().includes("pro"))

  // ─── Renderização ───────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* 1º BLOCO: Finanças e Renovações */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        {/* Receita Total */}
        <div className="col-span-1">
          <Card className="bg-zinc-950 border-zinc-800 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">Receita Total</CardTitle>
              <DollarSign className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-300">{formatBRL(safeMetrics.total_revenue_brl)}</div>
              <p className="text-xs text-emerald-500/70 mt-1">Faturamento Consolidado do Período</p>
              
            </CardContent>
          </Card>
        </div>

        {/* Custo Total de IA */}
        <div className="col-span-1">
          <Card className="bg-zinc-950 border-zinc-800 shadow-sm h-full transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">Custo Total (IA)</CardTitle>
              <BrainCircuit className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-300 font-mono tracking-tight">{formatBRL(totalCostBrl)}</div>
              <p className="text-xs text-red-500/70 mt-1 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                 Consumo em tempo real
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Assinaturas Ativas */}
        <div className="col-span-1">
          <Card className="bg-zinc-950 border-zinc-800 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-400">Assinaturas Renovadas</CardTitle>
              <RefreshCw className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-300">{activeSubsTotal}</div>
              <p className="text-xs text-purple-500/70 mt-1">{safeMetrics.subs_by_plan.filter(p => p.plan.toLowerCase().includes("mensal")).reduce((s, p) => s + p.count, 0)} PRO MENSAL | {safeMetrics.subs_by_plan.filter(p => p.plan.toLowerCase().includes("anual")).reduce((s, p) => s + p.count, 0)} PRO ANUAL</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2º BLOCO: Tráfego e Utilizadores Online */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">

        {/* Online Agora (via WebSocket stats) */}
        <div className="col-span-1">
          <Card className="bg-zinc-950 border-zinc-800 shadow-sm h-full relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 p-4">
               <span className="flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
               </span>
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">Online Agora</CardTitle>
              <Users className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-300">{wsStats.online_users}</div>
              <p className="text-xs text-blue-500/70 mt-1">Via Websockets</p>
            </CardContent>
          </Card>
        </div>

        <MetricCard
          title="Sessões Ativas"
          value={wsStats.active_sessions}
          icon={<Activity className="h-4 w-4 text-amber-400" />}
          description={wsStats.online_users > 0
            ? `~${(wsStats.active_sessions / wsStats.online_users).toFixed(1)} por utilizador`
            : "Carregando..."
          }
        />

        <MetricCard
          title="Total Conversas"
          value={safeMetrics.total_messages.toLocaleString()}
          icon={<MessageSquare className="h-4 w-4 text-indigo-400" />}
          description="Mensagens trocadas na plataforma"
        />
      </div>

      {/* 3º BLOCO: Gráficos de Pizza */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* Distribuição de Planos */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">Distribuição de Planos</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Base total de {safeMetrics.total_users} utilizadores registados.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {safeMetrics.subs_by_plan.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safeMetrics.subs_by_plan}
                    dataKey="count"
                    nameKey="plan"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {safeMetrics.subs_by_plan.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      color: '#f4f4f5',
                      borderRadius: '8px'
                    }}
                    itemStyle={{ color: '#f4f4f5' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500 text-sm">
                Nenhum dado de plano disponível.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custo por API */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">Custo por API (R$)</CardTitle>
            <CardDescription className="text-zinc-400 text-xs flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Dados reais agregados da base de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {safeMetrics.cost_by_model.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safeMetrics.cost_by_model.map(item => ({
                      model: item.model,
                      cost_brl: usdToBrl(item.cost_usd)
                    }))}
                    dataKey="cost_brl"
                    nameKey="model"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {safeMetrics.cost_by_model.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatBRL(Number(value ?? 0))}
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      color: '#f4f4f5',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500 text-sm">
                Nenhum dado de consumo de API disponível.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4º BLOCO: Tráfego (Tendências) */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-base">Tráfego e Conversas (Últimos 7 Dias)</CardTitle>
          <CardDescription className="text-zinc-400 text-xs">
            Monitorização de picos de utilização — dados agregados da base de dados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trends.length > 0 ? (
            <TrendsChart data={trends as unknown as TrendData[]} />
          ) : (
            <div className="flex h-[200px] items-center justify-center text-zinc-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Carregando dados de tendências...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
