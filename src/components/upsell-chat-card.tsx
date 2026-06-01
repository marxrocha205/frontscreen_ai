"use client"

/**
 * UpsellChatCard
 *
 * Card de upsell contextual que aparece inline no chat, como se fosse
 * uma mensagem da própria IA. Exibe a oferta personalizada com base no
 * contexto da conversa e oferece dois CTAs: "Quero o Pro" e "Agora não".
 *
 * Design: visual de "bolha de assistente" com gradiente sutil e badge Pro.
 */

import { useRouter } from 'next/navigation'
import { Zap, X, ArrowRight, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface UpsellChatCardProps {
  /** Mensagem contextual gerada pelo backend (suporta Markdown) */
  message: string
  /** Créditos restantes para exibir no badge */
  remainingCredits?: number
  /** Threshold que disparou o upsell (2, 5 ou 8) */
  threshold?: number
  /** Callback ao clicar em "Agora não" */
  onDismiss: () => void
  /** Idioma da interface */
  language?: 'pt-BR' | 'en-US'
}

export function UpsellChatCard({
  message,
  remainingCredits,
  threshold,
  onDismiss,
  language = 'pt-BR',
}: UpsellChatCardProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    router.push('/pricing')
  }

  const isPtBR = language === 'pt-BR'

  // Urgência visual baseada no threshold
  const isUrgent = (remainingCredits ?? threshold ?? 99) <= 2
  const isWarning = !isUrgent && (remainingCredits ?? threshold ?? 99) <= 5

  return (
    <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Avatar da IA — ícone de Sparkles com gradiente Pro */}
      <div className="shrink-0 mr-3 mt-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center shadow-[0_0_16px_rgba(245,158,11,0.35)]">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
      </div>

      {/* Card principal */}
      <div className="relative max-w-[85%] flex flex-col gap-3">

        {/* Badge de urgência */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
            isUrgent
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : isWarning
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              isUrgent ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 'bg-indigo-400'
            }`} />
            {isUrgent
              ? (isPtBR ? 'Créditos quase esgotados' : 'Credits almost gone')
              : isWarning
              ? (isPtBR ? 'Créditos acabando' : 'Credits running low')
              : (isPtBR ? 'Oferta especial' : 'Special offer')
            }
          </span>

          {remainingCredits !== undefined && (
            <span className="text-[11px] text-zinc-500 font-medium">
              {remainingCredits} {isPtBR ? 'restantes' : 'remaining'}
            </span>
          )}
        </div>

        {/* Corpo da mensagem com Markdown */}
        <div className={`rounded-2xl rounded-tl-sm px-5 py-4 border shadow-sm ${
          isUrgent
            ? 'bg-red-950/20 border-red-500/20'
            : isWarning
            ? 'bg-amber-950/20 border-amber-500/20'
            : 'bg-zinc-900/60 border-zinc-800/60'
        }`}>
          {/* Efeito de brilho sutil no fundo */}
          <div className={`absolute -top-8 -left-8 w-32 h-32 rounded-full filter blur-3xl opacity-[0.06] pointer-events-none ${
            isUrgent ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500'
          }`} />

          <div className="text-[14px] text-zinc-300 leading-relaxed prose prose-invert prose-sm max-w-none relative z-10">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0 text-zinc-300">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-zinc-100">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-zinc-400">{children}</em>
                ),
              }}
            >
              {message}
            </ReactMarkdown>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* CTA Principal — Upgrade */}
          <button
            onClick={handleUpgrade}
            className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[13px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
              isUrgent
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-red-500/25 hover:from-red-400 hover:to-orange-400'
                : isWarning
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-amber-500/25 hover:from-amber-400 hover:to-yellow-400'
                : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white shadow-indigo-500/25 hover:from-indigo-400 hover:to-violet-500'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isPtBR ? 'Quero o Plano Pro' : 'Get Pro Plan'}
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* CTA Secundário — Dispensar */}
          <button
            onClick={onDismiss}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[12px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-all duration-200 border border-transparent hover:border-zinc-700/50"
          >
            <X className="w-3 h-3" />
            {isPtBR ? 'Agora não' : 'Not now'}
          </button>
        </div>
      </div>
    </div>
  )
}
