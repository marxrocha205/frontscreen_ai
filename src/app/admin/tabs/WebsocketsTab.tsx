"use client"

import { useEffect, useState, useCallback } from "react"
import { Radio, Activity, Wifi, TerminalSquare, AlertTriangle, Loader2, AlertCircle, RefreshCw, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { config } from "@/lib/config"

// ─── Tipos ─────────────────────────────────────────────────────

/**
 * Estatísticas do WebSocket retornadas por GET /api/admin/websockets/stats.
 * A estrutura exata depende da implementação do websocket_manager.get_active_stats().
 */
interface WsStatsResponse {
  online_users: number
  active_sessions: number
  total_connections?: number
  rooms?: Record<string, number>
  [key: string]: unknown
}

// ─── Utilitários ───────────────────────────────────────────────

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Erro inesperado ao carregar estatísticas."

// ─── Componente Principal ──────────────────────────────────────

/**
 * WebsocketsTab — Monitorização de Conexões WebSocket
 *
 * Consome dados reais do endpoint:
 * - GET /api/admin/websockets/stats → Estado atual do servidor de WebSockets
 *
 * Substitui completamente a simulação fake de tráfego de rede.
 */
export function WebsocketsTab() {
  const [stats, setStats] = useState<WsStatsResponse>({
    online_users: 0,
    active_sessions: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>("")

  // ─── Fetch: Estatísticas do WebSocket ──────────────────────

  const fetchStats = useCallback(async (signal: AbortSignal) => {
    const token = localStorage.getItem("access_token")
    if (!token) throw new Error("Token de autenticação não encontrado.")

    const startTime = performance.now()

    const res = await fetch(`${config.apiUrl}/api/admin/websockets/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      signal
    })

    // Mede a latência da requisição
    const endTime = performance.now()
    setLatency(Math.round(endTime - startTime))

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.detail || `Erro HTTP ${res.status} ao carregar estatísticas.`)
    }

    const data = await res.json()

    setStats({
      online_users: data.data?.online_users ?? 0,
      active_sessions: data.data?.active_sessions ?? 0,
      total_connections: data.data?.total_connections ?? data.data?.online_users ?? 0,
      rooms: data.data?.rooms ?? {}
    })

    setLastUpdate(new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }))

  }, [])

  // ─── Efeito: Carga Inicial + Polling ───────────────────────

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        await fetchStats(controller.signal)
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    load()

    // Atualização frequente (10 segundos) — WebSocket stats mudam rápido
    const pollInterval = setInterval(() => {
      fetchStats(controller.signal)
    }, 10_000)

    return () => {
      controller.abort()
      clearInterval(pollInterval)
    }
  }, [fetchStats])

  // ─── Estado de Carregamento ────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="text-zinc-500 text-sm">A ligar ao servidor WebSocket...</span>
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
          onClick={() => window.location.reload()}
          className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  // ─── Determinação dinâmica do estado do servidor ───────────

  const isOnline = stats.online_users >= 0 // Se a API respondeu, o servidor está online

  // ─── Renderização ───────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Cards de estado */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Conexões Socket Ativas */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-400">Conexões Ativas</p>
              <div className="text-3xl font-bold text-blue-400">
                {stats.online_users}
              </div>
              <p className="text-xs text-zinc-500">
                Utilizadores ligados via WebSocket
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
              <Radio className="h-6 w-6 text-blue-400 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Estado do Servidor */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-400">Estado do Servidor</p>
              <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <p className="text-xs text-zinc-500">
                Última atualização: {lastUpdate || '—'}
              </p>
            </div>
            <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
              <Activity className="h-6 w-6 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        {/* Latência */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-400">Latência da API</p>
              <div className="text-3xl font-bold text-amber-400">
                {latency !== null ? `${latency} ms` : '—'}
              </div>
              <p className="text-xs text-zinc-500">
                Tempo de resposta do endpoint /stats
              </p>
            </div>
            <div className="h-12 w-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
              <Wifi className="h-6 w-6 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel de Terminal com resumo das conexões */}
      <Card className="bg-[#0a0a0a] border-zinc-800 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-zinc-800/50 bg-[#0f0f11] py-3">
          <CardTitle className="text-zinc-100 flex items-center gap-2 text-sm font-mono">
            <TerminalSquare className="w-4 h-4 text-indigo-400" />
            WSS://API.SCREENAI.COM/STREAM
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs">
            Estado atual do servidor WebSocket. Conexões ativas: {stats.online_users} · Sessões: {stats.active_sessions}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[400px] w-full p-4 font-mono text-xs bg-[#0a0a0a]">
            {/* Cabeçalho do terminal */}
            <div className="text-emerald-400 mb-4">
              ┌─── ScreenAI WebSocket Server ───┐
            </div>

            {/* Conexões */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-zinc-300">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Conexões ativas:</span>
                <span className="text-blue-400 font-bold">{stats.online_users}</span>
              </div>

              <div className="flex items-center gap-3 text-zinc-300">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Sessões ativas:</span>
                <span className="text-amber-400 font-bold">{stats.active_sessions}</span>
              </div>

              {stats.total_connections !== undefined && (
                <div className="flex items-center gap-3 text-zinc-300">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Total de conexões:</span>
                  <span className="text-emerald-400 font-bold">{stats.total_connections}</span>
                </div>
              )}

              {latency !== null && (
                <div className="flex items-center gap-3 text-zinc-300">
                  <Wifi className="w-4 h-4 text-purple-400" />
                  <span>Latência:</span>
                  <span className="text-purple-400 font-bold">{latency} ms</span>
                </div>
              )}
            </div>

            {/* Salas/Rooms (se disponível) */}
            {stats.rooms && Object.keys(stats.rooms).length > 0 && (
              <div className="mt-6">
                <div className="text-zinc-500 mb-2">┌─── Salas Ativas ───┐</div>
                <div className="space-y-1 ml-4">
                  {Object.entries(stats.rooms).map(([room, count]) => (
                    <div key={room} className="text-zinc-400">
                      <span className="text-zinc-500">room:</span> {room} → <span className="text-indigo-400">{count} conexões</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rodapé do terminal */}
            <div className="mt-6 text-zinc-600">
              └─── {lastUpdate ? `Atualizado: ${lastUpdate}` : 'Aguardando dados...'} ───┘
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aviso informativo */}
      {stats.online_users === 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
          <AlertTriangle className="w-4 h-4" />
          <p>
            Nenhum utilizador conectado via WebSocket neste momento. 
            As estatísticas são atualizadas a cada 10 segundos.
          </p>
        </div>
      )}
    </div>
  )
}
