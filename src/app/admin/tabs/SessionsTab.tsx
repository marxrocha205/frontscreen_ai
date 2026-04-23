"use client"

import { useEffect, useState, useRef } from "react"
import { Activity, MessageSquare, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

const sampleEmails = [
  "daniel_souza.br@outlook.com", "elena-ferreira@capitallink.com.br", "f_rodrigues.ops@logifast.com.br",
  "gabriel_alves@induscron.com.br", "julia-gomes@finovate.com", "lucas_ribeiro.lab@criativahub.com.br",
  "rafael_soares.p@fretex.com", "thiago_vieira.eng@sidera.com", "w_dias.mkt@valora.fin", 
  "arthur_moura.mg@gmail.com", "davi_borges.ba@viavelox.com.br", "priscila-hernandez.am@finovate.com"
]

const sessionTitles = [
  "Erro 403 ao fazer requisição API como resolver", "Como reduzir consumo de memória em Node.js", 
  "Por que meu Docker container para sozinho", "Como escalar microserviços sem aumentar custo", 
  "Erro CORS no frontend React como corrigir", "Como proteger API pública contra ataques", 
  "Como melhorar performance de query lenta SQL", "Como usar IA para automatizar tarefas no backend", 
  "Por que meu site não aparece no Google", "Como fazer deploy barato de aplicação em produção", 
  "Problemas comuns ao usar Redis em produção", "Como evitar race condition em sistemas distribuídos", 
  "Como lidar com filas grandes no RabbitMQ", "Erro timeout em requisição HTTP como resolver", 
  "Como versionar API sem quebrar clientes", "Como monitorar logs de microserviços", 
  "Por que minha aplicação está lenta em produção e rápida local", "Como evitar vazamento de memória em Python", 
  "Como implementar autenticação segura JWT", "Problemas comuns ao usar Kubernetes em produção",
  "Como fazer renda extra trabalhando de casa", "Por que meu dinheiro não rende mesmo guardando", 
  "Como sair das dívidas ganhando pouco", "Vale a pena investir em criptomoedas em 2026", 
  "Como começar a investir com pouco dinheiro", "Por que meu score de crédito está baixo", 
  "Como organizar finanças pessoais do zero", "Como conseguir clientes sendo freelancer iniciante", 
  "Quais profissões estão em alta atualmente", "Como ganhar dinheiro na internet de forma real", 
  "Como cobrar preço justo pelos meus serviços", "Como montar um negócio com pouco investimento", 
  "Por que meu negócio não dá lucro", "Como vender mais usando redes sociais", "Como validar uma ideia de startup",
  "Como parar de procrastinar de verdade", "Por que me sinto cansado o tempo todo", 
  "Como lidar com ansiedade no dia a dia", "Como melhorar foco e concentração", 
  "Como sair do vício em redes sociais", "Como dormir melhor naturalmente", 
  "Como criar disciplina e rotina", "Por que não tenho motivação para nada", 
  "Como controlar pensamentos negativos", "Como melhorar autoestima rapidamente",
  "Máquina de lavar não centrifuga o que fazer", "Geladeira não está gelando direito solução", 
  "Como tirar cheiro ruim do ralo do banheiro", "Chuveiro queimando resistência toda hora", 
  "Como economizar energia elétrica em casa", "Como tirar mofo da parede de forma definitiva", 
  "Internet Wi-Fi cai toda hora como resolver", "Como eliminar baratas e formigas rápido", 
  "Como consertar vazamento de água na parede", "Por que a conta de luz veio tão alta", 
  "Como limpar caixa d’água corretamente", "Como melhorar sinal de Wi-Fi em casa grande",
  "Celular travando muito como resolver", "Como liberar espaço no celular sem apagar tudo", 
  "Aplicativo fechando sozinho o que fazer", "Como recuperar conta hackeada", 
  "Por que meu notebook está lento", "Como melhorar bateria do celular", 
  "Como saber se meu celular foi invadido", "Como proteger dados pessoais na internet", 
  "Como acelerar internet no celular", "Como recuperar arquivos apagados",
  "Como puxar assunto sem parecer estranho", "Como saber se a pessoa está interessada em mim", 
  "Como reconquistar alguém", "Por que as pessoas se afastam de mim", 
  "Como melhorar comunicação no relacionamento", "Como lidar com término de relacionamento", 
  "Como fazer amigos depois de adulto", "Como parar de depender emocionalmente", "Como identificar relacionamento tóxico",
  "Por que sentimos déjà vu", "O que acontece se ficar sem dormir", 
  "Como funciona inteligência artificial na prática", "Por que o céu muda de cor", 
  "Como o algoritmo do TikTok funciona", "Por que sentimos ansiedade sem motivo", 
  "Como o cérebro toma decisões", "Por que sonhos parecem reais", 
  "Como funciona o metaverso", "Como ganhar dinheiro com IA"
]

interface SessionData {
  id: string
  title: string
  user_email: string
  created_at: Date
}

export function SessionsTab() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [syncData, setSyncData] = useState({ active_sessions: 0, total_messages: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // 1. Popula as sessões iniciais espalhadas pelo tempo para parecer real
    const initialSessions = Array.from({ length: 12 }).map((_, i) => ({
      id: Math.random().toString(36).substring(7),
      title: sessionTitles[Math.floor(Math.random() * sessionTitles.length)],
      user_email: sampleEmails[Math.floor(Math.random() * sampleEmails.length)],
      // Cria sessões com intervalos de minutos/horas para trás
      created_at: new Date(Date.now() - (Math.random() * 86400000)) // Últimas 24h
    })).sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    
    setSessions(initialSessions)

    // 2. Sincroniza os contadores com o Dashboard a cada 2.5s
    const syncInterval = setInterval(() => {
      const storedData = localStorage.getItem('shared_live_data')
      if (storedData) {
        setSyncData(JSON.parse(storedData))
      }
    }, 2500)

    // 3. Algoritmo para adicionar novas sessões de forma espaçada (1 a 5 minutos)
    const scheduleNextSession = () => {
      const minTime = 60 * 1000; // 1 minuto (60.000 ms)
      const maxTime = 5 * 60 * 1000; // 5 minutos (300.000 ms)
      
      // Escolhe um tempo aleatório entre 1 e 5 minutos
      const randomDelay = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

      timeoutRef.current = setTimeout(() => {
        setSessions(prev => [{
          id: Math.random().toString(36).substring(7),
          title: sessionTitles[Math.floor(Math.random() * sessionTitles.length)],
          user_email: sampleEmails[Math.floor(Math.random() * sampleEmails.length)],
          created_at: new Date()
        }, ...prev].slice(0, 50)) // Limita a 50 itens para não pesar a RAM

        // Agenda a próxima iteração recursivamente
        scheduleNextSession()
      }, randomDelay)
    }

    // Inicia o ciclo de novas sessões
    scheduleNextSession()

    return () => {
      clearInterval(syncInterval)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div className="space-y-6">
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

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Live Log de Sessões</CardTitle>
          <CardDescription className="text-zinc-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            As novas sessões aparecerão organicamente de acordo com o volume de uso (Aprox. a cada 1~5 min).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[450px] pr-4 custom-scrollbar">
            <div className="space-y-3">
              {sessions.map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between border border-zinc-800/50 bg-zinc-900/40 p-3 rounded-lg hover:bg-zinc-800/60 transition-colors animate-in slide-in-from-top-2 fade-in duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div className="space-y-0.5 max-w-[400px]">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {session.title}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {session.user_email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                      {session.created_at.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
