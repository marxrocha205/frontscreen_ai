"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'

interface UpgradePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string | null
}

export function UpgradePlanDialog({ open, onOpenChange, message }: UpgradePlanDialogProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    onOpenChange(false)
    router.push('/pricing')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1f1f1f] border-zinc-800 text-zinc-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="flex flex-col items-center gap-4 mb-2">
          <div className="bg-yellow-500/10 p-3 rounded-full">
            <Zap className="w-8 h-8 text-yellow-500" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight text-center">
            Créditos Insuficientes
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-center text-base leading-relaxed">
            {message || "Você não possui créditos suficientes para realizar esta ação no momento."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="flex-1 bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-800 rounded-xl h-12"
          >
            Fechar
          </Button>
          <Button 
            onClick={handleUpgrade} 
            className="flex-1 bg-yellow-500 text-black hover:bg-yellow-400 rounded-xl h-12 font-bold shadow-lg shadow-yellow-500/20"
          >
            Fazer Upgrade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
