"use client"

import { useEffect, useState } from "react"
import { Activity, MessageSquare, Plus, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

// Alguns emails da sua lista para popular as sessões dinâmicas
const sampleEmails = [
  "daniel_souza.br@outlook.com", "elena-ferreira@capitallink.com.br", "f_rodrigues.ops@logifast.com.br",
  "gabriel_alves@induscron.com.br", "julia-gomes@finovate.com", "lucas_ribeiro.lab@criativahub.com.br",
  "rafael_soares.p@fretex.com", "thiago_vieira.eng@sidera.com", "w_dias.mkt@valora.fin", 
  "arthur_moura.mg@gmail.com", "davi_borges.ba@viavelox.com.br", "priscila-hernandez.am@finovate.com"
]

const sessionTitles = ["Análise de Dados Q3", "Tradução de Contrato", "Geração de Voz Comercial", "Sintetização de Texto", "Dúvidas sobre API", "Criação de Copy para Ads", "Revisão de Código"]

interface SessionData {
  id: string
  title: string
  user_email: string
  created_at: Date
}

export function SessionsTab() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  
  // Estado sincronizado com o Dashboard
  const [syncData, setSyncData] = useState({ active_sessions: 0, total_messages: 0 })

  useEffect(() => {
    // Popula as sessões iniciais
    const initialSessions = Array.from({ length: 15 }).map((_, i) => ({
      id: Math.random().toString(36).substring(7),
      title: sessionTitles[Math.floor(Math.random() * sessionTitles.length)],
      user_email: sampleEmails[Math.floor(Math.random() * sampleEmails.length)],
      created_at: new Date(Date.now() - Math.random() * 10000000)
    })).sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    
    setSessions(initialSessions)

    // Intervalo para ler dados do Dashboard (Sincronia em tempo real)
    const syncInterval = setInterval(() => {
      const storedData = localStorage.getItem('shared_live_data')
      if (storedData) {
        setSyncData(JSON.parse(storedData))
      }

      // Adiciona uma nova sessão organicamente (simulando atividade)
      if (Math.random() > 0.6) {
        setSessions(prev => [{
          id: Math.random().toString(36).substring(7),
          title: sessionTitles[Math.floor(Math.random() * sessionTitles.length)],
          user_email: sampleEmails[Math.floor(Math.random() * sampleEmails.length)],
          created_at: new Date()
        }, ...prev].slice(0, 50)) // Mantém o limite de 50 no log
      }
    }, 2500)

    return () => clearInterval(syncInterval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Cards Sincronizados com o Dashboard */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-400">Sessões Ativas em Tempo Real</p>
              <div className="text-3xl font-bold text-amber-400">{syncData.active_sessions || "..."}</div>
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
              <div className="text-3xl font-bold text-indigo-400">{syncData.total_messages.toLocaleString() || "..."}</div>
            </div>
            <div className="h-12 w-12 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20">
              <MessageSquare className="h-6 w-6 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log de Sessões Animado */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Live Log de Sessões</CardTitle>
          <CardDescription className="text-zinc-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Monitorização de interações geradas na plataforma neste exato momento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[450px] pr-4 custom-scrollbar">
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between border border-zinc-800/50 bg-zinc-900/40 p-3 rounded-lg hover:bg-zinc-800/60 transition-colors animate-in slide-in-from-top-2 fade-in duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-zinc-200">
                        {session.title}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {session.user_email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                      {session.created_at.toLocaleTimeString('pt-PT')}
                    </span>
                    <p className="text-[10px] text-zinc-600 mt-1 uppercase font-mono">
                      ID: {session.id.toUpperCase()}
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
