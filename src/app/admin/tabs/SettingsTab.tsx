"use client"
import { useEffect, useState } from "react"
import { Settings2, Save, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function SettingsTab() {
  const [settings, setSettings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSettings() {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setSettings(data.data)
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSave = async (key: string, value: string) => {
    setSavingKey(key)
    const token = localStorage.getItem("access_token")
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/${key}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ value })
    })
    setSavingKey(null)
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2"><Settings2 className="text-indigo-500 w-5 h-5"/> Configurações de Sistema</CardTitle>
          <CardDescription className="text-zinc-400">Variáveis dinâmicas de ambiente (aplica-se a quente).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings.map((s) => (
            <div key={s.key} className="flex flex-col gap-2 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <div className="flex justify-between items-center">
                <label className="text-zinc-200 font-medium">{s.key}</label>
                <span className="text-xs text-zinc-500">Última alteração: {new Date(s.updated_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-zinc-400 mb-2">{s.description}</p>
              <div className="flex gap-2">
                <Input 
                  value={s.value} 
                  onChange={(e) => setSettings(prev => prev.map(item => item.key === s.key ? { ...item, value: e.target.value } : item))}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono text-sm"
                />
                <Button 
  onClick={() => handleSave(s.key, s.value)} 
  disabled={savingKey === s.key} 
  variant="default" // Alterado de "secondary" para "default"
  className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
>
  {savingKey === s.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}