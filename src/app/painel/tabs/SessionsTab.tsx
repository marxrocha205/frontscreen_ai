"use client"

import { useEffect, useState } from "react"
import { Activity, MessageSquare, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { config } from "@/lib/config"

interface SessionData {
  session_id: number
  title: string | null
  user_email: string
  created_at: string
}

export function SessionsTab() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [syncData, setSyncData] = useState({ active_sessions: 0, total_messages: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1] || localStorage.getItem('access_token');
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };

        const [sessionsRes, metricsRes] = await Promise.all([
          fetch(`${config.apiUrl}/api/admin/sessions?limit=50`, { headers }),
          fetch(`${config.apiUrl}/api/admin/metrics`, { headers })
        ]);

        if (sessionsRes.ok) {
          const json = await sessionsRes.json();
          setSessions(json.data);
        }

        if (metricsRes.ok) {
          const metricsJson = await metricsRes.json();
          setSyncData({
            active_sessions: metricsJson.data.total_sessions,
            total_messages: metricsJson.data.total_messages
          });
        }
      } catch (e) {
        console.error("Error fetching sessions", e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="flex h-64 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-400">Total de Sessões Reais</p>
              <div className="text-3xl font-bold text-amber-400">{syncData.active_sessions || "0"}</div>
            </div>
            <div className="h-12 w-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
              <Activity className="h-6 w-6 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-400">Total de Interações (Mensagens)</p>
              <div className="text-3xl font-bold text-indigo-400">{syncData.total_messages.toLocaleString() || "0"}</div>
            </div>
            <div className="h-12 w-12 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20">
              <MessageSquare className="h-6 w-6 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Log de Sessões Recentes (Real)</CardTitle>
          <CardDescription className="text-zinc-400 flex items-center gap-2">
            Baseado no banco de dados do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[450px] pr-4 custom-scrollbar">
            <div className="space-y-3">
              {sessions.map((session) => (
                <div 
                  key={session.session_id} 
                  className="flex items-center justify-between border border-zinc-800/50 bg-zinc-900/40 p-3 rounded-lg hover:bg-zinc-800/60 transition-colors animate-in slide-in-from-top-2 fade-in duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div className="space-y-0.5 max-w-[400px]">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {session.title || "Sessão sem título"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {session.user_email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                      {new Date(session.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <p className="text-[10px] text-zinc-600 mt-1 uppercase font-mono">
                      ID: {session.session_id}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
