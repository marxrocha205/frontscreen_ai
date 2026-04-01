"use client"

import { useI18n } from '@/context/i18n-context'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'
import Cookies from 'js-cookie'
import { config } from '@/lib/config'
import { useGoogleLogin } from '@react-oauth/google'

export default function LoginPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { login } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true)
      setError('')
      try {
        const res = await fetch(`${config.apiUrl}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResponse.access_token }),
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
    },
    onError: (error) => {
      console.error('Google Login Error:', error)
      setError('O login com Google falhou ou foi cancelado.')
    }
  })

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, preencha email e senha.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)

      const response = await fetch(`${config.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        // Guarda o token para o WebSocket usar depois
        localStorage.setItem('access_token', data.access_token)
        Cookies.set('access_token', data.access_token, { 
    expires: 7, // 7 dias (alinhar com o backend)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })
        
        login(email)
        window.location.href = '/app'
      } else {
        const errData = await response.json()
        setError(errData.detail || 'Email ou senha incorretos.')
      }
    } catch (err) {
      console.error('Erro de rede:', err)
      setError('Erro ao contactar o servidor.')
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{t('login.title')}</h1>
          <p className="text-sm text-zinc-400 max-w-[280px] leading-relaxed mx-auto">
            {t('login.subtitle')}
          </p>
        </div>

        <Card className="w-full bg-zinc-950 border-zinc-900 rounded-2xl shadow-none">
          <CardContent className="pt-6 pb-4 space-y-4">
            
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <Button onClick={() => loginWithGoogle()} disabled={isGoogleLoading} variant="outline" className="w-full bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-lg h-11 font-medium flex items-center justify-center gap-2 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {isGoogleLoading ? 'Conectando...' : 'Continuar com o Google'}
            </Button>

            <div className="relative pt-2 pb-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
                <span className="bg-zinc-950 px-3 text-zinc-500">ou continue com email</span>
              </div>
            </div>

            <div className="space-y-3 mt-4">
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
                placeholder="Sua senha secreta" 
                className="bg-zinc-900 border-zinc-800 h-11 rounded-lg text-zinc-300 placeholder:text-zinc-500 focus-visible:ring-zinc-700" 
              />
              <Button onClick={handleLogin} disabled={isLoading} className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-lg h-11 font-medium">
                {isLoading ? 'Conectando...' : t('login.continue')}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-6">
            <div className="text-sm text-zinc-400 text-center w-full">
              {t('login.no_account')} <Link href="/register" className="font-medium text-zinc-100 hover:underline">{t('login.signup')}</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}