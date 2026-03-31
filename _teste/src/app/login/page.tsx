"use client"

import { useI18n } from '@/context/i18n-context'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MonitorPlay } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'

export default function LoginPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')

  const handleLogin = () => {
    login(email || 'user@example.com')
    router.push('/app')
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800">
          <MonitorPlay className="h-6 w-6 text-zinc-400" />
        </div>
        
        <div className="text-center space-y-2 mb-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{t('login.title')}</h1>
          <p className="text-sm text-zinc-400 max-w-[280px] leading-relaxed mx-auto">
            {t('login.subtitle')}
          </p>
        </div>

        <Card className="w-full bg-zinc-950 border-zinc-900 rounded-2xl shadow-none">
          <CardContent className="pt-6 pb-4 space-y-4">
            <Button onClick={handleLogin} variant="outline" className="w-full bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg h-11 flex items-center justify-center gap-2">
              <span className="text-lg font-medium">G</span> {t('login.google')}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-950 px-2 text-zinc-500">{t('login.or')}</span>
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
              <Button onClick={handleLogin} className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-lg h-11 font-medium">
                {t('login.continue')}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-6">
            <div className="text-sm text-zinc-400 text-center w-full">
              {t('login.no_account')} <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }} className="font-medium text-zinc-100 hover:underline">{t('login.signup')}</a>
            </div>
            
            <div className="w-full border-t border-zinc-800/60 pt-4 flex justify-center">
               <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  {t('login.admin_access')}
               </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
