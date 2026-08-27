"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { config } from '@/lib/config'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Por favor, informe seu e-mail.')
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${config.apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || 'Se o e-mail informado estiver cadastrado, enviamos um link para você redefinir sua senha.')
      } else {
        setError(data.detail || 'Ocorreu um erro ao solicitar a redefinição de senha.')
      }
    } catch (err) {
      console.error('Erro de conexão:', err)
      setError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4 animate-enter-fade-zoom">
        <div className="flex justify-center mb-2">
          <img src="/logobranco-semfundo.png" alt="ScreenAI" className="h-14 w-auto object-contain drop-shadow-md" />
        </div>
        
        <div className="text-center space-y-2 mb-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Recuperar Senha
          </h1>
          <p className="text-sm text-zinc-400 max-w-[300px] leading-relaxed mx-auto">
            Digite seu e-mail cadastrado para receber o link de redefinição de senha.
          </p>
        </div>

        <Card className="w-full bg-zinc-950 border-zinc-900 rounded-2xl shadow-none">
          <CardContent className="pt-6 pb-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {message && (
              <div className="p-4 bg-emerald-950/50 border border-emerald-900/50 rounded-lg text-emerald-300 text-sm text-center leading-relaxed">
                {message}
              </div>
            )}

            {!message && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com" 
                  className="bg-zinc-900 border-zinc-800 h-11 rounded-lg text-zinc-300 placeholder:text-zinc-500 focus-visible:ring-zinc-700" 
                  required
                />
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-lg h-11 font-medium"
                >
                  {isLoading ? 'Enviando link...' : 'Enviar link de redefinição'}
                </Button>
              </form>
            )}
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
