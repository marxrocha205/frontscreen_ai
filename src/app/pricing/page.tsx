"use client"

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Check, Zap, Star, Crown, MonitorPlay, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    tagline: 'Para experimentar e começar',
    price: 'R$0',
    period: '/mês',
    cta: 'Começar grátis',
    icon: MonitorPlay,
    iconColor: 'text-zinc-400',
    highlight: false,
    features: [
      { text: 'Modelo Gemini 2.5 Flash-Lite', included: true },
      { text: 'Apenas análise via texto (sem voz)', included: true },
      { text: '50 interações por mês', included: true },
      { text: '3 mensagens por minuto', included: true },
      { text: 'Captura de tela básica', included: true },
      { text: 'OpenAI Whisper (STT)', included: false },
      { text: 'Voz realista (OpenAI TTS)', included: false },
      { text: 'Modelos de raciocínio avançado', included: false },
    ],
  },
  {
    name: 'Pro',
    tagline: 'Para uso profissional diário',
    price: 'R$49',
    period: '/mês',
    cta: 'Assinar Pro',
    icon: Zap,
    iconColor: 'text-indigo-400',
    highlight: true,
    badge: 'Mais popular',
    features: [
      { text: 'Tudo do plano Free e mais:', included: true, isSeparator: true },
      { text: 'Modelo Gemini 2.5 Flash', included: true },
      { text: 'OpenAI Whisper (STT)', included: true },
      { text: 'Voz natural (OpenAI TTS padrão)', included: true },
      { text: '1.000 interações por mês', included: true },
      { text: '15 mensagens por minuto', included: true },
      { text: 'Captura de tela contínua', included: true },
      { text: 'Modelos Gemini 2.5 Pro', included: false },
      { text: 'Voz ultra-realista (TTS HD)', included: false },
    ],
  },
  {
    name: 'Premium',
    tagline: 'Para usuários intensivos',
    price: 'R$129',
    period: '/mês',
    cta: 'Assinar Premium',
    icon: Crown,
    iconColor: 'text-amber-400',
    highlight: false,
    features: [
      { text: 'Tudo do plano Pro e mais:', included: true, isSeparator: true },
      { text: 'Modelo Gemini 2.5 Pro (raciocínio)', included: true },
      { text: 'Voz ultra-realista (OpenAI TTS HD)', included: true },
      { text: '10.000 créditos/mês (uso ilimitado)', included: true },
      { text: '60 mensagens por minuto', included: true },
      { text: 'Acesso antecipado a novos modelos', included: true },
      { text: 'Suporte prioritário', included: true },
      { text: 'Histórico de sessões ilimitado', included: true },
    ],
  },
]

export default function PricingPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()

  return (
    <div className="min-h-screen bg-[#111] text-zinc-100 flex flex-col">
      {/* Header */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800/50">
        <Link href="/app" className="flex items-center gap-2.5 text-zinc-100 hover:text-white transition-colors">
          <MonitorPlay className="w-5 h-5 text-zinc-400" />
          <span className="font-semibold text-base">ScreenAI</span>
        </Link>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link href="/app" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Voltar ao App
            </Link>
          ) : (
            <>
              <button onClick={() => router.push('/login')} className="text-sm text-zinc-400 hover:text-white transition-colors">
                Entrar
              </button>
              <button onClick={() => router.push('/login')} className="text-sm bg-white text-zinc-900 hover:bg-zinc-200 px-4 py-1.5 rounded-lg font-medium transition-colors">
                Cadastrar
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center pt-20 pb-16 px-4">
        <h1 className="text-5xl font-bold tracking-tight mb-4">Preços</h1>
        <p className="text-zinc-400 text-lg max-w-md mx-auto leading-relaxed">
          Veja os planos disponíveis para uso individual e profissional.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="flex-1 px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-7 flex flex-col gap-6 border transition-all ${plan.highlight
                ? 'bg-[#1a1a2e] border-indigo-500/40 shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]'
                : 'bg-[#1a1a1a] border-zinc-800/60'
                }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <plan.icon className={`w-4 h-4 ${plan.iconColor}`} />
                  <span className="font-semibold text-zinc-100">{plan.name}</span>
                </div>
                <p className="text-sm text-zinc-400 leading-snug">{plan.tagline}</p>
              </div>

              {/* Price */}
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight text-zinc-100">{plan.price}</span>
                <span className="text-zinc-500 text-sm mb-1">{plan.period}</span>
              </div>

              {/* CTA */}
              <button
                onClick={() => router.push(isLoggedIn ? '/app' : '/login')}
                className={`w-full h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 transition-all ${plan.highlight
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                  }`}
              >
                {plan.cta}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              {/* Feature List */}
              <ul className="space-y-3 pt-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {f.isSeparator ? (
                      <Star className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${plan.highlight ? 'text-indigo-400' : 'text-amber-400'}`} />
                    ) : f.included ? (
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-zinc-400" />
                    ) : (
                      <span className="w-3.5 h-3.5 mt-0.5 shrink-0 flex items-center justify-center">
                        <span className="block w-2.5 h-px bg-zinc-700 rounded" />
                      </span>
                    )}
                    <span className={`text-sm leading-snug ${f.isSeparator
                      ? 'text-zinc-300 font-medium'
                      : f.included
                        ? 'text-zinc-300'
                        : 'text-zinc-600'
                      }`}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ/Footer note */}
      <div className="text-center pb-16 px-4">
        <p className="text-xs text-zinc-600">
          Os preços são exibidos em Reais (BRL). Você pode cancelar a qualquer momento.{' '}
          <Link href="/app" className="text-zinc-500 hover:text-zinc-400 underline underline-offset-2 transition-colors">
            Voltar ao App
          </Link>
        </p>
      </div>
    </div>
  )
}
