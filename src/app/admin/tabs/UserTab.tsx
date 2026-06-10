"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, Power, ScanEye, DollarSign, BrainCircuit, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { config } from "@/lib/config"

// ─── Tipos ─────────────────────────────────────────────────────

/** Dados básicos de um utilizador retornados por GET /api/admin/users */
interface UserData {
  id: number
  email: string
  is_active: boolean
  is_admin: boolean
  created_at: string
}

/** Detalhes completos do utilizador retornados por GET /api/admin/users/{id}/details */
interface UserDetails {
  user: { email: string; id: number; created_at: string; is_active: boolean }
  subscription: { plan_name: string; status: string; remaining_credits: number }
  ai_costs: Array<{ model: string; tokens: number; cost_usd: number }>
  total_ai_cost_usd: number
  lifetime_value_brl: number
}

// ─── Constantes ────────────────────────────────────────────────

/** Taxa de câmbio USD → BRL */
const USD_TO_BRL = 5.45
const ITEMS_PER_PAGE = 10

// ─── Utilitários ───────────────────────────────────────────────

const formatBRL = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Erro inesperado."

// ─── Componente Principal ──────────────────────────────────────

/**
 * UsersTab — Gestão de Utilizadores
 *
 * Consome dados reais dos endpoints:
 * - GET /api/admin/users        → Lista de utilizadores registados
 * - GET /api/admin/users/{id}/details → Raio-X detalhado do utilizador
 *
 * Substitui a lista hardcoded de emails mock que existia anteriormente.
 */
