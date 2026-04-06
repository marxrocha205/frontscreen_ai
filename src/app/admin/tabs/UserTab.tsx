"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, AlertCircle, Power } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { config } from "@/lib/config"

// Tipagem rigorosa (Adicionamos o plan_id aqui!)
interface UserData {
  id: number
  email: string
  is_active: boolean
  is_admin: boolean
  created_at: string
  plan_id?: number // Novo campo adicionado
}

export function UsersTab() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<number | null>(null)

  // Separamos o fetchUsers para poder recarregar a tabela depois de mudar o plano
  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token) throw new Error("Não autenticado")

      const res = await fetch(`${config.apiUrl}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        signal
      })

      if (!res.ok) throw new Error("Falha ao carregar a lista de utilizadores")

      const data = await res.json()
      setUsers(data.data)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchUsers(controller.signal)
    return () => controller.abort()
  }, [fetchUsers])

  // ==========================================
  // NOVA FUNÇÃO: MUDAR PLANO
  // ==========================================
  const handlePlanChange = async (userId: number, newPlanId: number) => {
    setIsUpdating(userId)
    try {
      const token = localStorage.getItem('access_token')
      
      const response = await fetch(`${config.apiUrl}/admin/users/${userId}/plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan_id: newPlanId })
      })

      const data = await response.json()
      
      if (response.ok) {
        // Atualiza apenas o plano daquele usuário na tela rapidamente
        setUsers((prev) => prev.map(u => u.id === userId ? { ...u, plan_id: newPlanId } : u))
        alert("Plano alterado com sucesso!")
      } else {
        alert(data.detail || 'Erro ao mudar plano')
      }
    } catch (error) {
      console.error('Erro na requisição:', error)
      alert('Erro de conexão ao tentar mudar o plano.')
    } finally {
      setIsUpdating(null)
    }
  }

  // Função Sênior para mutação de estado (PATCH)
  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    setIsUpdating(userId)
    try {
      const token = localStorage.getItem("access_token")
      const newStatus = !currentStatus

      const res = await fetch(`${config.apiUrl}/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_active: newStatus })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || "Erro ao atualizar estado.")
      }

      setUsers((prevUsers) => 
        prevUsers.map((u) => u.id === userId ? { ...u, is_active: newStatus } : u)
      )
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
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
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100">Gestão de Utilizadores</CardTitle>
        <CardDescription className="text-zinc-400">
          Visualize e gira os utilizadores registados na plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-900 text-zinc-300">
              <tr>
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Permissões</th>
                
                {/* NOVA COLUNA DE PLANO */}
                <th className="p-4 font-medium">Plano</th>
                
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium">Data de Registo</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                  <td className="p-4 text-zinc-400">{user.id}</td>
                  <td className="p-4 font-medium text-zinc-100">{user.email}</td>
                  <td className="p-4">
                    {user.is_admin ? (
                      <span className="px-2 py-1 rounded-md text-xs bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">Admin</span>
                    ) : (
                      <span className="px-2 py-1 rounded-md text-xs bg-zinc-800 text-zinc-300 border border-zinc-700">User</span>
                    )}
                  </td>
                  
                  {/* NOVO CAMPO: DROPDOWN DE PLANOS */}
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
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
                      user.is_active 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {user.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-400">
                    {new Date(user.created_at).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      disabled={isUpdating === user.id}
                      className={`inline-flex items-center justify-center p-2 rounded-md transition-colors disabled:opacity-50 ${
                        user.is_active 
                          ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                          : 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
                      }`}
                      title={user.is_active ? "Suspender Utilizador" : "Reativar Utilizador"}
                    >
                      {isUpdating === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    Nenhum utilizador encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
