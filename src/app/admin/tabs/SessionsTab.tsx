"use client"

import { useEffect, useState, useCallback } from "react"
import { Activity, MessageSquare, Loader2, AlertCircle, RefreshCw, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { config } from "@/lib/config"

// ─── Tipos ─────────────────────────────────────────────────────

/** Dados de uma sessão de chat, retornados por GET /api/admin/sessions */
interface SessionData {
  session_id: string
  title: string
  user_email: string
  created_at: string
}

/** Estatísticas em tempo real (partilhadas via polling de métricas) */
interface LiveStats {
  online_users: number
  active_sessions: number
  total_messages: number
}

// ─── Utilitários ───────────────────────────────────────────────

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Erro inesperado."

/**
 * Formata uma timestamp ISO para o formato HH:MM:SS (horário de Brasília).
 */
const formatTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Sao_Paulo'
    })
  } catch {
    return iso
  }
}

/**
 * Formata uma timestamp ISO para o formato de data (DD/MM/AAAA).
 */
const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    })
  } catch {
    return iso
  }
}

// ─── Componente Principal ──────────────────────────────────────

/**
 * SessionsTab — Monitorização de Sessões de Chat
 *
 * Consome dados reais dos endpoints:
 * - GET /api/admin/sessions    → Lista de sessões recentes
 * - GET /api/admin/metrics     → Contadores globais (mensagens, sessões)
 * - GET /api/admin/websockets/stats → Utilizadores online
 *
 * Substitui completamente a geração fake de sessões que existia anteriormente.
 */
export function SessionsTab() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stats, setStats] = useState<LiveStats>({
    online_users: 0,
    active_sessions: 0,
    total_messages: 0
  })

  // ─── Fetch: Sessões ────────────────────────────────────────

  const fetchSessions = useCallback(async (signal: AbortSignal) => {
    const token = localStorage.getItem("access_token")
    if (!token) throw new Error("Token de autenticação não encontrado.")

    const res = await fetch(`${config.apiUrl}/api/admin/sessions?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
      signal
    })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.detail || `Erro HTTP ${res.status} ao carregar sessões.`)
    }

    const data = await res.json()
    setSessions(data.data ?? [])
  }, [])

  // ─── Fetch: Métricas (para os cards de topo) ───────────────

  const fetchMetrics = useCallback(async (signal: AbortSignal) => {
    const token = localStorage.getItem("access_token")
    if (!token) return

    try {
      const res = await fetch(`${config.apiUrl}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
        signal
      })

      if (res.ok) {
        const data = await res.json()
        setStats(prev => ({
          ...prev,
          total_messages: data.data?.total_messages ?? prev.total_messages,
          active_sessions: data.data?.total_sessions ?? prev.active_sessions
        }))
      }
    } catch {
      // Silencioso — métricas podem falhar sem impacto crítico
    }
  }, [])

  const fetchWsStats = useCallback(async (signal: AbortSignal) => {
    const token = localStorage.getItem("access_token")
    if (!token) return

    try {
      const res = await fetch(`${config.apiUrl}/api/admin/websockets/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        signal
      })

      if (res.ok) {
        const data = await res.json()
        setStats(prev => ({
          ...prev,
          online_users: data.data?.online_users ?? prev.online_users
        }))
      }
    } catch {
      // Silencioso
    }
  }, [])

  // ─── Efeito: Carga Inicial + Polling ───────────────────────

  useEffect(() => {
    const controller = new AbortController()

    const loadAll = async () => {
      try {
        setLoading(true)
        setError(null)
        await Promise.all([
          fetchSessions(controller.signal),
          fetchMetrics(controller.signal),
          fetchWsStats(controller.signal)
        ])
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    loadAll()

    // Polling a cada 30 segundos para manter os dados atualizados
    const pollInterval = setInterval(() => {
      fetchMetrics(controller.signal)
      fetchWsStats(controller.signal)
    }, 30_000)

    return () => {
      controller.abort()
      clearInterval(pollInterval)
    }
  }, [fetchSessions, fetchMetrics, fetchWsStats])

  // ─── Estado de Carregamento ────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="text-zinc-500 text-sm">A carregar sessões...</span>
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

  // ─── Renderização ───────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Cards de métricas em tempo real */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sessões Ativas */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-400">Sessões Registadas</p>
              <div className="text-3xl font-bold text-amber-400">
                {sessions.length}
              </div>
              <p className="text-xs text-zinc-500">Total na base de dados</p>
            </div>
            <div className="h-12 w-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
              <Activity className="h-6 w-6 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        {/* Total de Mensagens */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-400">Total de Interações (Mensagens)</p>
              <div className="text-3xl font-bold text-indigo-400">
                {stats.total_messages.toLocaleString()}
              </div>
              <p className="text-xs text-zinc-500">Em toda a plataforma</p>
            </div>
            <div className="h-12 w-12 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20">
              <MessageSquare className="h-6 w-6 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Sessões */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Sessões de Chat Recentes</CardTitle>
          <CardDescription className="text-zinc-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Dados reais da base de dados — {sessions.length} sessões listadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4 custom-scrollbar">
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma sessão encontrada.</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.session_id}
                    className="flex items-center justify-between border border-zinc-800/50 bg-zinc-900/40 p-3 rounded-lg hover:bg-zinc-800/60 transition-colors animate-in slide-in-from-top-2 fade-in duration-300"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate max-w-[350px]">
                          {session.title || "Sem título"}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {session.user_email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                        {formatTime(session.created_at)}
                      </span>
                      <p className="text-[10px] text-zinc-600 mt-1 uppercase font-mono">
                        {formatDate(session.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
