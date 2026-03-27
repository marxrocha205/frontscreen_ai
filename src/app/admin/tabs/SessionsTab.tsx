"use client"

import { useEffect, useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SessionData {
  session_id: string
  title: string
  user_email: string
  created_at: string
}

export function SessionsTab() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchSessions() {
      try {
        const token = localStorage.getItem("access_token")
        if (!token) throw new Error("Não autenticado")

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        })

        if (!res.ok) throw new Error("Falha ao carregar as sessões")

        const data = await res.json()
        setSessions(data.data)
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()

    return () => controller.abort()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center space-y-2 text-red-500">
        <AlertCircle className="h-8 w-8" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registo Global de Sessões</CardTitle>
        <CardDescription>Auditoria de todas as conversas e interações geradas na plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {sessions.map((session) => (
              <div 
                key={session.session_id} 
                className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-0 hover:bg-zinc-50/50 p-2 rounded-lg transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-900">
                    {session.title || "Sessão Sem Título"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Utilizador: <span className="font-medium">{session.user_email}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">
                    {new Date(session.created_at).toLocaleString('pt-PT')}
                  </span>
                  <p className="text-[10px] text-zinc-400 mt-1 uppercase">
                    ID: {session.session_id.split('-')[0]}...
                  </p>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="text-center text-zinc-500 py-8">
                Nenhuma sessão encontrada no sistema.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}