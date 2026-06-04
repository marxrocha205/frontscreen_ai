"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/context/i18n-context'

import { Language } from '@/locales'

type ProPlanDetails = {
  monthly: {
    id: number
    name: string
    price: string
    cta: string
    tagline: string
  }
  annual: {
    id: number
    name: string
    price: string
    cta: string
    tagline: string
    badge?: string
  }
  features: string[]
}

const getProPlan = (language: Language): ProPlanDetails => {
  switch (language) {
    case 'pt-BR':
      return {
        monthly: {
          id: 2,
          name: 'PRO MENSAL',
          price: 'R$97,90/mês',
          cta: 'Assinar PRO',
          tagline: 'Sua rotina de trabalho nunca mais será a mesma.',
        },
        annual: {
          id: 3,
          name: 'PRO ANUAL',
          price: 'R$797,90/ano',
          cta: 'Assinar ANUAL',
          tagline: 'Poder Absoluto com o melhor custo-benefício.',
          badge: 'Economia de R$376/ano'
        },
        features: [
          'As IA mais avançadas do mercado, agora dentro da sua tela',
          'Multi-IA Simultânea a combinação dos melhores modelos do mundo Claude, GPT-5, Gemini Pro, Nano Banana, Veo 3.1 +30 modelos',
          'Janela de Contexto Gigante: Analise documentos e telas extremamente longas sem perder detalhes.',
          '1.000 créditos (Ideal para uso profissional).',
          'Suporte 24h com canal direto com nosso time técnico'
        ]
      }
    case 'es-ES':
      return {
        monthly: {
          id: 2,
          name: 'PRO MENSUAL',
          price: '€19,90/mes',
          cta: 'Suscribirse a PRO',
          tagline: 'Tu rutina de trabajo nunca será la misma.',
        },
        annual: {
          id: 3,
          name: 'PRO ANUAL',
          price: '€149,90/año',
          cta: 'Suscripción Anual',
          tagline: 'Poder absoluto con el mejor valor.',
          badge: 'Ahorra €88/año'
        },
        features: [
          'Las IA más avanzadas del mercado, ahora dentro de tu pantalla',
          'Multi-IA Simultánea la combinación de los mejores modelos del mundo Claude, GPT-5, Gemini Pro, Nano Banana, Veo 3.1 +30 modelos',
          'Ventana de Contexto Gigante: Analiza documentos y pantallas extremadamente largas sin perder detalles.',
          '1.000 créditos diarios (Ideal para uso profesional).',
          'Soporte 24h con canal directo con nuestro equipo técnico'
        ]
      }
    case 'en-US':
    default:
      return {
        monthly: {
          id: 2,
          name: 'PRO MONTHLY',
          price: '$19.90/month',
          cta: 'Subscribe to PRO',
          tagline: 'Your work routine will never feel the same.',
        },
        annual: {
          id: 3,
          name: 'PRO ANNUAL',
          price: '$149.90/year',
          cta: 'Subscribe Annually',
          tagline: 'Maximum power with the best value.',
          badge: 'Save $88/year'
        },
        features: [
          'The most advanced AIs on the market, now inside your screen',
          'Simultaneous Multi-AI the combination of the world\'s best models Claude, GPT-5, Gemini Pro, Nano Banana, Veo 3.1 +30 models',
          'Giant Context Window: Analyze extremely long documents and screens without losing details.',
          '1,000 daily credits (Ideal for professional use).',
          '24/7 support with a direct channel to our technical team'
        ]
      }
  }
}

