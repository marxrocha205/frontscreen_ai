"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Cookies from 'js-cookie'
import { Button } from '@/components/ui/button'

const COOKIE_CONSENT_KEY = 'screenai_cookie_consent'

type ConsentValue = 'accepted' | 'rejected'

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = Cookies.get(COOKIE_CONSENT_KEY) as ConsentValue | undefined
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const handleConsent = (value: ConsentValue) => {
    Cookies.set(COOKIE_CONSENT_KEY, value, { expires: 180, sameSite: 'Lax' })
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] p-3 sm:p-4 md:p-6">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-white">Usamos cookies</h2>
            <p className="max-w-3xl text-sm leading-6 text-zinc-300">
              Utilizamos cookies essenciais para o funcionamento da plataforma e, com sua permissão, cookies de análise para melhorar a experiência.
              Você pode aceitar ou recusar o uso não essencial.
            </p>
            <Link href="/privacy" className="inline-flex text-sm font-medium text-indigo-400 hover:text-indigo-300">
              Ver política de privacidade
            </Link>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-zinc-700 bg-transparent px-4 text-zinc-100 hover:bg-zinc-800"
              onClick={() => handleConsent('rejected')}
            >
              Recusar
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-white px-4 text-zinc-950 hover:bg-zinc-200"
              onClick={() => handleConsent('accepted')}
            >
              Aceitar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
