"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, AlertCircle, Power, ScanEye, DollarSign, BrainCircuit, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { config } from "@/lib/config"

interface UserData {
  id: number
  email: string
  is_active: boolean
  is_admin: boolean
  created_at: string
  plan_id?: number
}

// Tipagem do Raio-X retornado pela API
interface UserDetailsData {
  user: { id: number, email: string, created_at: string, is_active: boolean }
  subscription: { plan_name: string, status: string, remaining_credits: number }
  ai_costs: { model: string, tokens: number, cost_usd: number }[]
  total_ai_cost_usd: number
  lifetime_value_brl: number
}

export function UsersTab() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<number | null>(null)

  // Estados do Modal Raio-X
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [userDetails, setUserDetails] = useState<UserDetailsData | null>(null)

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token) throw new Error("Não autenticado")
      const res = await fetch(`${config.apiUrl}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` }, signal })
      if (!res.ok) throw new Error("Falha ao carregar a lista")
      const data = await res.json()
      setUsers(data.data)
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchUsers(controller.signal)
    return () => controller.abort()
  }, [fetchUsers])

  // Função para abrir o Raio-X do Utilizador
  const handleOpenDetails = async (userId: number) => {
    setIsDetailsOpen(true)
    setLoadingDetails(true)
    setUserDetails(null)
    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`${config.apiUrl}/api/admin/users/${userId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUserDetails(data)
      } else {
        alert("Erro ao buscar detalhes.")
      }
    } catch (error) {
      console.error(error)
      alert("Erro de conexão.")
    } finally {
      setLoadingDetails(false)
    }
  }

  const handlePlanChange = async (userId: number, newPlanId: number) => {
    setIsUpdating(userId)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${config.apiUrl}/api/admin/users/${userId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ plan_id: newPlanId })
      })
      if (response.ok) {
        setUsers((prev) => prev.map(u => u.id === userId ? { ...u, plan_id: newPlanId } : u))
      } else {
        alert('Erro ao mudar plano')
      }
    } catch (error) {
      alert('Erro de conexão ao tentar mudar o plano.')
    } finally {
      setIsUpdating(null)
    }
  }

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    setIsUpdating(userId)
    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`${config.apiUrl}/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus })
      })
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !currentStatus } : u))
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsUpdating(null)
    }
  }

  if (loading) return <div className="flex h-64 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>
  if (error) return <div className="flex h-64 w-full flex-col items-center justify-center space-y-2 text-red-500"><AlertCircle className="h-8 w-8" /><p>{error}</p></div>

  return (
    <>
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Gestão de Utilizadores</CardTitle>
          <CardDescription className="text-zinc-400">Visualize e gira os utilizadores registados na plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800 overflow-hidden">
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
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                    <td className="p-4 text-zinc-400">{user.id}</td>
                    <td className="p-4 font-medium text-zinc-100">{user.email}</td>
                    <td className="p-4">
                      {user.is_admin ? <span className="px-2 py-1 rounded-md text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Admin</span> : <span className="px-2 py-1 rounded-md text-xs bg-zinc-800 text-zinc-300 border border-zinc-700">User</span>}
                    </td>
                    <td className="p-4">
                      <select 
                        value={user.plan_id || 1} 
                        onChange={(e) => handlePlanChange(user.id, parseInt(e.target.value))}
                        disabled={isUpdating === user.id}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-md p-1.5 outline-none hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
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
                      {/* BOTÃO RAIO-X */}
                      <button 
                        onClick={() => handleOpenDetails(user.id)}
                        className="inline-flex items-center justify-center p-2 rounded-md transition-colors bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20"
                        title="Ver Raio-X do Utilizador"
                      >
                        <ScanEye className="h-4 w-4" />
                      </button>
                      
                      <button 
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        disabled={isUpdating === user.id}
                        className={`inline-flex items-center justify-center p-2 rounded-md transition-colors disabled:opacity-50 ${user.is_active ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                      >
                        {isUpdating === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL RAIO-X */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl bg-[#121212] border-zinc-800 text-zinc-100 p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <ScanEye className="text-indigo-400 w-6 h-6" /> Raio-X do Cliente
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {userDetails?.user?.email || "Carregando informações..."}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex h-40 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
          ) : userDetails ? (
            <div className="grid grid-cols-2 gap-4 mt-4">
              
              {/* LTV - Lifetime Value (Receita) */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-emerald-400 font-medium mb-2">
                  <DollarSign className="w-5 h-5" /> Receita Gerada (LTV)
                </div>
                <span className="text-3xl font-bold text-emerald-300">
                  R$ {userDetails.lifetime_value_brl.toFixed(2)}
                </span>
                <span className="text-xs text-emerald-500/70 mt-1">Total pago na AlphaPay</span>
              </div>

              {/* Custos Totais IA */}
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
                  <BrainCircuit className="w-5 h-5" /> Custo API IA
                </div>
                <span className="text-3xl font-bold text-red-300">
                  $ {userDetails.total_ai_cost_usd.toFixed(4)}
                </span>
                <span className="text-xs text-red-500/70 mt-1">Custo base (Tokens consumidos)</span>
              </div>

              {/* Status do Plano */}
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-zinc-400 text-sm font-medium">Plano Atual</span>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-xl font-bold text-zinc-200">{userDetails.subscription.plan_name}</span>
                  <span className="text-sm bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30">
                    {userDetails.subscription.remaining_credits} créditos
                  </span>
                </div>
              </div>

              {/* Breakdown dos Modelos (Gemini vs GPT) */}
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 rounded-xl flex flex-col col-span-2">
                <span className="text-zinc-400 text-sm font-medium mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Distribuição de Custos por IA
                </span>
                {userDetails.ai_costs.length === 0 ? (
                  <span className="text-zinc-600 text-sm">Nenhum custo registado ainda.</span>
                ) : (
                  <div className="space-y-2">
                    {userDetails.ai_costs.map((ai, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-900/50 p-2 rounded-md border border-zinc-800/50">
                        <span className="text-sm font-mono text-zinc-300">{ai.model}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-zinc-500">{ai.tokens.toLocaleString()} tokens</span>
                          <span className="text-red-400 font-medium">${ai.cost_usd.toFixed(4)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
            </div>
          ) : (
            <div className="text-center text-zinc-500 py-8">Nenhum dado encontrado.</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}