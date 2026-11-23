"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { config } from '@/lib/config'

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (confirm.trim().toUpperCase() !== 'EXCLUIR') {
      setError('Digite EXCLUIR para confirmar.')
      return
    }
    setIsLoading(true)
    try {
      const form = new URLSearchParams()
      form.set('username', email)
      form.set('password', password)
      const loginRes = await fetch(`${config.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      })
      const loginData = await loginRes.json().catch(() => ({}))
      if (!loginRes.ok || !loginData.access_token) {
        setError(loginData.detail || 'E-mail ou senha incorretos.')
        return
      }
      const res = await fetch(`${config.apiUrl}/auth/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginData.access_token}`,
        },
        body: JSON.stringify({ confirm: 'EXCLUIR', password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setMessage('Sua conta e os dados associados foram excluídos.')
      } else {
        setError(data.detail || 'Não foi possível excluir a conta.')
      }
    } catch {
      setError('Não foi possível conectar ao servidor. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 py-10">
      <div className="flex flex-col items-center gap-6 w-full max-w-md px-4">
        <img src="/logobranco-semfundo.png" alt="ScreenAI" className="h-14 w-auto object-contain" />
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-zinc-100">Excluir conta ScreenAI</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Ao excluir, removemos permanentemente sua conta, conversas, histórico de uso, assinatura e
            transações associadas. Esta ação não pode ser desfeita.
            Se você entrou com o Google, exclua pelo aplicativo em Ajustes &gt; Excluir conta.
          </p>
        </div>

        <Card className="w-full bg-zinc-950 border-zinc-900 rounded-2xl shadow-none">
          <CardContent className="pt-6 pb-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-lg text-red-400 text-sm text-center">{error}</div>
            )}
            {message ? (
              <div className="p-4 bg-emerald-950/50 border border-emerald-900/50 rounded-lg text-emerald-300 text-sm text-center">{message}</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail da conta" required className="bg-zinc-900 border-zinc-800 h-11 text-zinc-300" />
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" required className="bg-zinc-900 border-zinc-800 h-11 text-zinc-300" />
                <Input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder='Digite EXCLUIR para confirmar' required className="bg-zinc-900 border-zinc-800 h-11 text-zinc-300" />
                <Button type="submit" disabled={isLoading} className="w-full bg-red-600 text-white hover:bg-red-700 h-11 font-medium">
                  {isLoading ? 'Excluindo...' : 'Excluir minha conta'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <Link href="/privacy" className="text-sm text-zinc-400 hover:text-zinc-200 underline underline-offset-4">Política de Privacidade</Link>
      </div>
    </div>
  )
}
