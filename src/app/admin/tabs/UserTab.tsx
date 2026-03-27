"use client"

import { useEffect, useState } from "react"
import { Loader2, AlertCircle, Power } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// Tipagem rigorosa
interface UserData {
  id: number
  email: string
  is_active: boolean
  is_admin: boolean
  created_at: string
}

export function UsersTab() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Estado para controlar a interface durante a mutação de dados (evitar duplos cliques)
  const [isUpdating, setIsUpdating] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchUsers() {
      try {
        const token = localStorage.getItem("access_token")
        if (!token) throw new Error("Não autenticado")

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
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
    }

    fetchUsers()
    return () => controller.abort()
  }, [])

  // Função Sênior para mutação de estado (PATCH)
  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    setIsUpdating(userId)
    try {
      const token = localStorage.getItem("access_token")
      const newStatus = !currentStatus

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/status`, {
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

      // Atualização otimista da View (sem necessidade de recarregar a lista toda)
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
    // CORREÇÃO VISUAL: Card agora tem fundo transparente/escuro e bordas adequadas
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
            {/* CORREÇÃO VISUAL: Cabeçalho com fundo escuro e texto claro */}
            <thead className="bg-zinc-900 text-zinc-300">
              <tr>
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Permissões</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium">Data de Registo</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                // CORREÇÃO VISUAL: Linhas com separadores subtis e hover escuro
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
                    {/* BOTÃO DE AÇÃO PARA ALTERAR O ESTADO */}
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
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
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