export function UsersTab() {
  // ─── Estados ───────────────────────────────────────────────
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Modal de detalhes
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  // ─── Fetch: Lista de Utilizadores ──────────────────────────

  const fetchUsers = useCallback(async () => {
    const controller = new AbortController()

    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("access_token")
      if (!token) throw new Error("Token de autenticação não encontrado.")

      const res = await fetch(`${config.apiUrl}/api/admin/users?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail || `Erro HTTP ${res.status} ao carregar utilizadores.`)
      }

      const data = await res.json()
      setUsers(data.data ?? [])

    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }

    return () => controller.abort()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // ─── Fetch: Detalhes do Utilizador (Raio-X) ────────────────

  const handleOpenDetails = useCallback(async (userId: number) => {
    setIsDetailsOpen(true)
    setLoadingDetails(true)
    setDetailsError(null)
    setUserDetails(null)

    try {
      const token = localStorage.getItem("access_token")
      if (!token) throw new Error("Token de autenticação não encontrado.")

      const res = await fetch(`${config.apiUrl}/api/admin/users/${userId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail || `Erro HTTP ${res.status} ao carregar detalhes.`)
      }

      const data = await res.json()
      setUserDetails(data)

    } catch (err: unknown) {
      setDetailsError(getErrorMessage(err))
    } finally {
      setLoadingDetails(false)
    }
  }, [])

  // ─── Paginação ─────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentUsers = users.slice(startIndex, endIndex)

  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))

  // ─── Estado de Carregamento ────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="text-zinc-500 text-sm">A carregar utilizadores...</span>
      </div>
    )
  }

  // ─── Estado de Erro ────────────────────────────────────────

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-red-500">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  // ─── Estado Vazio ──────────────────────────────────────────

  if (users.length === 0) {
    return (
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Gestão de Utilizadores</CardTitle>
          <CardDescription className="text-zinc-400">
            Nenhum utilizador encontrado na base de dados.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // ─── Mapeamento de Plano (baseado no que a API retorna) ────

  const getPlanBadge = (email: string, isAdmin: boolean) => {
    if (isAdmin) {
      return (
        <span className="px-2 py-1 rounded-md text-xs font-medium border bg-purple-500/10 text-purple-400 border-purple-500/20">
          Admin
        </span>
      )
    }
    // A informação do plano virá dos detalhes; exibimos um placeholder
    return (
      <span className="px-2 py-1 rounded-md text-xs font-medium border bg-zinc-800 text-zinc-400 border-zinc-700">
        —
      </span>
    )
  }

  // ─── Renderização ───────────────────────────────────────────

  return (
    <>
      <Card className="bg-zinc-950 border-zinc-800 flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center justify-between">
            Gestão de Utilizadores
            <span className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full font-normal border border-indigo-500/20">
              {users.length} utilizadores
            </span>
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Base de clientes e subscritores — dados reais da base de dados.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col flex-1">
          <div className="rounded-md border border-zinc-800 overflow-hidden flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-900 text-zinc-300">
                <tr>
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Tipo</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user.id} className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                    <td className="p-4 text-zinc-400 font-mono text-xs">{user.id}</td>
                    <td className="p-4 font-medium text-zinc-100">{user.email}</td>
                    <td className="p-4">
                      {getPlanBadge(user.email, user.is_admin)}
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
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenDetails(user.id)}
                        className="p-2 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
                        title="Ver detalhes do utilizador"
                      >
                        <ScanEye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Controles de paginação */}
          <div className="flex items-center justify-between mt-4 text-sm text-zinc-400">
            <div>
              Mostrando <span className="text-zinc-200">{startIndex + 1}</span> a{" "}
              <span className="text-zinc-200">{Math.min(endIndex, users.length)}</span> de{" "}
              <span className="text-zinc-200">{users.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="p-2 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>{currentPage} / {totalPages}</span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-2 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Modal de Detalhes (Raio-X) ────────────────────── */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl bg-[#121212] border-zinc-800 text-zinc-100 p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <ScanEye className="text-indigo-400 w-6 h-6" /> Raio-X do Cliente
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {userDetails?.user?.email ?? "A carregar..."}
            </DialogDescription>
          </DialogHeader>

          {/* Carregamento dos detalhes */}
          {loadingDetails && (
            <div className="flex h-40 w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              <span className="ml-3 text-zinc-400 text-sm">A carregar detalhes...</span>
            </div>
          )}

          {/* Erro ao carregar detalhes */}
          {detailsError && !loadingDetails && (
            <div className="flex h-40 flex-col items-center justify-center text-red-500 gap-2">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm">{detailsError}</p>
            </div>
          )}

          {/* Detalhes carregados com sucesso */}
          {userDetails && !loadingDetails && (
            <div className="space-y-4 mt-4">
              {/* Grid de métricas financeiras */}
              <div className="grid grid-cols-2 gap-4">
                {/* Receita Gerada (LTV) */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium mb-2">
                    <DollarSign className="w-5 h-5" /> Receita Gerada (LTV)
                  </div>
                  <span className="text-3xl font-bold text-emerald-300">
                    {formatBRL(userDetails.lifetime_value_brl)}
                  </span>
                  <span className="text-xs text-emerald-500/70">
                    Plano: {userDetails.subscription.plan_name}
                  </span>
                </div>

                {/* Custo API IA */}
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
                    <BrainCircuit className="w-5 h-5" /> Custo API IA
                  </div>
                  <span className="text-3xl font-bold text-red-300">
                    {formatBRL(userDetails.total_ai_cost_usd * USD_TO_BRL)}
                  </span>
                  <span className="text-xs text-red-500/70">
                    ≈ ${userDetails.total_ai_cost_usd.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Detalhes da assinatura */}
              <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Assinatura</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">Plano:</span>{" "}
                    <span className="text-zinc-200 font-medium">{userDetails.subscription.plan_name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Estado:</span>{" "}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      userDetails.subscription.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {userDetails.subscription.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500">Créditos Restantes:</span>{" "}
                    <span className="text-zinc-200 font-mono font-medium">
                      {userDetails.subscription.remaining_credits.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Custos de IA por modelo */}
              {userDetails.ai_costs.length > 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                  <h4 className="text-sm font-medium text-zinc-300 mb-3">Consumo de IA por Modelo</h4>
                  <div className="space-y-2">
                    {userDetails.ai_costs.map((cost, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">{cost.model}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-500 text-xs">{cost.tokens.toLocaleString()} tokens</span>
                          <span className="text-zinc-200 font-mono">
                            {formatBRL(cost.cost_usd * USD_TO_BRL)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
