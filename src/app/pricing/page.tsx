"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/context/i18n-context'

type PricingPlan = {
  id: number
  name: string
  tagline: string
  price: string
  cta: string
  badge?: string
  features: string[]
}

const getPlans = (language: 'pt-BR' | 'en-US'): PricingPlan[] => language === 'pt-BR'
  ? [
      {
        id: 1,
        name: 'FREE',
        tagline: 'Experimente o poder da IA que enxerga sua tela.',
        price: 'R$0',
        cta: 'Começar Grátis',
        features: ['Créditos limitados diariamente', 'Acesso ao ScreenAI básico', 'Análise de tela em tempo real', 'Suporte via comunidade'],
      },
      {
        id: 2,
        name: 'PRO MENSAL',
        tagline: 'Sua rotina de trabalho nunca mais será a mesma.',
        price: 'R$97,90/mês',
        cta: 'Assinar PRO',
        badge: 'Mais Flexível',
        features: ['Tokens ilimitados: Trabalhe o dia todo sem interrupções.', 'Acesso Ilimitado a ScreenAI, Gemini e GPT-5.', 'Análise avançada de código, planilhas e design', 'Histórico completo entre sessões', 'Voz humanizada, diálogos fluidos', 'IA que destrava qualquer tarefa, da programação ao cotidiano'],
      },
      {
        id: 3,
        name: 'PRO ANUAL',
        tagline: 'Poder Absoluto com o melhor custo-benefício.',
        price: 'R$797,90/ano',
        cta: 'Assinar ANUAL',
        badge: 'Melhor Valor',
        features: ['Tudo do PRO Mensal e mais', 'Economia de R$376 por ano', 'Janela de Contexto Gigante: Analise documentos longos.', 'Multi-IA Simultânea: Claude, GPT-5 e Gemini Pro.', 'Suporte 24h prioritário via WhatsApp'],
      },
    ]
  : [
      {
        id: 1,
        name: 'FREE',
        tagline: 'Try the power of AI that can see your screen.',
        price: '$0',
        cta: 'Start Free',
        features: ['Limited daily credits', 'Access to basic ScreenAI', 'Real-time screen analysis', 'Community support'],
      },
      {
        id: 2,
        name: 'PRO MONTHLY',
        tagline: 'Your work routine will never feel the same.',
        price: 'R$97.90/month',
        cta: 'Subscribe to PRO',
        badge: 'Most Flexible',
        features: ['Unlimited tokens: work all day without interruptions.', 'Unlimited access to ScreenAI, Gemini, and GPT-5.', 'Advanced analysis for code, spreadsheets, and design', 'Full history across sessions', 'Human-like voice and fluid conversations', 'AI that unblocks any task, from coding to everyday work'],
      },
      {
        id: 3,
        name: 'PRO ANNUAL',
        tagline: 'Maximum power with the best value.',
        price: 'R$797.90/year',
        cta: 'Subscribe Annually',
        badge: 'Best Value',
        features: ['Everything in PRO Monthly, plus', 'Save R$376 per year', 'Giant context window: analyze long documents.', 'Simultaneous multi-AI: Claude, GPT-5, and Gemini Pro.', 'Priority 24/7 support via WhatsApp'],
      },
    ]

export default function PricingPage() {
  const router = useRouter()
  const { language } = useI18n()
  const { hasHydrated, isLoggedIn, syncFromStorage } = useAuth()
  const [isNavigating, setIsNavigating] = useState(false)
  const plans = getPlans(language)

  useEffect(() => {
    syncFromStorage()
  }, [syncFromStorage])

  const handlePlanClick = (plan: PricingPlan) => {
    if (!hasHydrated) {
      syncFromStorage()
    }

    if (!useAuth.getState().isLoggedIn) {
      router.push('/login')
      return
    }
    if (plan.id === 1) {
      router.push('/app')
    } else {
      setIsNavigating(true)
      setTimeout(() => {
        router.push(`/checkout?plan=${plan.id}`)
      }, 2000)
    }
  }

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
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800/50 sticky top-0 bg-black/80 backdrop-blur-md z-10">
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
      <div className="text-center pt-24 pb-12 px-4">
        <h1 className="text-4xl md:text-[42px] leading-[1.1] font-semibold mb-4 text-white">
          {language === 'pt-BR' ? <>A IA que enxerga sua tela,<br />no plano certo pra você</> : <>AI that sees your screen,<br />on the right plan for you</>}
        </h1>
        <p className="text-zinc-400 text-[15px] mt-6 tracking-wide">
          {language === 'pt-BR' ? 'Garantia de 14 dias ou seu dinheiro de volta.' : '14-day money-back guarantee.'}
        </p>
      </div>

      {/* Plans Grid */}
      <div className="px-4 sm:px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-[1px] flex flex-col max-w-[360px] mx-auto w-full ${
                plan.id === 3
                  ? 'border-zinc-700 bg-gradient-to-b from-white/[0.08] to-transparent'
                  : 'border-zinc-800 bg-zinc-900/40'
              }`}
            >
              <div className="h-full w-full bg-black rounded-[11px] flex flex-col items-start p-7 relative overflow-hidden">
                {plan.badge && (
                  <div className="absolute top-6 right-6 z-10">
                    <span className="bg-[#1e1e1e] border border-[#333] text-zinc-300 text-[10px] px-2 py-1 rounded">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="flex flex-col gap-3 relative z-10 w-full mb-6">
                  <span className="text-[17px] text-zinc-300">{plan.name}</span>
                  <span className="text-[36px] font-medium tracking-tight text-white">{plan.price}</span>
                  <p className="text-[13px] text-zinc-400 leading-relaxed min-h-[40px] mt-1 pr-4">{plan.tagline}</p>
                </div>

                {/* CTA BUTTON */}
                <button
                  onClick={() => handlePlanClick(plan)}
                  className={`w-full mb-8 h-10 rounded-[6px] font-medium text-[13px] flex items-center justify-center transition-all relative z-10 ${
                    plan.id === 3 
                      ? 'bg-white text-zinc-900 hover:bg-zinc-200' 
                      : 'bg-[#4b4b4b] hover:bg-[#5b5b5b] text-zinc-200'
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Feature List */}
                <div className="w-full relative z-10 flex-1">
                  <p className="text-[13px] text-white mb-4">{language === 'pt-BR' ? 'O que está incluído:' : 'What is included:'}</p>
                  <ul className="space-y-4">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-[18px] h-[18px] shrink-0 text-white mt-0.5" />
                        <span className="text-[13px] leading-[1.4] text-zinc-300">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.id === 3 && (
                  <div className="absolute -top-[150px] -left-[150px] w-[300px] h-[300px] bg-white/[0.08] rounded-full blur-[80px] pointer-events-none z-0" />
                )}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t pointer-events-none z-0 ${
                    plan.id === 3 ? 'from-white/[0.05] to-transparent' : 'from-white/[0.015] to-transparent'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
