"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Zap, Lock } from 'lucide-react'
import { useI18n } from '@/context/i18n-context'

interface UpgradePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string | null
  title?: string
  ctaLabel?: string
}

export function UpgradePlanDialog({ open, onOpenChange, message, title, ctaLabel }: UpgradePlanDialogProps) {
  const router = useRouter()
  const { t } = useI18n()

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
  const cleanTitle = stripEmojis(title || (isModelLock ? t('upgrade.title_model_lock') : t('upgrade.title_credits')))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border border-zinc-800/80 text-zinc-100 p-8 rounded-[24px] shadow-2xl focus:outline-none overflow-hidden">
        
        <DialogHeader className="flex flex-col items-center gap-4 mb-2 relative z-10">
          <div className="p-4 rounded-full flex items-center justify-center bg-zinc-900/50 border border-zinc-800/50">
            {isModelLock
              ? <Lock className="w-7 h-7 text-zinc-300" strokeWidth={2} />
              : <Zap className="w-7 h-7 text-zinc-300" strokeWidth={2} />
            }
          </div>
          
          <DialogTitle className="text-[22px] font-semibold tracking-tight text-center text-white">
            {cleanTitle}
          </DialogTitle>
          
          <DialogDescription className="text-zinc-400 text-center text-sm leading-relaxed max-w-[320px] sm:max-w-none mt-1">
            {cleanMessage || t('upgrade.default_message')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-8 relative z-10 w-full bg-transparent border-none m-0 p-0">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            className="flex-1 bg-transparent hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl h-11 justify-center font-medium transition-colors"
          >
            {t('upgrade.close')}
          </Button>
          <Button 
            onClick={handleUpgrade} 
            className="flex-1 rounded-xl h-11 font-medium transition-colors bg-white text-zinc-900 hover:bg-zinc-200 border-none shadow-sm"
          >
            {ctaLabel || t('upgrade.cta')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
