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
import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

interface GoogleJwtPayload {
  email?: string
  picture?: string
  name?: string
  given_name?: string
  family_name?: string
}

export default function LoginPage() {
  const { t, language } = useI18n()
  const router = useRouter()
  const { login } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
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
        console.log('[LOGIN GOOGLE] Resposta da API:', data)
        console.log('[LOGIN GOOGLE] is_new_user:', data.is_new_user)
        localStorage.setItem('access_token', data.access_token)
        Cookies.set('access_token', data.access_token, { 
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        })
        
        let userEmail = ''
        try {
          const decoded = jwtDecode<GoogleJwtPayload>(credentialResponse.credential || '')
          userEmail = decoded.email || ''
          if (decoded.picture) {
            localStorage.setItem('user_picture', decoded.picture)
          }
          if (decoded.given_name) {
            localStorage.setItem('user_first_name', decoded.given_name)
          }
          if (decoded.family_name) {
            localStorage.setItem('user_last_name', decoded.family_name)
          }
          if (decoded.name && !decoded.given_name) {
            localStorage.setItem('user_first_name', decoded.name)
          }
        } catch (e) {
          console.error("Falha ao ler dados do token", e)
        }

        login(userEmail)
        console.log('[LOGIN GOOGLE] email:', userEmail)
        if (data.is_new_user) {
          console.log('[LOGIN GOOGLE] → Redirecionando para /onboarding')
          localStorage.setItem('is_new_user', 'true')
          window.location.href = '/onboarding'
        } else {
          console.log('[LOGIN GOOGLE] → Redirecionando para /app')
          window.location.href = '/app'
        }
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
        if (data.profile_picture_url) {
          const baseUrl = config.apiUrl.replace(/\/api$/, '')
          localStorage.setItem('user_picture', `${baseUrl}${data.profile_picture_url}`)
        }
        Cookies.set('access_token', data.access_token, { 
    expires: 7, // 7 dias (alinhar com o backend)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })
        
        login(email)
        console.log('[LOGIN] Resposta da API:', data)
        console.log('[LOGIN] is_new_user:', data.is_new_user)
        console.log('[LOGIN] full_name no token (se houver):', data)
        if (data.is_new_user) {
          console.log('[LOGIN] → Redirecionando para /onboarding')
          localStorage.setItem('is_new_user', 'true')
          router.push('/onboarding')
        } else {
          console.log('[LOGIN] → Redirecionando para /app')
          router.push('/app')
        }
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
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4 animate-enter-fade-zoom mt-16">
        <div className="flex justify-center mb-2">
          <img src="/logobranco-semfundo.png" alt="ScreenAI" className="h-14 w-auto object-contain drop-shadow-md" />
        </div>
        
        <div className="text-center space-y-2 mb-2">
          <h1 className="text-2xl font-semibold tracking-tight empty-chat-prompt">
            <span className="empty-chat-prompt__text">{t('login.title')}</span>
          </h1>
          <p className="text-sm text-zinc-400 max-w-[280px] leading-relaxed mx-auto">
            {t('login.subtitle')}
          </p>
        </div>

        <Card className="w-full bg-zinc-950 border-zinc-900 rounded-2xl shadow-none">
          <CardContent className="pt-6 pb-4 space-y-4">
            
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <div className="w-full flex justify-center py-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError('O login com Google falhou.')
                }}
                useOneTap={false}
                theme="filled_black"
                shape="pill"
                width="352"
                ux_mode="popup"
                text="continue_with"
              />
            </div>

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
