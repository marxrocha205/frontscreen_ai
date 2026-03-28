"use client"
import { useEffect, useState } from "react"
import { ShieldCheck, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export function AuditTab() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLogs() {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/audit`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setLogs(data.data)
      setLoading(false)
    }
    fetchLogs()
  }, [])

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100 flex items-center gap-2"><ShieldCheck className="text-indigo-500 w-5 h-5"/> Trilha de Auditoria (Compliance)</CardTitle>
        <CardDescription className="text-zinc-400">Registo imutável de ações executadas pelos administradores.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-900 text-zinc-300">
              <tr>
                <th className="p-4 font-medium">Data / Hora</th>
                <th className="p-4 font-medium">Administrador</th>
                <th className="p-4 font-medium">Ação</th>
                <th className="p-4 font-medium">Alvo (ID)</th>
                <th className="p-4 font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-zinc-800 hover:bg-zinc-800/40">
                  <td className="p-4 text-zinc-400">{new Date(log.created_at).toLocaleString('pt-PT')}</td>
                  <td className="p-4 text-indigo-400 font-medium">{log.admin_email}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300">{log.action}</span></td>
                  <td className="p-4 text-zinc-400">{log.target_entity} ({log.target_id})</td>
                  <td className="p-4 text-zinc-500 text-xs max-w-xs truncate" title={log.details}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}