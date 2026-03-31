"use client"

import { useEffect, useState } from "react"
import { Radio, Activity, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { config } from "@/lib/config"

export function WebsocketsTab() {
  const [stats, setStats] = useState({ total_active: 0, active_users: [] })

  useEffect(() => {
    // Em produção, isto poderia ser um próprio WebSocket de monitorização,
    // mas para o Admin, um polling de 5s é eficiente e seguro.
    const interval = setInterval(async () => {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`${config.apiUrl}/api/admin/websockets/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setStats(data.data)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium">Conexões Ativas</CardTitle>
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{stats.total_active}</div>
            <p className="text-xs text-zinc-500">Utilizadores em stream neste momento</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Listagem de IDs conectados */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
            <CardTitle className="text-zinc-100 text-sm">IDs em Sessão</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-wrap gap-2">
                {stats.active_users.map(id => (
                    <span key={id} className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400">
                        User ID: {id}
                    </span>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  )
}