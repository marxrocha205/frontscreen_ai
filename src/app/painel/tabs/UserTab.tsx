"use client"

import { useEffect, useState } from "react"
import { Loader2, Power, ScanEye, DollarSign, BrainCircuit, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { config } from "@/lib/config"

interface UserData {
  id: number
  email: string
  full_name: string | null
  phone: string | null
  is_active: boolean
  is_admin: boolean
  created_at: string
}

interface UserDetails {
  user: { 
    email?: string
    full_name?: string | null
    phone?: string | null
  }
  subscription: {
    plan_name: string
    status: string
    remaining_credits: number
  }
  ai_costs: {
    model: string
    tokens: number
    cost_usd: number
  }[]
  total_ai_cost_usd: number
  lifetime_value_brl: number
}

const ITEMS_PER_PAGE = 10

export function UsersTab() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1] || localStorage.getItem('access_token');
        if (!token) return;

        const res = await fetch(`${config.apiUrl}/api/admin/users?limit=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const json = await res.json();
          setUsers(json.data);
        }
      } catch (e) {
        console.error("Erro ao buscar usuários:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [])

  const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentUsers = users.slice(startIndex, endIndex)

  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))

  const handleOpenDetails = async (userId: number) => {
    setIsDetailsOpen(true)
    setLoadingDetails(true)
    setUserDetails(null)
    
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1] || localStorage.getItem('access_token');
      const res = await fetch(`${config.apiUrl}/api/admin/users/${userId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        setUserDetails(json);
      }
    } catch (e) {
      console.error("Erro ao carregar detalhes", e);
    } finally {
      setLoadingDetails(false)
    }
  }

  if (loading) return <div className="flex h-64 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>

  return (
    <>
      <Card className="bg-zinc-950 border-zinc-800 flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center justify-between">
            Gestão de Utilizadores (Real)
            <span className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full font-normal border border-indigo-500/20">
              {users.length} utilizadores totais
            </span>
          </CardTitle>
          <CardDescription className="text-zinc-400">Base real de clientes extraídos da base de dados.</CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col flex-1 overflow-hidden p-0 sm:p-6">
          <div className="rounded-md border border-zinc-800 overflow-x-auto flex-1 w-full">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="bg-zinc-900 text-zinc-300">
                <tr>
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Nome</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Telefone</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium">Cadastro</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user.id} className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                    <td className="p-4 text-zinc-400">{user.id}</td>
                    <td className="p-4 font-medium text-zinc-100">{user.full_name || <span className="text-zinc-600 italic">—</span>}</td>
                    <td className="p-4 text-zinc-300">{user.email}</td>
                    <td className="p-4 text-zinc-400">{user.phone || <span className="text-zinc-600 italic">—</span>}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${user.is_admin ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                        {user.is_admin ? "Admin" : "Usuário"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${user.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {user.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
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

          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 text-sm text-zinc-400 gap-4 px-4 sm:px-0">
            <div>Mostrando <span className="text-zinc-200">{users.length > 0 ? startIndex + 1 : 0}</span> a <span className="text-zinc-200">{Math.min(endIndex, users.length)}</span> de <span className="text-zinc-200">{users.length}</span></div>
            <div className="flex items-center gap-2">
              <button onClick={goToPrevPage} disabled={currentPage === 1} className="p-2 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
              <span>{currentPage} / {totalPages}</span>
              <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-2 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl bg-[#121212] border-zinc-800 text-zinc-100 p-4 md:p-6 rounded-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl flex items-center gap-2"><ScanEye className="text-indigo-400 w-5 h-5 md:w-6 md:h-6" /> Raio-X do Cliente</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {userDetails?.user?.full_name && <span className="text-zinc-100 font-medium">{userDetails.user.full_name} &bull; </span>}
              {userDetails?.user?.email}
              {userDetails?.user?.phone && <span className="text-zinc-500 ml-2">({userDetails.user.phone})</span>}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div> : userDetails ? (
            <div className="space-y-4 mt-2">
              {/* Identidade */}
              {(userDetails.user.full_name || userDetails.user.phone) && (
                <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-zinc-500 text-xs mb-0.5">Nome completo</p>
                    <p className="text-zinc-100">{userDetails.user.full_name || <span className="text-zinc-600 italic">&mdash;</span>}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs mb-0.5">Telefone</p>
                    <p className="text-zinc-300">{userDetails.user.phone || <span className="text-zinc-600 italic">&mdash;</span>}</p>
                  </div>
                </div>
              )}
              {/* Financeiro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium mb-2"><DollarSign className="w-5 h-5" /> Receita Gerada (LTV)</div>
                  <span className="text-3xl font-bold text-emerald-300">R$ {userDetails.lifetime_value_brl.toFixed(2)}</span>
                  <p className="text-xs text-zinc-500 mt-2">Plano Atual: <span className="text-zinc-300">{userDetails.subscription.plan_name}</span></p>
                  <p className="text-xs text-zinc-500 mt-1">Créditos Restantes: <span className="text-zinc-300">{userDetails.subscription.remaining_credits}</span></p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-col gap-1 h-full overflow-y-auto max-h-48">
                  <div className="flex items-center gap-2 text-red-400 font-medium mb-2"><BrainCircuit className="w-5 h-5" /> Custo API IA (USD)</div>
                  <span className="text-3xl font-bold text-red-300">${userDetails.total_ai_cost_usd.toFixed(4)}</span>
                  {userDetails.ai_costs && userDetails.ai_costs.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {userDetails.ai_costs.map((cost, idx) => (
                        <div key={idx} className="flex justify-between text-xs border-t border-red-500/10 pt-1">
                          <span className="text-zinc-400">{cost.model}</span>
                          <span className="text-red-300/70">${cost.cost_usd.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 mt-2">Sem consumo registrado</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
