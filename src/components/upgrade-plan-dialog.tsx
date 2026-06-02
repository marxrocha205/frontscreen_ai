"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Zap, Lock } from 'lucide-react'

interface UpgradePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string | null
  title?: string
  ctaLabel?: string
}

export function UpgradePlanDialog({ open, onOpenChange, message, title, ctaLabel }: UpgradePlanDialogProps) {
  const router = useRouter()

  // Detecta se é um bloqueio de modelo (não de créditos) pela mensagem
  const isModelLock = message?.includes('disponível apenas nos planos')

  const handleUpgrade = () => {
    onOpenChange(false)
    router.push('/pricing')
  }

  // Função para remover emojis do texto de forma segura e elegante
  const stripEmojis = (str: string | null) => {
    if (!str) return ''
    return str
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/gu, '') // Remove emojis como círculos coloridos, animais, etc.
      .replace(/"\s+/g, '"') // Corrige espaço extra após aspas de abertura (ex: " Claude -> "Claude)
      .replace(/\s+"/g, '"') // Corrige espaço extra antes de aspas de fechamento
      .replace(/\s+/g, ' ') // Remove espaços extras duplos
      .trim()
  }

  const cleanMessage = stripEmojis(message)
  const cleanTitle = stripEmojis(title || (isModelLock ? 'Recurso Exclusivo' : 'Créditos Insuficientes'))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950/90 border border-zinc-800/80 text-zinc-100 p-8 rounded-3xl shadow-2xl backdrop-blur-xl focus:outline-none overflow-hidden">
        
        {/* Efeitos de brilho dinâmico em degradê ultra-sutil no fundo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full filter blur-3xl opacity-[0.10] pointer-events-none bg-indigo-500/30" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full filter blur-3xl opacity-[0.06] pointer-events-none bg-violet-500/20" />

        <DialogHeader className="flex flex-col items-center gap-4 mb-2 relative z-10">
          <div className="p-4 rounded-full flex items-center justify-center border transition-all duration-300 bg-gradient-to-tr from-indigo-600/20 to-violet-600/20 border-indigo-500/30 shadow-[0_0_24px_rgba(99,102,241,0.2)]">
            {isModelLock
              ? <Lock className="w-8 h-8 text-indigo-400 animate-pulse" />
              : <Zap className="w-8 h-8 text-indigo-400 animate-pulse" />
            }
          </div>
          
          <DialogTitle className="text-2xl font-bold tracking-tight text-center bg-gradient-to-b bg-clip-text text-transparent from-white via-zinc-100 to-indigo-200">
            {cleanTitle}
          </DialogTitle>
          
          <DialogDescription className="text-zinc-400 text-center text-sm sm:text-base leading-relaxed max-w-[320px] sm:max-w-none mt-2">
            {cleanMessage || "Você não possui créditos suficientes para realizar esta ação no momento."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6 relative z-10">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="flex-1 bg-zinc-900/50 border border-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-xl h-12 justify-center font-semibold transition-all duration-200"
          >
            Fechar
          </Button>
          <Button 
            onClick={handleUpgrade} 
            className="flex-1 rounded-xl h-12 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/20 border-none"
          >
            {ctaLabel || 'Fazer Upgrade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
