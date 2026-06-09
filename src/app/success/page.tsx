"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import { useI18n } from '@/context/i18n-context'
import { Language } from '@/locales'

type CheckoutPlan = {
  id: number
  name: string
  price: number
  credits: string
}

const getPlans = (language: Language): CheckoutPlan[] => {
  switch (language) {
    case 'pt-BR':
      return [
        { id: 2, name: 'Plano PRO Mensal', price: 97.90, credits: '1.000' },
        { id: 3, name: 'Plano PRO Anual', price: 797.90, credits: '12.000' },
      ]
    case 'es-ES':
      return [
        { id: 2, name: 'Plan PRO Mensual', price: 19.90, credits: '1.000' },
        { id: 3, name: 'Plan PRO Anual', price: 149.90, credits: '12.000' },
      ]
    case 'en-US':
    default:
      return [
        { id: 2, name: 'PRO Monthly Plan', price: 19.90, credits: '1,000' },
        { id: 3, name: 'PRO Annual Plan', price: 149.90, credits: '12,000' },
      ]
  }
}

type CurrencyCode = 'BRL' | 'EUR' | 'USD'

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  BRL: 'R$',
  EUR: '€',
  USD: '$',
}

const copyData = {
  'pt-BR': {
    title: 'Pagamento Aprovado!',
    subtitle: 'Sua assinatura foi processada com sucesso e sua conta já está ativada.',
    plan: 'Plano Adquirido',
    price: 'Valor Pago',
    credits: 'Créditos Recebidos',
    button: 'Começar a usar a IA',
  },
  'en-US': {
    title: 'Payment Approved!',
    subtitle: 'Your subscription has been processed successfully and your account is active.',
    plan: 'Acquired Plan',
    price: 'Amount Paid',
    credits: 'Credits Received',
    button: 'Start using AI',
  },
  'es-ES': {
    title: '¡Pago Aprobado!',
    subtitle: 'Tu suscripción ha sido procesada con éxito y tu cuenta ya está activa.',
    plan: 'Plan Adquirido',
    price: 'Monto Pagado',
    credits: 'Créditos Recibidos',
    button: 'Empezar a usar IA',
  },
}

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useI18n()
  
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const plans = getPlans(language)
  const copy = copyData[language]
  
  const planId = searchParams.get('plan')
  const selectedPlan = plans.find(p => p.id === Number(planId)) || plans[0]
  
  const currency: CurrencyCode = language === 'pt-BR' ? 'BRL' : (language === 'es-ES' ? 'EUR' : 'USD')
  const symbol = CURRENCY_SYMBOLS[currency]

  if (!mounted) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white font-sans p-6">
      <div className="max-w-md w-full bg-[#111] border border-neutral-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 animate-[pulse_2s_ease-in-out_infinite]">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-3">{copy.title}</h1>
          <p className="text-neutral-400 mb-8">{copy.subtitle}</p>
          
          <div className="w-full bg-black/50 border border-neutral-800 rounded-2xl p-6 mb-8 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <span className="text-neutral-400 text-sm">{copy.plan}</span>
              <span className="font-semibold">{selectedPlan.name}</span>
            </div>
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <span className="text-neutral-400 text-sm">{copy.price}</span>
              <span className="font-semibold">{symbol} {selectedPlan.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 text-sm">{copy.credits}</span>
              <span className="font-semibold flex items-center gap-1.5 text-emerald-400">
                <Sparkles className="w-4 h-4" />
                {selectedPlan.credits}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => router.push('/app')}
            className="w-full h-14 bg-white text-black hover:bg-neutral-200 transition-colors rounded-xl font-bold flex items-center justify-center gap-2"
          >
            {copy.button} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  )
}
