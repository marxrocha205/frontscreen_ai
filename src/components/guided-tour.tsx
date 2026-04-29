"use client"

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft, Zap, Sparkles, MessageSquare, MonitorUp, PictureInPicture2, Mic, AudioLines, Volume2, Settings as SettingsIcon } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useChatStore } from '@/hooks/use-chat-store'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface TourStep {
  id: string
  title: string
  content: string
  targetId?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao ScreenAI!',
    content: 'Temos o prazer de ter você aqui. Vamos fazer um tour rápido para você dominar todas as funções da nossa inteligência artificial.',
    position: 'center'
  },
  {
    id: 'auto-model',
    title: 'Modo Automático',
    content: 'Com o botão "Auto" ativo, nós escolhemos automaticamente a melhor inteligência artificial para responder cada uma de suas perguntas!',
    targetId: 'tour-auto',
    position: 'bottom'
  },
  {
    id: 'model-selector',
    title: 'Troca de IA',
    content: 'Aqui você pode escolher qual modelo de inteligência artificial deseja utilizar. Cada um tem suas especialidades!',
    targetId: 'tour-model-selector',
    position: 'bottom'
  },
  {
    id: 'credits',
    title: 'Seus Créditos',
    content: 'Acompanhe seu saldo de créditos aqui. Eles são consumidos conforme você utiliza as funções avançadas da IA.',
    targetId: 'tour-credits',
    position: 'bottom'
  },
  {
    id: 'sidebar-main',
    title: 'Conversas e Busca',
    content: 'Inicie novas conversas ou encontre chats antigos rapidamente nesta seção.',
    targetId: 'tour-new-chat',
    position: 'right'
  },
  {
    id: 'screen-share',
    title: 'Compartilhamento de Tela',
    content: 'Esta é a nossa função principal! Clique aqui para permitir que a IA "enxergue" sua tela e ajude você em tempo real.',
    targetId: 'tour-screen-share',
    position: 'right'
  },
  {
    id: 'pip-chat',
    title: 'Destacar Chat (PiP)',
    content: 'Clique aqui para destacar o chat em uma janela flutuante. Isso permite que você continue conversando enquanto usa outros aplicativos.',
    targetId: 'tour-pip-chat',
    position: 'right'
  },
  {
    id: 'input-bar',
    title: 'Barra de Interação',
    content: 'Aqui é onde a mágica acontece. Você pode digitar comandos, enviar arquivos ou capturar sua tela.',
    targetId: 'tour-input-bar',
    position: 'top'
  },
  {
    id: 'attachment-btn',
    title: 'Anexos e Tela',
    content: 'Use o botão de "+" para enviar arquivos para análise ou iniciar o compartilhamento de tela.',
    targetId: 'tour-attachment-btn',
    position: 'top'
  },
  {
    id: 'mic-btn',
    title: 'Falar com a IA',
    content: 'Clique no microfone para falar sua dúvida. A IA processará sua voz e responderá imediatamente.',
    targetId: 'tour-mic-btn',
    position: 'top'
  },
  {
    id: 'audio-toggle',
    title: 'Voz da IA',
    content: 'Habilite ou desabilite a voz da inteligência artificial aqui. Quando ativo, ela responderá você falando!',
    targetId: 'tour-audio-toggle',
    position: 'top'
  },
  {
    id: 'settings',
    title: 'Configurações',
    content: 'Ajuste preferências de idioma, tema e configurações de voz aqui para deixar o app do seu jeito.',
    targetId: 'tour-settings',
    position: 'right'
  }
]

