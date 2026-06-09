"use client"

import { useEffect, useState } from "react"
import { Radio, Activity, Wifi, TerminalSquare, AlertTriangle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { config } from "@/lib/config"

export function WebsocketsTab() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1] || localStorage.getItem('access_token')
        if (!token) return

        const res = await fetch(`${config.apiUrl}/api/admin/websockets/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (res.ok) {
          const json = await res.json()
          setStats(json.data)
        }
      } catch (e) {
        console.error("Error fetching websocket stats:", e)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !stats) return <div className="flex h-64 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-400">Conexões Socket Ativas</p>
              <div className="text-3xl font-bold text-blue-400">{stats.active_connections}</div>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
              <Radio className="h-6 w-6 text-blue-400 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-400">Estado do Servidor</p>
              <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" /> Online
              </div>
            </div>
            <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
              <Activity className="h-6 w-6 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-400">Latência Média (Ping)</p>
              <div className="text-3xl font-bold text-amber-400">{stats.average_latency_ms?.toFixed(0) || 0} ms</div>
            </div>
            <div className="h-12 w-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
              <Wifi className="h-6 w-6 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#0a0a0a] border-zinc-800 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-zinc-800/50 bg-[#0f0f11] py-3">
          <CardTitle className="text-zinc-100 flex items-center gap-2 text-sm font-mono">
            <TerminalSquare className="w-4 h-4 text-indigo-400" />
            WSS://API.SCREENAI.COM/STREAM (Real)
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs">
            Estatísticas do servidor WebSocket em tempo real baseadas na memória do backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[200px] w-full p-4 font-mono text-xs custom-scrollbar bg-[#0a0a0a]">
            {stats.active_connections === 0 ? (
              <div className="text-zinc-600 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Nenhum utilizador conectado no momento.
              </div>
            ) : (
              <div className="space-y-1.5 text-zinc-300">
                <div className="flex flex-col space-y-2">
                   <span><strong>Utilizadores Online:</strong> {stats.active_connections}</span>
                   <span><strong>Duração Média das Sessões:</strong> {stats.average_session_duration_sec?.toFixed(1) || 0}s</span>
                   <span><strong>Latência do Pool:</strong> {stats.average_latency_ms?.toFixed(1) || 0}ms</span>
                   <hr className="border-zinc-800 my-2" />
                   <span className="text-emerald-400">Servidor WebSocket Saudável e Monitorizado.</span>
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      
      <div className="flex items-center gap-2 text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
        <AlertTriangle className="w-4 h-4" />
        <p>A taxa de atualização é de 5 segundos consumindo os dados reais do backend FastAPI.</p>
      </div>
    </div>
  )
}
