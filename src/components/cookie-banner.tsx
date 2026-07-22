"use client"

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Cookies from 'js-cookie'
import { useI18n } from '@/context/i18n-context'

const COOKIE_CONSENT_KEY = 'screenai_cookie_consent'

type ConsentValue = 'accepted' | 'rejected'

export function CookieBanner() {
  const { t } = useI18n()
  const [isVisible, setIsVisible] = useState(false)
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const consent = Cookies.get(COOKIE_CONSENT_KEY) as ConsentValue | undefined
    setPortalRoot(document.body)

    if (!consent) {
      const raf = window.requestAnimationFrame(() => setIsVisible(true))
      return () => window.cancelAnimationFrame(raf)
    }
  }, [])

  const handleConsent = (value: ConsentValue) => {
    Cookies.set(COOKIE_CONSENT_KEY, value, { expires: 180, sameSite: 'Lax' })
    setIsVisible(false)
  }

  if (!isVisible || !portalRoot) return null

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[2147483647] p-3 pointer-events-none sm:p-4 md:p-6">
      <div className="pointer-events-auto mx-auto w-full max-w-5xl rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-white">{t('cookie.title')}</h2>
            <p className="max-w-3xl text-sm leading-6 text-zinc-300">
              {t('cookie.description')}
            </p>
            <Link href="/privacy" className="inline-flex text-sm font-medium text-indigo-400 hover:text-indigo-300">
              {t('cookie.privacy_link')}
            </Link>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-700 bg-transparent px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800"
              onPointerDown={(event) => {
                event.stopPropagation()
                handleConsent('rejected')
              }}
              onClick={() => handleConsent('rejected')}
            >
              {t('cookie.reject')}
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
              onPointerDown={(event) => {
                event.stopPropagation()
                handleConsent('accepted')
              }}
              onClick={() => handleConsent('accepted')}
            >
              {t('cookie.accept')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    portalRoot
  )
}