export function GuidedTour() {
  const { isLoggedIn, user } = useAuth()
  const { isSidebarOpen, setIsSidebarOpen } = useChatStore()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [spotlightStyles, setSpotlightStyles] = useState<React.CSSProperties>({})
  const [cardStyles, setCardStyles] = useState<React.CSSProperties>({})

  useEffect(() => {
    // Só mostra o tutorial se estiver logado
    if (isLoggedIn && user?.email) {
      const tourKey = `screenai-tour-seen-${user.email}`
      const hasSeenTour = localStorage.getItem(tourKey)
      
      if (!hasSeenTour) {
        setIsOpen(true)
      }
    } else {
      // Se deslogar, garante que o tour fecha
      setIsOpen(false)
    }
  }, [isLoggedIn, user?.email])

  const updateSpotlight = useCallback(() => {
    if (!isOpen) return
    
    const step = TOUR_STEPS[currentStep]
    
    if (!step.targetId) {
      setSpotlightStyles({
        width: '0',
        height: '0',
        top: '50%',
        left: '50%',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)',
        opacity: 0,
        position: 'fixed'
      })
      setCardStyles({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '380px',
        position: 'fixed',
        zIndex: 10000
      })
      return
    }

    const element = document.getElementById(step.targetId)
    if (element) {
      const rect = element.getBoundingClientRect()
      const padding = 8
      
      const spotlightTop = rect.top - padding
      const spotlightLeft = rect.left - padding
      const spotlightWidth = rect.width + padding * 2
      const spotlightHeight = rect.height + padding * 2

      setSpotlightStyles({
        width: `${spotlightWidth}px`,
        height: `${spotlightHeight}px`,
        top: `${spotlightTop}px`,
        left: `${spotlightLeft}px`,
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)',
        borderRadius: '12px',
        opacity: 1,
        transition: 'all 0.4s ease-in-out',
        position: 'fixed',
        pointerEvents: 'auto'
      })
      
      // Calculate Card Position - Centered
      setCardStyles({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '380px',
        position: 'fixed',
        transition: 'all 0.4s ease-in-out',
        zIndex: 10000
      })
      
      // Scroll into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentStep, isOpen])

  // Handle sidebar auto open/close
  useEffect(() => {
    if (!isOpen) return
    
    const step = TOUR_STEPS[currentStep]
    const sidebarIds = ['tour-new-chat', 'tour-search-chat', 'tour-screen-share', 'tour-pip-chat', 'tour-settings']
    const isSidebarStep = step.targetId && sidebarIds.includes(step.targetId)
    
    if (isSidebarStep && !isSidebarOpen) {
      setIsSidebarOpen(true)
    } else if (!isSidebarStep && isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }, [currentStep, isOpen, isSidebarOpen, setIsSidebarOpen])

  // Recalculate spotlight when step changes OR sidebar opens/closes
  useEffect(() => {
    if (isOpen) {
      // We wait a bit to let sidebar animations finish before calculating
      const timer = setTimeout(updateSpotlight, 400)
      window.addEventListener('resize', updateSpotlight)
      window.addEventListener('scroll', updateSpotlight, true)
      
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', updateSpotlight)
        window.removeEventListener('scroll', updateSpotlight, true)
      }
    }
  }, [isOpen, updateSpotlight, isSidebarOpen])

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      completeTour()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const completeTour = () => {
    if (user?.email) {
      localStorage.setItem(`screenai-tour-seen-${user.email}`, 'true')
    }
    setIsSidebarOpen(false)
    setIsOpen(false)
  }

  const handleSkip = () => {
    setShowSkipConfirm(true)
  }

  if (!isOpen) return null

  const step = TOUR_STEPS[currentStep]

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto overflow-hidden">
      {/* Dimmed Background with Highlight */}
      <div 
        className={`transition-all duration-300 pointer-events-auto cursor-default ${showSkipConfirm ? 'opacity-20' : 'opacity-100'}`}
        style={spotlightStyles}
      />

      {/* Tour Content Card */}
      <div 
        className={`fixed pointer-events-auto w-[calc(100%-32px)] max-w-[320px] md:max-w-[380px] transition-all duration-300 ${
          showSkipConfirm ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
        }`}
        style={cardStyles}
      >
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                 Passo {currentStep + 1} de {TOUR_STEPS.length}
               </span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-2 leading-tight">
            {step.title}
          </h3>
          <p className="text-zinc-400 text-[14px] leading-relaxed mb-6">
            {step.content}
          </p>

          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={handleBack} 
              disabled={currentStep === 0}
              className="text-zinc-400 hover:text-white h-9 px-3 -ml-2 transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost"
                onClick={handleSkip}
                className="text-zinc-500 hover:text-zinc-300 h-9 px-3 transition-colors"
              >
                Pular
              </Button>
              <Button 
                onClick={handleNext}
                className="bg-white text-black hover:bg-zinc-200 font-bold h-9 px-5 rounded-full shadow-lg shadow-white/5 transition-all active:scale-95"
              >
                {currentStep === TOUR_STEPS.length - 1 ? 'Finalizar' : 'Próximo'}
                {currentStep !== TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </div>


      {/* Skip Confirmation Dialog */}
      <Dialog open={showSkipConfirm} onOpenChange={setShowSkipConfirm}>
        <DialogContent className="z-[10001] bg-zinc-950 border-zinc-800 text-zinc-100 rounded-2xl max-w-sm mx-4 pointer-events-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">Deseja pular o tutorial?</DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm leading-relaxed mt-2">
              Recomendamos fortemente que você siga o tutorial para aprender a utilizar todas as ferramentas e o poder total da nossa IA.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button 
              variant="ghost" 
              onClick={() => setShowSkipConfirm(false)}
              className="w-full sm:w-auto order-2 sm:order-1 text-zinc-400 hover:text-white"
            >
              Continuar Aprendendo
            </Button>
            <Button 
              onClick={completeTour}
              className="w-full sm:w-auto order-1 sm:order-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 font-bold"
            >
              Pular Tutorial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
