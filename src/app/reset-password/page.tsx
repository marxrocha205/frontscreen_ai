"use client"

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { config } from '@/lib/config'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 bg-red-950/50 border border-red-900/50 rounded-lg text-red-400 text-sm">
          Link de redefinição inválido ou token não fornecido.
        </div>
        <Link href="/forgot-password" className="text-sm font-medium text-zinc-100 hover:underline block">
          Solicitar novo link de redefinição
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      setError('Por favor, preencha a nova senha e a confirmação.')
      return
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${config.apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          new_password: newPassword
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage(data.message || 'Senha alterada com sucesso!')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(data.detail || 'Falha ao redefinir a senha. O link pode ter expirado.')
      }
    } catch (err) {
      console.error('Erro ao redefinir senha:', err)
      setError('Erro de conexão ao servidor. Tente novamente mais tarde.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-lg text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {successMessage ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-950/50 border border-emerald-900/50 rounded-lg text-emerald-300 text-sm text-center leading-relaxed">
            {successMessage}
            <p className="text-xs text-emerald-400/80 mt-2">Redirecionando para o login em 3 segundos...</p>
          </div>
          <Button 
            onClick={() => router.push('/login')} 
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-lg h-11 font-medium"
          >
            Ir para o Login Agora
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400 font-medium">Nova Senha</label>
            <Input 
              type="password" 
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha (min 6 caracteres)" 
              className="bg-zinc-900 border-zinc-800 h-11 rounded-lg text-zinc-300 placeholder:text-zinc-500 focus-visible:ring-zinc-700" 
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400 font-medium">Confirmar Nova Senha</label>
            <Input 
              type="password" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha" 
              className="bg-zinc-900 border-zinc-800 h-11 rounded-lg text-zinc-300 placeholder:text-zinc-500 focus-visible:ring-zinc-700" 
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-lg h-11 font-medium mt-2"
          >
            {isLoading ? 'Salvando...' : 'Salvar Nova Senha'}
          </Button>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4 animate-enter-fade-zoom">
        <div className="flex justify-center mb-2">
          <img src="/logobranco-semfundo.png" alt="ScreenAI" className="h-14 w-auto object-contain drop-shadow-md" />
        </div>
        
        <div className="text-center space-y-2 mb-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Redefinir Senha
          </h1>
          <p className="text-sm text-zinc-400 max-w-[280px] leading-relaxed mx-auto">
            Digite e confirme sua nova senha de acesso.
          </p>
        </div>

        <Card className="w-full bg-zinc-950 border-zinc-900 rounded-2xl shadow-none">
          <CardContent className="pt-6 pb-4">
            <Suspense fallback={<div className="text-center text-zinc-500 text-sm">Carregando...</div>}>
              <ResetPasswordForm />
            </Suspense>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pb-6">
            <div className="text-sm text-zinc-400 text-center w-full">
              Lembrou sua senha?{' '}
              <Link href="/login" className="font-medium text-zinc-100 hover:underline">
                Voltar para o login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
