"use client"

import { useEffect, useState } from "react"
import { 
  Loader2, 
  AlertCircle, 
  Power, 
  ScanEye, 
  DollarSign, 
  BrainCircuit, 
  Activity,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface UserData {
  id: number
  email: string
  is_active: boolean
  is_admin: boolean
  created_at: string
  plan_id?: number
}

const firstNames = ["joao", "maria", "pedro", "lucas", "ana", "marcos", "julia", "carlos", "fernanda", "rafael", "bruna", "tiago", "camila", "felipe", "amanda"]
const domains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br", "empresa.com.br"]

// Constante para definir o limite por página, facilitando manutenção futura
const ITEMS_PER_PAGE = 10

export function UsersTab() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de Paginação
  const [currentPage, setCurrentPage] = useState(1)

  // Estados do Modal Raio-X
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [userDetails, setUserDetails] = useState<any>(null)

  useEffect(() => {
    // Geração dos 214 utilizadores fake
    const generateFakeUsers = () => {
      const fakeUsers: UserData[] = []
      
      for (let i = 0; i < 214; i++) {
        const name = firstNames[Math.floor(Math.random() * firstNames.length)]
        const domain = domains[Math.floor(Math.random() * domains.length)]
        const randomNum = Math.floor(Math.random() * 999)
        
        const rand = Math.random()
        const plan = rand < 0.6 ? 1 : rand < 0.85 ? 2 : 3

        fakeUsers.push({
          id: 1000 + i,
          email: i === 0 ? "admin@screenai.com" : `${name}${randomNum}@${domain}`,
          is_active: Math.random() > 0.05,
          is_admin: i === 0,
          created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
          plan_id: plan
        })
      }
      return fakeUsers.sort((a, b) => b.id - a.id)
    }

    setTimeout(() => {
      setUsers(generateFakeUsers())
      setLoading(false)
    }, 600)
  }, [])

  // --- LÓGICA DE PAGINAÇÃO ---
  // 1. Calcula o total de páginas (Arredonda para cima: 214 / 10 = 22 páginas)
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE)
  
  // 2. Calcula o índice inicial e final para o slice()
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  
  // 3. Extrai apenas os utilizadores da página atual
  const currentUsers = users.slice(startIndex, endIndex)

  // Funções de navegação
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
  // ---------------------------

  const handleOpenDetails = (userId: number) => {
    setIsDetailsOpen(true)
    setLoadingDetails(true)
    
    setTimeout(() => {
      const user = users.find(u => u.id === userId)
      const isPaid = user?.plan_id !== 1
      
      setUserDetails({
        user: { email: user?.email },
        subscription: { 
          plan_name: user?.plan_id === 1 ? "Free" : user?.plan_id === 2 ? "Pro" : "Plus", 
          remaining_credits: isPaid ? Math.floor(Math.random() * 5000) + 1000 : Math.floor(Math.random() * 100) 
        },
        ai_costs: [
          { model: "gpt-4o", tokens: Math.floor(Math.random() * 50000), cost_usd: Math.random() * 2 },
          { model: "claude-3.5-sonnet", tokens: Math.floor(Math.random() * 20000), cost_usd: Math.random() }
        ],
        total_ai_cost_usd: Math.random() * 3,
        lifetime_value_brl: isPaid ? (user?.plan_id === 2 ? 49.00 : 97.00) * (Math.floor(Math.random() * 3) + 1) : 0
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
          <CardDescription className="text-zinc-400">Visualize e gira os utilizadores registados na plataforma.</CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col flex-1">
          <div className="rounded-md border border-zinc-800 overflow-hidden flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-900 text-zinc-300">
                <tr>
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Permissões</th>
                  <th className="p-4 font-medium">Plano</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {/* Renderizamos apenas os 'currentUsers' (10 por página) */}
                {currentUsers.map((user) => (
                  <tr key={user.id} className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                    <td className="p-4 text-zinc-400">{user.id}</td>
                    <td className="p-4 font-medium text-zinc-100">{user.email}</td>
                    <td className="p-4">
                      {user.is_admin ? <span className="px-2 py-1 rounded-md text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Admin</span> : <span className="px-2 py-1 rounded-md text-xs bg-zinc-800 text-zinc-300 border border-zinc-700">User</span>}
                    </td>
                    <td className="p-4">
                      <select 
                        value={user.plan_id || 1} 
                        onChange={() => {}}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-md p-1.5 outline-none hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        <option value={1}>Free</option>
                        <option value={2}>Pro</option>
                        <option value={3}>Plus</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${user.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {user.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenDetails(user.id)}
                        className="inline-flex items-center justify-center p-2 rounded-md transition-colors bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20"
                      >
                        <ScanEye className="h-4 w-4" />
                      </button>
                      
                      <button className={`inline-flex items-center justify-center p-2 rounded-md transition-colors ${user.is_active ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}>
                        <Power className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CONTROLOS DE PAGINAÇÃO */}
          <div className="flex items-center justify-between mt-4 text-sm text-zinc-400">
            <div>
              Mostrando <span className="font-medium text-zinc-200">{startIndex + 1}</span> a <span className="font-medium text-zinc-200">{Math.min(endIndex, users.length)}</span> de <span className="font-medium text-zinc-200">{users.length}</span> utilizadores
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1}
                className="p-2 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Página Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="px-4 py-2 text-zinc-300 font-medium">
                {currentPage} / {totalPages}
              </span>

              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages}
                className="p-2 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Próxima Página"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL RAIO-X FAKE MANTIDO */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl bg-[#121212] border-zinc-800 text-zinc-100 p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <ScanEye className="text-indigo-400 w-6 h-6" /> Raio-X do Cliente
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {userDetails?.user?.email}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
             <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
          ) : userDetails ? (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-emerald-400 font-medium mb-2">
                  <DollarSign className="w-5 h-5" /> Receita Gerada (LTV)
                </div>
                <span className="text-3xl font-bold text-emerald-300">
                  R$ {userDetails.lifetime_value_brl.toFixed(2)}
                </span>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
                  <BrainCircuit className="w-5 h-5" /> Custo API IA
                </div>
                <span className="text-3xl font-bold text-red-300">
                  $ {userDetails.total_ai_cost_usd.toFixed(4)}
                </span>
              </div>

              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 rounded-xl flex flex-col justify-between col-span-2">
                <span className="text-zinc-400 text-sm font-medium">Plano Atual</span>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-xl font-bold text-zinc-200">{userDetails.subscription.plan_name}</span>
                  <span className="text-sm bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30">
                    {userDetails.subscription.remaining_credits} créditos
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
