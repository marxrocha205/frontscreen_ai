"use client"

import { useI18n } from '@/context/i18n-context'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useState, Suspense, useEffect } from 'react'
import { config } from '@/lib/config'
import Cookies from 'js-cookie'
import { GoogleLogin } from '@react-oauth/google'

function RegisterForm() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  
  const initialEmail = searchParams.get('email') || ''
  
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsGoogleLoading(true)
    setError('')
    try {
      const res = await fetch(`${config.apiUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('access_token', data.access_token)
        Cookies.set('access_token', data.access_token, { 
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        })
        login('')
        window.location.href = '/app'
      } else {
        const errData = await res.json().catch(() => ({}))
        setError(errData.detail || 'Falha ao logar com o Google.')
      }
    } catch (err) {
      console.error('Erro no Google Login:', err)
      setError('Erro ao contactar o servidor para o Google Login.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail)
    }
  }, [initialEmail])

  const handleRegister = async () => {
    if (!email || !password) {
      setError('Por favor, preencha email e senha.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // 1. Cria a conta na API (JSON)
      const registerRes = await fetch(`${config.apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!registerRes.ok) {
        const errData = await registerRes.json()
        throw new Error(errData.detail || 'Erro ao criar conta.')
      }

      // 2. Faz o Login Automático (URL Encoded)
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)

      const loginRes = await fetch(`${config.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      })

      if (loginRes.ok) {
        const data = await loginRes.json()
        localStorage.setItem('access_token', data.access_token)
        login(email)
        router.push('/app')
      } else {
        // Se falhar o login automático, atira para a tela de login
        router.push('/login')
      }

    } catch (err: any) {
      console.error('Erro de registo:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4">
        <div className="flex justify-center mb-2">
          <img src="/logobranco-semfundo.png" alt="ScreenAI" className="h-16 w-auto object-contain drop-shadow-md" />
        </div>
        
        <div className="text-center space-y-2 mb-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{t('register.title')}</h1>
          <p className="text-sm text-zinc-400 max-w-[280px] leading-relaxed mx-auto">
            {t('register.subtitle')}
          </p>
        </div>

        <Card className="w-full bg-zinc-950 border-zinc-900 rounded-2xl shadow-none">
          <CardContent className="pt-6 pb-4 space-y-4">
            
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <div className="w-full flex justify-center py-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError('O cadastro com Google falhou.')
                }}
                useOneTap={false}
                type="standard"
                theme="filled_black"
                shape="rectangular"
                size="large"
                width="344"
                logo_alignment="center"
                text="continue_with"
              />
            </div>

            <div className="relative pt-2 pb-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
                <span className="bg-zinc-950 px-3 text-zinc-500">ou cadastre-se com email</span>
              </div>
            </div>

            <div className="space-y-3">
              <Input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('login.email_placeholder')} 
                className="bg-zinc-900 border-zinc-800 h-11 rounded-lg text-zinc-300 placeholder:text-zinc-500 focus-visible:ring-zinc-700" 
              />
              <Input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('register.password_placeholder') || 'Sua senha'} 
                className="bg-zinc-900 border-zinc-800 h-11 rounded-lg text-zinc-300 placeholder:text-zinc-500 focus-visible:ring-zinc-700" 
              />
              <Button onClick={handleRegister} disabled={isLoading} className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-lg h-11 font-medium">
                {isLoading ? 'A criar conta...' : t('register.create_account')}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-6">
            <div className="text-sm text-zinc-400 text-center w-full">
              {t('register.has_account')} <Link href="/login" className="font-medium text-zinc-100 hover:underline">{t('register.login')}</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-zinc-950">A carregar...</div>}>
      <RegisterForm />
    </Suspense>
  )
}