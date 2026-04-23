"use client"
import { useEffect, useState, useRef } from "react"
import { Radio, Activity, Wifi, TerminalSquare, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SocketEvent {
  id: string
  time: string
  type: "CONNECT" | "DISCONNECT" | "MSG_RECV" | "AUDIO_CHUNK" | "SYSTEM"
  client: string
  latency: number
}

const eventTypes = ["CONNECT", "DISCONNECT", "MSG_RECV", "MSG_RECV", "AUDIO_CHUNK", "AUDIO_CHUNK"]

export function WebsocketsTab() {
  const [events, setEvents] = useState<SocketEvent[]>([])
  const [syncData, setSyncData] = useState({ online_users: 0, active_sessions: 0 })
  const [latency, setLatency] = useState(42)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Sincronização passiva com o Dashboard a cada 2s
    const syncInterval = setInterval(() => {
      const storedData = localStorage.getItem('shared_live_data')
      if (storedData) setSyncData(JSON.parse(storedData))
      
      // Flutuação orgânica da latência global (Ping)
      setLatency(prev => Math.max(12, Math.min(120, prev + (Math.random() * 20 - 10))))
    }, 2000)

    // Motor de Geração de Logs de Rede
    const generateNetworkTraffic = () => {
      const randType = eventTypes[Math.floor(Math.random() * eventTypes.length)] as any
      const mockIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
      
      const newEvent: SocketEvent = {
        id: Math.random().toString(36).substring(7),
        time: new Date().toLocaleTimeString('pt-PT', { hour12: false, fractionalSecondDigits: 2 }),
        type: randType,
        client: `client_${Math.random().toString(36).substring(2, 6)}@${mockIp}`,
        latency: Math.floor(Math.random() * 80) + 10
      }

      setEvents(prev => [newEvent, ...prev].slice(0, 40)) // Mantém o DOM leve (apenas 40 linhas no terminal)

      // Se há mais utilizadores, a velocidade do log aumenta
      const storedData = localStorage.getItem('shared_live_data')
      const currentUsers = storedData ? JSON.parse(storedData).online_users : 30
      
      // Calcula o próximo disparo (entre 300ms a 1800ms)
      const baseDelay = 1500 - (currentUsers * 5)
      const nextTick = Math.max(300, baseDelay + (Math.random() * 500))

      timeoutRef.current = setTimeout(generateNetworkTraffic, nextTick)
    }

    generateNetworkTraffic()

    return () => {
      clearInterval(syncInterval)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Função utilitária para colorir os eventos no terminal
  const getEventColor = (type: string) => {
    switch (type) {
      case 'CONNECT': return 'text-emerald-400'
      case 'DISCONNECT': return 'text-red-400'
      case 'MSG_RECV': return 'text-indigo-400'
      case 'AUDIO_CHUNK': return 'text-amber-400'
      default: return 'text-zinc-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER DE ESTADO DE REDE */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-400">Conexões Socket Ativas</p>
              <div className="text-3xl font-bold text-blue-400">{syncData.online_users || "..."}</div>
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
              <div className="text-3xl font-bold text-amber-400">{latency.toFixed(0)} ms</div>
            </div>
            <div className="h-12 w-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
              <Wifi className="h-6 w-6 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TERMINAL CLI */}
      <Card className="bg-[#0a0a0a] border-zinc-800 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-zinc-800/50 bg-[#0f0f11] py-3">
          <CardTitle className="text-zinc-100 flex items-center gap-2 text-sm font-mono">
            <TerminalSquare className="w-4 h-4 text-indigo-400" />
            WSS://API.SCREENAI.COM/STREAM
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs">
            Visualizador de pacotes WebSocket em tempo real. Limitado a 40 nós de DOM para otimização.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px] w-full p-4 font-mono text-xs custom-scrollbar bg-[#0a0a0a]">
            {events.length === 0 ? (
              <div className="text-zinc-600 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Aguardando tráfego de rede...
              </div>
            ) : (
              <div className="space-y-1.5">
                {events.map((ev, i) => (
                  <div key={ev.id} className={`flex items-start gap-3 hover:bg-zinc-900/50 p-1 rounded transition-colors ${i === 0 ? 'animate-in fade-in slide-in-from-top-1' : ''}`}>
                    <span className="text-zinc-600 shrink-0 w-[100px]">{ev.time}</span>
                    <span className={`font-semibold shrink-0 w-[95px] ${getEventColor(ev.type)}`}>
                      [{ev.type}]
                    </span>
                    <span className="text-zinc-300 break-all">
                      Payload recebido de <span className="text-zinc-400">{ev.client}</span> 
                      <span className="text-zinc-600 ml-2">({ev.latency}ms)</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* AVISO INFERIOR */}
      <div className="flex items-center gap-2 text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
        <AlertTriangle className="w-4 h-4" />
        <p>A taxa de atualização do terminal é dinamicamente gerida pelo volume de utilizadores online ({syncData.online_users} atualmente).</p>
      </div>
    </div>
  )
}
