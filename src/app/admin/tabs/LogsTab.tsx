"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, Terminal, MessageSquare, ShieldCheck, RefreshCw, AlertCircle, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { config } from "@/lib/config"

/**
 * Interface que representa um evento unificado do sistema.
 * Pode ser uma sessão de chat criada ou uma ação administrativa de auditoria.
 */
interface SystemLogEvent {
  id: string
  type: "chat_session" | "admin_action"
  timestamp: string
  user_email?: string
  admin_email?: string
  action?: string
  summary: string
  details: string
}

/**
 * Mapeamento de cores por tipo de evento para a UI.
 */
const EVENT_TYPE_STYLES: Record<SystemLogEvent["type"], { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  chat_session: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    icon: <MessageSquare className="w-4 h-4" />
  },
  admin_action: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    icon: <ShieldCheck className="w-4 h-4" />
  }
}

/**
 * Obtém uma mensagem de erro legível a partir de um valor desconhecido.
 */
const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Erro inesperado ao carregar os logs."

/**
 * LogsTab — Aba de Logs do Sistema
 * 
 * Exibe um feed cronológico unificado de todos os eventos do sistema:
 * - Sessões de chat criadas pelos utilizadores
 * - Ações administrativas registadas na auditoria
 * 
 * Os dados são consumidos diretamente do endpoint real GET /api/admin/logs.
 */
export function LogsTab() {
  const [events, setEvents] = useState<SystemLogEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  /**
   * Busca os logs do sistema via API.
   * Utiliza AbortController para evitar memory leaks em unmounts.
   */
  const fetchLogs = useCallback(async () => {
    const controller = new AbortController()

    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("access_token")
      if (!token) {
        throw new Error("Token de autenticação não encontrado. Faça login novamente.")
      }

      const res = await fetch(`${config.apiUrl}/api/admin/logs?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.detail || `Erro HTTP ${res.status} ao carregar os logs.`)
      }

      const data = await res.json()
      setEvents(data.data ?? [])
      setTotalCount(data.total ?? 0)

    } catch (err: unknown) {
      // Ignora erros de abort (componente desmontado)
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }

    return () => controller.abort()
  }, [])

  // Carrega os logs na montagem do componente
  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  /**
   * Formata uma timestamp ISO 8601 para o formato local brasileiro.
   */
  const formatTimestamp = (iso: string): string => {
    try {
      return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    } catch {
      return iso
    }
  }

  // ─── Estados de Carregamento e Erro ───────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="ml-3 text-zinc-500 text-sm">Carregando logs do sistema...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-red-500">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  // ─── Estado Vazio ──────────────────────────────────────────────

  if (events.length === 0) {
    return (
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            Logs do Sistema
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Nenhum evento registado até ao momento. Os logs aparecerão aqui conforme a plataforma for utilizada.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <ChevronDown className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">Feed de eventos vazio</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            className="mt-4 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ─── Conteúdo Principal ───────────────────────────────────────

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            Logs do Sistema
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Feed cronológico unificado — {totalCount} eventos registados.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[600px] pr-4 custom-scrollbar">
          <div className="space-y-2">
            {events.map((event) => {
              const style = EVENT_TYPE_STYLES[event.type] ?? EVENT_TYPE_STYLES.chat_session

              return (
                <div
                  key={event.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg} ${style.border} transition-colors hover:bg-opacity-20 animate-in fade-in slide-in-from-top-2 duration-300`}
                >
                  {/* Ícone do tipo de evento */}
                  <div className={`shrink-0 mt-0.5 ${style.text}`}>
                    {style.icon}
                  </div>

                  {/* Corpo do evento */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Tipo do evento (badge) */}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}>
                        {event.type === "chat_session" ? "Sessão" : "Admin"}
                      </span>

                      {/* Email do utilizador ou admin */}
                      {event.user_email && (
                        <span className="text-xs text-zinc-400 font-mono truncate max-w-[200px]">
                          {event.user_email}
                        </span>
                      )}
                      {event.admin_email && (
                        <span className="text-xs text-amber-500/70 font-mono truncate max-w-[200px]">
                          {event.admin_email}
                        </span>
                      )}

                      {/* Timestamp */}
                      <span className="text-xs text-zinc-500 ml-auto font-mono">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>

                    {/* Resumo do evento */}
                    <p className="text-sm text-zinc-200 mt-1 leading-relaxed">
                      {event.summary}
                    </p>

                    {/* Detalhes expandidos (se existirem) */}
                    {event.details && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-full" title={event.details}>
                        {event.details}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}