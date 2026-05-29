"use client"

import { useEffect, useState } from "react"
import { Loader2, Power, ScanEye, DollarSign, BrainCircuit, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface UserData {
  id: number
  email: string
  is_active: boolean
  is_admin: boolean
  plan_id: number
}

const rawEmails = [
  "ana_silva_lx@gmail.com", "bruno-santos@nexora.io", "c.oliveira_mkt@amplifica.mobi", "daniel_souza.br@outlook.com", "elena-ferreira@capitallink.com.br", "f_rodrigues.ops@logifast.com.br", "gabriel_alves@induscron.com.br", "helena-pereira.x@cloudify.net.br", "igor_lima.z@hotmail.com", "julia-gomes@finovate.com", "k.costa_ops@transrota.net", "lucas_ribeiro.lab@criativahub.com.br", "m-martins.fz@ferromak.ind", "nicolas_carvalho.q@gmail.com", "olivia-almeida.rk@byteforge.com", "p_lopes.sys@investcorp.net", "rafael_soares.p@fretex.com", "sofia-fernandes.mx@agenciapixel.net", "thiago_vieira.eng@sidera.com", "u-barbosa.dev@outlook.com", "victor_rocha.fin@altavox.tech", "w_dias.mkt@valora.fin", "xavier-mendes.hq@modalix.log", "yara_nunes.rj@mktflow.com", "zeca-machado.sp@techmanuf.net", "arthur_moura.mg@gmail.com", "beatriz-castro.sc@codexia.dev", "c_cardoso.rs@vertexcapital.com", "davi_borges.ba@viavelox.com.br", "eduarda-smith.pe@brandix.co", "felipe_johnson.ce@obrasil.ind.br", "g-williams.rn@hotmail.com", "heitor_brown.pb@devopsia.com", "isabella-jones.al@capitallink.com.br", "joao_garcia.se@logifast.com.br", "laura-miller.df@amplifica.mobi", "matheus_davis.go@induscron.com.br", "n-rodriguez.mt@gmail.com", "otavio_martinez.ms@nexora.io", "priscila-hernandez.am@finovate.com", "renan92.pa@outlook.com", "samuel.lopez88@transrota.net", "tatiana7.rr@criativahub.com.br", "vinicius.gonzalez2022@ferromak.ind", "yasmin_wilson15@gmail.com", "alice42.ro@cloudify.net.br", "b.anderson99@investcorp.net", "clara.thomas05@fretex.com", "diego.taylor12@agenciapixel.net", "enzo33.ac@sidera.com", "flavia.moore8@hotmail.com", "gustavo.jackson91@altavox.tech", "henrique.martin77@valora.fin", "isadora.lee23@modalix.log", "joaquim.perez44@mktflow.com", "leticia.thompson55@techmanuf.net", "marcelo.white66@gmail.com", "nina.harris7@codexia.dev", "paulo.sanchez8@vertexcapital.com", "renata.clark9@viavelox.com.br", "sergio.ramirez10@brandix.co", "thais.lewis11@obrasil.ind.br", "vitor.robinson12@hotmail.com", "william.walker13@devopsia.com", "alice.young14@capitallink.com.br", "bob.allen15@logifast.com.br", "charlie.king16@amplifica.mobi", "dave.wright17@induscron.com.br", "eve.scott18@gmail.com", "frank.torres19@nexora.io", "grace.nguyen20@finovate.com", "heidi.hill21@transrota.net", "ivan.flores22@criativahub.com.br", "judy.green23@ferromak.ind", "mallory.adams24@gmail.com", "oscar.nelson25@cloudify.net.br", "peggy.baker26@investcorp.net", "sybil.hall27@fretex.com", "trent.rivera28@agenciapixel.net", "victor.campbell29@sidera.com", "walter.mitchell30@outlook.com", "zoe.carter31@altavox.tech", "alexander32.pi@valora.fin", "benjamin33.ma@modalix.log", "catherine34.to@mktflow.com", "daniel.roberts35@techmanuf.net", "emily.smith36@gmail.com", "fernando.johnson37@codexia.dev", "gabriela.williams38@vertexcapital.com", "henrique.brown39@viavelox.com.br", "isabel.jones40@brandix.co", "joao.garcia41@obrasil.ind.br", "katarina.miller42@hotmail.com", "leonardo.davis43@devopsia.com", "marina.rodriguez44@capitallink.com.br", "nicolas.martinez45@logifast.com.br", "olivia.hernandez46@amplifica.mobi", "pedro.lopez47@induscron.com.br", "quintino.gonzalez48@gmail.com", "rafaela.wilson49@nexora.io", "asilva.x@finovate.com", "bruno.eng@transrota.net", "carlos.dev@criativahub.com.br", "dpereira.z@ferromak.ind", "elena.fin@gmail.com", "f.costa.rj@cloudify.net.br", "g.ribeiro.ops@investcorp.net", "helena.mkt@fretex.com", "imartins.x1@agenciapixel.net", "jcarvalho.sys@sidera.com", "k.almeida.hq@outlook.com", "lopes.lucas.q@altavox.tech", "msoares.fz@valora.fin", "nfernandes.rk@modalix.log", "o.barbosa.mx@mktflow.com", "procha.z2@techmanuf.net", "rdias.q1@gmail.com", "smendes.p@codexia.dev", "tmachado.lab@vertexcapital.com", "umoura.sys.br@viavelox.com.br", "vcastro.mkt@brandix.co", "wcardoso.ops.sp@obrasil.ind.br", "xborges.eng@hotmail.com", "ysmith.dev.mg@devopsia.com", "zjohnson.fin@capitallink.com.br", "awilliams.x3@logifast.com.br", "bbrown.rj@amplifica.mobi", "cjones.sp@induscron.com.br", "dgarcia.mg@gmail.com", "emiller.pr@nexora.io", "fdavis.sc@finovate.com", "grodriguez.rs@transrota.net", "hmartinez.ba@criativahub.com.br", "ihernandez.pe@ferromak.ind", "jlopez.ce@gmail.com", "kgonzalez.rn@cloudify.net.br", "lwilson.pb@investcorp.net", "manderson.al@fretex.com", "nthomas.se@agenciapixel.net", "otaylor.df@sidera.com", "pmoore.go@outlook.com", "qjackson.mt@altavox.tech", "rmartin.ms@valora.fin", "slee.am@modalix.log", "tperez.pa@mktflow.com", "uthompson.rr@techmanuf.net", "vwhite.ro@gmail.com", "wharris.ac@codexia.dev", "xsanchez.ap@vertexcapital.com", "yclark.to@viavelox.com.br", "zramirez.ma@brandix.co", "alewis.pi@obrasil.ind.br", "brobinson.eng.rj@hotmail.com", "cwalker.dev.sp@devopsia.com", "dyoung.fin.mg@capitallink.com.br", "eallen.ops.pr@logifast.com.br", "fking.mkt.sc@amplifica.mobi", "gwright.sys.rs@induscron.com.br", "hscott.x4@gmail.com", "itorres.z3@nexora.io", "jnguyen.q2@finovate.com", "khill.p1@transrota.net", "lflores.lab.ba@criativahub.com.br", "mgreen.hq.pe@ferromak.ind", "nadams.fz1@gmail.com", "onelson.rk2@cloudify.net.br", "pbaker.mx1@investcorp.net", "qhall.rj2@fretex.com", "rrivera.sp1@agenciapixel.net", "scampbell.mg2@sidera.com", "tmitchell.pr1@outlook.com", "ucarter.sc2@altavox.tech", "vroberts.rs1@valora.fin", "wsilva.ba2@modalix.log", "xsantos.pe1@mktflow.com", "yoliveira.ce2@techmanuf.net", "zsouza.rn1@gmail.com", "arodrigues.pb2@codexia.dev", "bferreira.al1@vertexcapital.com", "calves.se2@viavelox.com.br", "dpereira.df1@brandix.co", "elima.go2@obrasil.ind.br", "fgomes.mt1@hotmail.com", "gcosta.ms2@devopsia.com", "hribeiro.am1@capitallink.com.br", "imartins.pa2@logifast.com.br", "jcarvalho.rr1@amplifica.mobi", "kalmeida.ro2@induscron.com.br", "llopes.ac1@gmail.com", "msoares.ap2@nexora.io", "nfernandes.to1@finovate.com", "obarbosa.ma2@transrota.net", "procha.pi1@criativahub.com.br", "qdias.eng.br@ferromak.ind", "rmendes.dev.br@gmail.com", "snunes.fin.br@cloudify.net.br", "tmachado.ops.br@investcorp.net", "umoura.mkt.br@fretex.com", "vcastro.sys.br@agenciapixel.net", "wcardoso.x.br@sidera.com"
]

const ITEMS_PER_PAGE = 10

export function UsersTab() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [userDetails, setUserDetails] = useState<any>(null)

  useEffect(() => {
    const generateUsers = () => {
      return rawEmails.map((email, index) => {
        let plan = 1 
        if (index < 9) plan = 3 
        else if (index >= 9 && index < 31) plan = 2 
        
        return {
          id: 1000 + index,
          email: email,
          is_active: Math.random() > 0.05,
          is_admin: index === 0,
          plan_id: plan
        }
      })
    }

    setTimeout(() => {
      setUsers(generateUsers())
      setLoading(false)
    }, 600)
  }, [])

  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentUsers = users.slice(startIndex, endIndex)

  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))

  const handleOpenDetails = (userId: number) => {
    setIsDetailsOpen(true)
    setLoadingDetails(true)
    
    setTimeout(() => {
      const user = users.find(u => u.id === userId)
      
      let ltv = 0
      if (user?.plan_id === 2) ltv = 97.90
      if (user?.plan_id === 3) ltv = 797.90

      setUserDetails({
        user: { email: user?.email },
        subscription: { 
          plan_name: user?.plan_id === 1 ? "Free" : user?.plan_id === 2 ? "Pro Mensal" : "Pro Anual", 
          remaining_credits: user?.plan_id !== 1 ? Math.floor(Math.random() * 5000) + 1000 : 100 
        },
        ai_costs: [
          { model: "OpenAI", tokens: Math.floor(Math.random() * 10000), cost_brl: Math.random() * 8.5 },
          { model: "ElevenLabs", tokens: Math.floor(Math.random() * 5000), cost_brl: Math.random() * 12.0 }
        ],
        total_ai_cost_brl: Math.random() * 20.5,
        lifetime_value_brl: ltv
      })
      setLoadingDetails(false)
    }, 800)
  }

  if (loading) return <div className="flex h-64 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>

  return (
    <>
      <Card className="bg-zinc-950 border-zinc-800 flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center justify-between">
            Gestão de Utilizadores
            <span className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full font-normal border border-indigo-500/20">
              {users.length} utilizadores totais
            </span>
          </CardTitle>
          <CardDescription className="text-zinc-400">Base de clientes e subscritores extraídos da base de dados.</CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col flex-1">
          <div className="rounded-md border border-zinc-800 overflow-hidden flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-900 text-zinc-300">
                <tr>
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Plano</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user.id} className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                    <td className="p-4 text-zinc-400">{user.id}</td>
                    <td className="p-4 font-medium text-zinc-100">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${user.plan_id === 3 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : user.plan_id === 2 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                        {user.plan_id === 1 ? "Free" : user.plan_id === 2 ? "Pro Mensal" : "Pro Anual"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${user.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {user.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleOpenDetails(user.id)} className="p-2 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20">
                        <ScanEye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-zinc-400">
            <div>Mostrando <span className="text-zinc-200">{startIndex + 1}</span> a <span className="text-zinc-200">{Math.min(endIndex, users.length)}</span> de <span className="text-zinc-200">{users.length}</span></div>
            <div className="flex items-center gap-2">
              <button onClick={goToPrevPage} disabled={currentPage === 1} className="p-2 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
              <span>{currentPage} / {totalPages}</span>
              <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-2 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl bg-[#121212] border-zinc-800 text-zinc-100 p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2"><ScanEye className="text-indigo-400 w-6 h-6" /> Raio-X do Cliente</DialogTitle>
            <DialogDescription className="text-zinc-400">{userDetails?.user?.email}</DialogDescription>
          </DialogHeader>

          {loadingDetails ? <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div> : userDetails ? (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-emerald-400 font-medium mb-2"><DollarSign className="w-5 h-5" /> Receita Gerada (LTV)</div>
                <span className="text-3xl font-bold text-emerald-300">R$ {userDetails.lifetime_value_brl.toFixed(2)}</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-red-400 font-medium mb-2"><BrainCircuit className="w-5 h-5" /> Custo API IA (R$)</div>
                <span className="text-3xl font-bold text-red-300">R$ {userDetails.total_ai_cost_brl.toFixed(2)}</span>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
