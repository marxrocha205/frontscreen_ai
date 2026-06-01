"use client"

import { useEffect, useState, useRef } from "react"
import { Activity, MessageSquare, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

const sampleEmails = [
  "ana_silva_lx@gmail.com", "bruno-santos@nexora.io", "c.oliveira_mkt@amplifica.mobi", "daniel_souza.br@outlook.com", "elena-ferreira@capitallink.com.br", "f_rodrigues.ops@logifast.com.br", "gabriel_alves@induscron.com.br", "helena-pereira.x@cloudify.net.br", "igor_lima.z@hotmail.com", "julia-gomes@finovate.com", "k.costa_ops@transrota.net", "lucas_ribeiro.lab@criativahub.com.br", "m-martins.fz@ferromak.ind", "nicolas_carvalho.q@gmail.com", "olivia-almeida.rk@byteforge.com", "p_lopes.sys@investcorp.net", "rafael_soares.p@fretex.com", "sofia-fernandes.mx@agenciapixel.net", "thiago_vieira.eng@sidera.com", "u-barbosa.dev@outlook.com", "victor_rocha.fin@altavox.tech", "w_dias.mkt@valora.fin", "xavier-mendes.hq@modalix.log", "yara_nunes.rj@mktflow.com", "zeca-machado.sp@techmanuf.net", "arthur_moura.mg@gmail.com", "beatriz-castro.sc@codexia.dev", "c_cardoso.rs@vertexcapital.com", "davi_borges.ba@viavelox.com.br", "eduarda-smith.pe@brandix.co", "felipe_johnson.ce@obrasil.ind.br", "g-williams.rn@hotmail.com", "heitor_brown.pb@devopsia.com", "isabella-jones.al@capitallink.com.br", "joao_garcia.se@logifast.com.br", "laura-miller.df@amplifica.mobi", "matheus_davis.go@induscron.com.br", "n-rodriguez.mt@gmail.com", "otavio_martinez.ms@nexora.io", "priscila-hernandez.am@finovate.com", "renan92.pa@outlook.com", "samuel.lopez88@transrota.net", "tatiana7.rr@criativahub.com.br", "vinicius.gonzalez2022@ferromak.ind", "yasmin_wilson15@gmail.com", "alice42.ro@cloudify.net.br", "b.anderson99@investcorp.net", "clara.thomas05@fretex.com", "diego.taylor12@agenciapixel.net", "enzo33.ac@sidera.com", "flavia.moore8@hotmail.com", "gustavo.jackson91@altavox.tech", "henrique.martin77@valora.fin", "isadora.lee23@modalix.log", "joaquim.perez44@mktflow.com", "leticia.thompson55@techmanuf.net", "marcelo.white66@gmail.com", "nina.harris7@codexia.dev", "paulo.sanchez8@vertexcapital.com", "renata.clark9@viavelox.com.br", "sergio.ramirez10@brandix.co", "thais.lewis11@obrasil.ind.br", "vitor.robinson12@hotmail.com", "william.walker13@devopsia.com", "alice.young14@capitallink.com.br", "bob.allen15@logifast.com.br", "charlie.king16@amplifica.mobi", "dave.wright17@induscron.com.br", "eve.scott18@gmail.com", "frank.torres19@nexora.io", "grace.nguyen20@finovate.com", "heidi.hill21@transrota.net", "ivan.flores22@criativahub.com.br", "judy.green23@ferromak.ind", "mallory.adams24@gmail.com", "oscar.nelson25@cloudify.net.br", "peggy.baker26@investcorp.net", "sybil.hall27@fretex.com", "trent.rivera28@agenciapixel.net", "victor.campbell29@sidera.com", "walter.mitchell30@outlook.com", "zoe.carter31@altavox.tech", "alexander32.pi@valora.fin", "benjamin33.ma@modalix.log", "catherine34.to@mktflow.com", "daniel.roberts35@techmanuf.net", "emily.smith36@gmail.com", "fernando.johnson37@codexia.dev", "gabriela.williams38@vertexcapital.com", "henrique.brown39@viavelox.com.br", "isabel.jones40@brandix.co", "joao.garcia41@obrasil.ind.br", "katarina.miller42@hotmail.com", "leonardo.davis43@devopsia.com", "marina.rodriguez44@capitallink.com.br", "nicolas.martinez45@logifast.com.br", "olivia.hernandez46@amplifica.mobi", "pedro.lopez47@induscron.com.br", "quintino.gonzalez48@gmail.com", "rafaela.wilson49@nexora.io", "asilva.x@finovate.com", "bruno.eng@transrota.net", "carlos.dev@criativahub.com.br", "dpereira.z@ferromak.ind", "elena.fin@gmail.com", "f.costa.rj@cloudify.net.br", "g.ribeiro.ops@investcorp.net", "helena.mkt@fretex.com", "imartins.x1@agenciapixel.net", "jcarvalho.sys@sidera.com", "k.almeida.hq@outlook.com", "lopes.lucas.q@altavox.tech", "msoares.fz@valora.fin", "nfernandes.rk@modalix.log", "o.barbosa.mx@mktflow.com", "procha.z2@techmanuf.net", "rdias.q1@gmail.com", "smendes.p@codexia.dev", "tmachado.lab@vertexcapital.com", "umoura.sys.br@viavelox.com.br", "vcastro.mkt@brandix.co", "wcardoso.ops.sp@obrasil.ind.br", "xborges.eng@hotmail.com", "ysmith.dev.mg@devopsia.com", "zjohnson.fin@capitallink.com.br", "awilliams.x3@logifast.com.br", "bbrown.rj@amplifica.mobi", "cjones.sp@induscron.com.br", "dgarcia.mg@gmail.com", "emiller.pr@nexora.io", "fdavis.sc@finovate.com", "grodriguez.rs@transrota.net", "hmartinez.ba@criativahub.com.br", "ihernandez.pe@ferromak.ind", "jlopez.ce@gmail.com", "kgonzalez.rn@cloudify.net.br", "lwilson.pb@investcorp.net", "manderson.al@fretex.com", "nthomas.se@agenciapixel.net", "otaylor.df@sidera.com", "pmoore.go@outlook.com", "qjackson.mt@altavox.tech", "rmartin.ms@valora.fin", "slee.am@modalix.log", "tperez.pa@mktflow.com", "uthompson.rr@techmanuf.net", "vwhite.ro@gmail.com", "wharris.ac@codexia.dev", "xsanchez.ap@vertexcapital.com", "yclark.to@viavelox.com.br", "zramirez.ma@brandix.co", "alewis.pi@obrasil.ind.br", "brobinson.eng.rj@hotmail.com", "cwalker.dev.sp@devopsia.com", "dyoung.fin.mg@capitallink.com.br", "eallen.ops.pr@logifast.com.br", "fking.mkt.sc@amplifica.mobi", "gwright.sys.rs@induscron.com.br", "hscott.x4@gmail.com", "itorres.z3@nexora.io", "jnguyen.q2@finovate.com", "khill.p1@transrota.net", "lflores.lab.ba@criativahub.com.br", "mgreen.hq.pe@ferromak.ind", "nadams.fz1@gmail.com", "onelson.rk2@cloudify.net.br", "pbaker.mx1@investcorp.net", "qhall.rj2@fretex.com", "rrivera.sp1@agenciapixel.net", "scampbell.mg2@sidera.com", "tmitchell.pr1@outlook.com", "ucarter.sc2@altavox.tech", "vroberts.rs1@valora.fin", "wsilva.ba2@modalix.log", "xsantos.pe1@mktflow.com", "yoliveira.ce2@techmanuf.net", "zsouza.rn1@gmail.com", "arodrigues.pb2@codexia.dev", "bferreira.al1@vertexcapital.com", "calves.se2@viavelox.com.br", "dpereira.df1@brandix.co", "elima.go2@obrasil.ind.br", "fgomes.mt1@hotmail.com", "gcosta.ms2@devopsia.com", "hribeiro.am1@capitallink.com.br", "imartins.pa2@logifast.com.br", "jcarvalho.rr1@amplifica.mobi", "kalmeida.ro2@induscron.com.br", "llopes.ac1@gmail.com", "msoares.ap2@nexora.io", "nfernandes.to1@finovate.com", "obarbosa.ma2@transrota.net", "procha.pi1@criativahub.com.br", "qdias.eng.br@ferromak.ind", "rmendes.dev.br@gmail.com", "snunes.fin.br@cloudify.net.br", "tmachado.ops.br@investcorp.net", "umoura.mkt.br@fretex.com", "vcastro.sys.br@agenciapixel.net"
]

interface SessionData {
  id: string
  user_email: string
  created_at: Date
}

const generateInitialSessions = (): SessionData[] =>
  Array.from({ length: 8 }).map(() => ({
    id: Math.random().toString(36).substring(7),
    user_email: sampleEmails[Math.floor(Math.random() * sampleEmails.length)],
    created_at: new Date(Date.now() - (Math.random() * 86400000))
  })).sort((a, b) => b.created_at.getTime() - a.created_at.getTime())

export function SessionsTab() {
  const [sessions, setSessions] = useState<SessionData[]>(generateInitialSessions)
  const [syncData, setSyncData] = useState({ active_sessions: 0, total_messages: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const syncInterval = setInterval(() => {
      const storedData = localStorage.getItem('shared_live_data')
      if (storedData) {
        setSyncData(JSON.parse(storedData))
      }
    }, 2500)

    const scheduleNextSession = () => {
      // Sobe a cada 3 a 8 minutos (bastante devagar e realista)
      const minTime = 3 * 60 * 1000;
      const maxTime = 8 * 60 * 1000;
      
      const randomDelay = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

      timeoutRef.current = setTimeout(() => {
        setSessions(prev => [{
          id: Math.random().toString(36).substring(7),
          user_email: sampleEmails[Math.floor(Math.random() * sampleEmails.length)],
          created_at: new Date()
        }, ...prev].slice(0, 50)) 

        scheduleNextSession()
      }, randomDelay)
    }

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
            As novas sessões aparecerão organicamente de acordo com o volume de uso (Aprox. a cada 3~8 min).
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
                      {/* O título foi removido e substituído por ... */}
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        ...
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
