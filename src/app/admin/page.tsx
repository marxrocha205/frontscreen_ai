"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Users, MessageSquare, Coins, History, Loader2, AlertCircle, HardDrive } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

// Tipagens
interface AdminMetrics {
  total_users: number
  total_sessions: number
  total_messages: number
  total_credits_in_circulation: number
}
interface RecentActivity { session_id: string; title: string; user_email: string; created_at: string }
interface UserData { id: number; email: string; is_active: boolean; is_admin: boolean; created_at: string }

export default function AdminPage() {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'dashboard'

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [recentChats, setRecentChats] = useState<RecentActivity[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAdminData() {
      const token = localStorage.getItem("access_token")
      
      if (!token) {
        setError("Nenhum token de autenticação encontrado. Faça login novamente.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const headers = { Authorization: `Bearer ${token}` }
        const baseUrl = process.env.NEXT_PUBLIC_API_URL

        const [metricsRes, chatsRes, usersRes] = await Promise.all([
          fetch(`${baseUrl}/api/admin/metrics`, { headers }),
          fetch(`${baseUrl}/api/admin/sessions`, { headers }),
          fetch(`${baseUrl}/api/admin/users`, { headers })
        ])

        if (!metricsRes.ok) throw new Error("Acesso negado ou erro no servidor.")

        const metricsData = await metricsRes.json()
        const chatsData = await chatsRes.json()
        const usersData = await usersRes.json()

        setMetrics(metricsData.data)
        setRecentChats(chatsData.data)
        setUsers(usersData.data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
        <span className="ml-2 text-lg font-medium text-zinc-900">A carregar dados...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900">Erro de Acesso</h2>
          <p className="text-zinc-600">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    )
  }

  // Função Sênior: Retorna o conteúdo correto dependendo do clique na Sidebar
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Users" value={metrics?.total_users || 0} icon={<Users className="h-4 w-4 text-muted-foreground" />} description="Registered accounts" />
            <MetricCard title="Sessions" value={metrics?.total_sessions || 0} icon={<History className="h-4 w-4 text-muted-foreground" />} description="Active & past chats" />
            <MetricCard title="Messages" value={metrics?.total_messages || 0} icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />} description="Total interactions" />
            <MetricCard title="Active Credits" value={metrics?.total_credits_in_circulation || 0} icon={<Coins className="h-4 w-4 text-muted-foreground" />} description="System liabilities" />
          </div>
        )
      case 'users':
        return (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage platform users.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-100 text-zinc-600">
                    <tr>
                      <th className="p-3 font-medium">ID</th>
                      <th className="p-3 font-medium">Email</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Registration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t">
                        <td className="p-3">{user.id}</td>
                        <td className="p-3 font-medium">{user.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-500">{new Date(user.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      case 'sessions':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Global Sessions Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {recentChats.map((chat) => (
                    <div key={chat.session_id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-zinc-900">{chat.title || "Untitled Session"}</p>
                        <p className="text-xs text-zinc-500">{chat.user_email}</p>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {new Date(chat.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )
      case 'storage':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Storage Metrics</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <HardDrive className="h-16 w-16 text-zinc-300 mb-4" />
              <h3 className="text-lg font-semibold text-zinc-900">Storage module in development</h3>
              <p className="text-sm text-zinc-500 max-w-sm mt-2">
                This space will map physical file dimensions (S3/GCS buckets) in a future update.
              </p>
            </CardContent>
          </Card>
        )
      default:
        // Caso o utilizador clique numa aba que ainda não implementámos no backend
        return (
          <div className="flex h-[400px] flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-xl">
            <h3 className="text-lg font-semibold text-zinc-500">Módulo em Desenvolvimento</h3>
            <p className="text-sm text-zinc-400">A aba de {currentTab} estará disponível em breve.</p>
          </div>
        )
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 capitalize">
          {currentTab.replace('-', ' ')}
        </h2>
        <p className="text-zinc-500 text-sm mt-1">
          Monitorização e controlo geral do sistema.
        </p>
      </div>
      
      {renderContent()}
    </div>
  )
}

function MetricCard({ title, value, icon, description }: { title: string, value: number, icon: React.ReactNode, description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-zinc-900">{value.toLocaleString()}</div>
        <p className="text-xs text-zinc-500">{description}</p>
      </CardContent>
    </Card>
  )
}