export default function PricingPage() {
  const router = useRouter()
  const { language } = useI18n()
  const { hasHydrated, isLoggedIn, syncFromStorage } = useAuth()
  const [isNavigating, setIsNavigating] = useState(false)
  const [isAnnual, setIsAnnual] = useState(true)
  const planDetails = getProPlan(language)

  useEffect(() => {
    syncFromStorage()
  }, [syncFromStorage])

  const handlePlanClick = (planId: number) => {
    if (!hasHydrated) {
      syncFromStorage()
    }

    if (!useAuth.getState().isLoggedIn) {
      router.push('/login')
      return
    }

    setIsNavigating(true)
    setTimeout(() => {
      router.push(`/checkout?plan=${planId}`)
    }, 2000)
  }

  const activePlan = isAnnual ? planDetails.annual : planDetails.monthly

  return (
    <div className="min-h-screen bg-black text-zinc-100 overflow-y-auto">
      {/* Tela de Carregamento Full-page */}
      {isNavigating && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-white opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-medium text-white">{language === 'pt-BR' ? 'Preparando seu checkout...' : 'Preparing your checkout...'}</h2>
            <p className="text-sm text-zinc-500">{language === 'pt-BR' ? 'Estamos conectando você ao portal de pagamento seguro.' : 'We are connecting you to the secure payment portal.'}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800/50 sticky top-0 bg-black/80 backdrop-blur-xl z-50">
        <Link href="/app" className="block hover:opacity-80 transition-opacity">
          <Image
            src="/logobranco-semfundo.png"
            alt="ScreenAI Logo"
            width={70}
            height={32}
            style={{ height: 'auto' }}
            className="object-contain"
          />
        </Link>
        <div className="flex items-center gap-3">
          {hasHydrated && isLoggedIn ? (
            <Link href="/app" className="text-sm text-zinc-400 hover:text-white transition-colors">
              {language === 'pt-BR' ? 'Voltar ao App' : 'Back to App'}
            </Link>
          ) : (
            <>
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {language === 'pt-BR' ? 'Entrar' : 'Log in'}
              </button>
              <button
                onClick={() => router.push('/login')}
                className="text-sm bg-white text-zinc-900 hover:bg-zinc-200 px-4 py-1.5 rounded-lg font-medium transition-colors"
              >
                {language === 'pt-BR' ? 'Cadastrar' : 'Sign up'}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center pt-24 pb-10 px-4">
        <h1 className="text-4xl md:text-[42px] leading-[1.1] font-semibold mb-4 text-white">
          {language === 'pt-BR' ? <>A IA que enxerga sua tela,<br />no plano certo pra você</> : <>AI that sees your screen,<br />on the right plan for you</>}
        </h1>
        <p className="text-zinc-400 text-[15px] mt-6 tracking-wide">
          {language === 'pt-BR' ? 'Garantia de 14 dias ou seu dinheiro de volta.' : '14-day money-back guarantee.'}
        </p>
      </div>

      {/* Toggle Buttons */}
      <div className="flex justify-center mb-10 relative z-10">
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-full relative">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-zinc-700 rounded-full transition-transform duration-300 ease-in-out ${isAnnual ? 'translate-x-[calc(100%+4px)]' : 'translate-x-1'}`}
            style={{ left: 0 }}
          />
          <button
            onClick={() => setIsAnnual(false)}
            className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-medium transition-colors w-32 ${!isAnnual ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            {language === 'pt-BR' ? 'Mensal' : language === 'es-ES' ? 'Mensual' : 'Monthly'}
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-medium transition-colors w-32 ${isAnnual ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            {language === 'pt-BR' ? 'Anual' : 'Annual'}
            <span className="absolute -top-2 -right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg transform rotate-6 border border-emerald-400/50">
              -32%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="px-4 sm:px-6 pb-24">
        <div className="max-w-md mx-auto">
          <div className="relative rounded-2xl border border-zinc-700 bg-gradient-to-b from-white/[0.08] to-transparent p-[1px] flex flex-col w-full shadow-2xl">
            <div className="h-full w-full bg-black rounded-[15px] flex flex-col items-start p-8 relative overflow-hidden">

              <div className={`absolute top-6 right-6 z-10 transition-all duration-500 ${isAnnual && activePlan.badge ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-medium">
                  {planDetails.annual.badge}
                </span>
              </div>

              {/* Plan Header */}
              <div className="flex flex-col gap-3 relative z-10 w-full mb-8 min-h-[130px]">
                <div className="relative h-7">
                  <div className={`absolute inset-0 transition-all duration-500 ${isAnnual ? 'opacity-0 translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                    <span className="text-[17px] text-zinc-300">{planDetails.monthly.name}</span>
                  </div>
                  <div className={`absolute inset-0 transition-all duration-500 ${isAnnual ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                    <span className="text-[17px] text-zinc-300">{planDetails.annual.name}</span>
                  </div>
                </div>

                <div className="relative h-11">
                  <div className={`absolute inset-0 transition-all duration-500 ${isAnnual ? 'opacity-0 translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                    <span className="text-[40px] font-semibold tracking-tight text-white">{planDetails.monthly.price}</span>
                  </div>
                  <div className={`absolute inset-0 transition-all duration-500 ${isAnnual ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                    <span className="text-[40px] font-semibold tracking-tight text-white">{planDetails.annual.price}</span>
                  </div>
                </div>

                <div className="relative h-12 mt-2">
                  <div className={`absolute inset-0 transition-all duration-500 ${isAnnual ? 'opacity-0 translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                    <p className="text-[14px] text-zinc-400 leading-relaxed pr-8">{planDetails.monthly.tagline}</p>
                  </div>
                  <div className={`absolute inset-0 transition-all duration-500 ${isAnnual ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                    <p className="text-[14px] text-zinc-400 leading-relaxed pr-8">{planDetails.annual.tagline}</p>
                  </div>
                </div>
              </div>

              {/* CTA BUTTON */}
              <div className="w-full mb-8 relative h-[46px] z-10">
                <button
                  onClick={() => handlePlanClick(planDetails.monthly.id)}
                  className={`absolute inset-0 w-full h-full rounded-[8px] font-medium text-[14px] flex items-center justify-center transition-all duration-500 bg-[#4b4b4b] hover:bg-[#5b5b5b] text-zinc-200 animate-slow-scale-pulse ${isAnnual ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                  {planDetails.monthly.cta}
                </button>
                <button
                  onClick={() => handlePlanClick(planDetails.annual.id)}
                  className={`absolute inset-0 w-full h-full rounded-[8px] font-medium text-[14px] flex items-center justify-center transition-all duration-500 bg-white text-zinc-900 hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] animate-slow-scale-pulse ${isAnnual ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                  {planDetails.annual.cta}
                </button>
              </div>

              {/* Feature List */}
              <div className="w-full relative z-10 flex-1 border-t border-zinc-800/50 pt-6">
                <p className="text-[14px] text-white font-medium mb-5">
                  {language === 'pt-BR' ? 'Tudo incluído no plano PRO:' : language === 'es-ES' ? 'Todo incluido en el plan PRO:' : 'Everything included in the PRO plan:'}
                </p>
                <ul className="space-y-4">
                  {planDetails.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full p-0.5 bg-zinc-800/80 border border-zinc-700">
                        <Check className="w-[14px] h-[14px] shrink-0 text-zinc-300" />
                      </div>
                      <span className="text-[14px] leading-[1.5] text-zinc-300">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Glow effects */}
              <div className="absolute -top-[150px] -left-[150px] w-[300px] h-[300px] bg-white/[0.08] rounded-full blur-[80px] pointer-events-none z-0" />
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white/[0.03] to-transparent pointer-events-none z-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
