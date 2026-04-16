"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useI18n } from '@/context/i18n-context'
import { useWebsocket, stopAllAudio } from '@/hooks/use-websocket'
import { useGeminiVoice } from '@/hooks/use-gemini-voice'
import { useScreenShare, captureScreenFrame } from '@/hooks/use-screen-share'
import { useAuth } from '@/hooks/use-auth'
import { useChatStore } from '@/hooks/use-chat-store'
import { useConversations } from '@/hooks/use-conversations'
import { config } from '@/lib/config'
import { LoginPromptDialog } from '@/components/login-prompt-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Mic, Navigation, MonitorUp, Zap, Plus, FileUp, X, AudioLines, Volume2, VolumeX, FileText, Code, Table, Languages } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useContinuousVoice } from '@/hooks/use-continuous-voice'
import { UpgradePlanDialog } from '@/components/upgrade-plan-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

/**
 * Componente de Interface de Chat.
 * Contém as mensagens, o campo de input, o botão de microfone e todos os controles do chat.
 * Pode ser renderizado na página principal ou "teletransportado" via createPortal
 * para uma janela PiP ou Popup flutuante.
 */
export function ChatInterface() {
  const { t } = useI18n()
  const [inputValue, setInputValue] = useState('')
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showMobileWarning, setShowMobileWarning] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, isStreaming, sendCancel } = useWebsocket()
  const { credits, addMessage, setIsStreaming, setCredits, floatingState, pipWindow, isSoundEnabled, toggleSound, fetchCredits, isUpgradeDialogOpen, setIsUpgradeDialogOpen, upgradeDialogMessage, setUpgradeDialogMessage } = useChatStore()
  const { isLoggedIn } = useAuth()

  useEffect(() => {
    if (isLoggedIn) {
      fetchCredits()
    }
  }, [isLoggedIn])

  const { isRecording: isVoiceActive, startRecording, stopRecording } = useGeminiVoice(5, 1500)

  const handleSpeechStart = useCallback(() => {
    stopAllAudio()
    sendCancel()
  }, [sendCancel])

  const handleSpeechEnd = useCallback((audioBase64: string) => {
    const isCurrentlySharing = useScreenShare.getState().isSharing;
    const frame = isCurrentlySharing ? captureScreenFrame() : undefined;

    sendMessage({
      audio_base64: audioBase64,
      image_base64: frame
    })
  }, [sendMessage])

  const { isActive: isContinuousMicOn, isUserSpeaking, toggleContinuousMic } = useContinuousVoice(handleSpeechStart, handleSpeechEnd)

  const videoRef = useRef<HTMLVideoElement>(null)
  const { isSharing: isScreenShared, startSharing, stopSharing, stream } = useScreenShare()

  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768 || navigator.maxTouchPoints > 0
  }

  const handleStartSharing = () => {
    if (isMobileDevice()) {
      setShowMobileWarning(true)
      return
    }
    startSharing()
  }

  // Se o painel voltar ao normal ou o usuário acionar gravação manual, forçamos o VAD a desligar
  useEffect(() => {
    if (floatingState === 'none' && isContinuousMicOn) {
      toggleContinuousMic() // Desliga
    }
  }, [floatingState, isContinuousMicOn, toggleContinuousMic])

  useEffect(() => {
    if (isVoiceActive && isContinuousMicOn) {
      toggleContinuousMic() // Desliga o contínuo ao forçar manual
    }
  }, [isVoiceActive, isContinuousMicOn, toggleContinuousMic])

  useEffect(() => {
    if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(e => {
        if (e.name !== 'AbortError') console.error("Error playing video:", e)
      })
    }
  }, [stream])

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      const container = scrollRef.current
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }
  }, [messages.length])

  const requireAuth = (action: () => void) => {
    if (!isLoggedIn) setShowLoginPrompt(true)
    else action()
  }

  // captureScreenFrame agora é importado de use-screen-share.ts
  // Ele usa um vídeo oculto global que sempre vive no documento principal,
  // garantindo captura funcional tanto na tela principal quanto no PiP.

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  // Array de botões de Ação Rápida
  const QUICK_ACTIONS = [
    { icon: FileText, label: "Resumir", prompt: "Por favor, faça um resumo claro e conciso do que está visível na minha tela agora." },
    { icon: Code, label: "Explicar Código", prompt: "Analise e explique o código que está na minha tela passo a passo." },
    { icon: Table, label: "Extrair para Tabela", prompt: "Extraia os dados relevantes desta tela e organize-os em uma tabela Markdown clara." },
    { icon: Languages, label: "Traduzir", prompt: "Traduza o conteúdo principal visível nesta tela para o Português." },
  ]

  // Função handleSend atualizada para aceitar o texto dos botões
  const handleSend = async (overrideText?: any) => {
    requireAuth(async () => {
      // Interrompe áudio da IA imediatamente ao enviar nova mensagem
      stopAllAudio()

      let audioBase64 = undefined
      if (isVoiceActive) {
        audioBase64 = await stopRecording()
      }

      // MÁGICA AQUI: Deteta se o envio veio do Input normal ou de um botão de Quick Action
      const textToSend = typeof overrideText === 'string' ? overrideText : inputValue.trim()

      if (!textToSend && !isScreenShared && !audioBase64 && !selectedFile) return

      setInputValue('')

      if (selectedFile) {
        const { activeId, setActiveId, fetchConversations } = useConversations.getState()
        const token = localStorage.getItem('access_token') || ''

        addMessage({
          id: Date.now().toString(),
          role: 'user',
          content: textToSend || `[Arquivo: ${selectedFile.name}]`
        })

        setIsStreaming(true)
        const fileToSend = selectedFile
        setSelectedFile(null)

        const formData = new FormData()
        formData.append('token', token)
        if (textToSend) formData.append('text', textToSend)
        formData.append('file', fileToSend)
        if (activeId) formData.append('session_id', activeId)

        try {
          const res = await fetch(`${config.apiUrl}/api/chat/message`, {
            method: 'POST',
            body: formData
          })
          const data = await res.json()

          setIsStreaming(false)

          if (data.status === 'success') {
            if (!activeId && data.session_id) {
              setActiveId(data.session_id)
              await fetchConversations()
            }
            addMessage({ id: Date.now().toString(), role: 'assistant', content: data.response })

            stopAllAudio()
            if (isSoundEnabled) {
              if (data.audio_base64) {
                const audio = new Audio('data:audio/mp3;base64,' + data.audio_base64)
                audio.play().catch(e => console.error('Erro ao tocar áudio:', e))
              } else if (data.response) {
                const utterance = new SpeechSynthesisUtterance(data.response.replace(/[*#_]/g, ''))
                utterance.lang = 'pt-BR'
                window.speechSynthesis.speak(utterance)
              }
            }
          } else if (data.status === 'error' && data.message && data.message.includes('Créditos insuficientes')) {
            setUpgradeDialogMessage(data.message)
            setIsUpgradeDialogOpen(true)
          }

          if (data.remaining_credits !== undefined) {
            setCredits(data.remaining_credits)
          }
        } catch (error) {
          console.error('Erro ao enviar arquivo via REST:', error)
          setIsStreaming(false)
        }
      } else {
        const payload = {
          text: textToSend || undefined,
          image_base64: captureScreenFrame(),
          audio_base64: audioBase64
        }
        sendMessage(payload)
      }
    })
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a]">
      <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />
      <UpgradePlanDialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen} message={upgradeDialogMessage} />

      <Dialog open={showMobileWarning} onOpenChange={setShowMobileWarning}>
        <DialogContent className="bg-[#1e1e1e] border-zinc-800 text-zinc-100 rounded-2xl max-w-sm mx-4">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800 mx-auto mb-2">
              <MonitorUp className="w-6 h-6 text-zinc-400" />
            </div>
            <DialogTitle className="text-center text-lg font-semibold text-zinc-100">
              Função exclusiva para Desktop
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-zinc-400 leading-relaxed">
              O compartilhamento de tela não é suportado em dispositivos móveis. Acesse pelo computador para usar esta função.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => setShowMobileWarning(false)}
            className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl h-11 font-medium"
          >
            Entendi
          </Button>
        </DialogContent>
      </Dialog>

      {isLoggedIn && (
        <div className="absolute top-4 right-4 z-50 bg-[#1e1e1e]/80 backdrop-blur-md border border-zinc-800 rounded-full px-3 md:px-4 h-10 flex items-center gap-1.5 shadow-lg">
          <Zap className={`w-4 h-4 ${(credits !== null && credits < 20) ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} />
          <span className="text-sm font-bold text-zinc-200 flex items-center gap-1">
            <span>{(credits !== null) ? credits : '--'}</span>
            <span className="hidden sm:inline">Créditos</span>
          </span>
        </div>
      )}

      {isScreenShared && (
        <div
          className={`absolute top-4 left-4 z-40 transition-all duration-300 ${floatingState !== 'none' ? 'group' : ''
            }`}
        >
          {floatingState !== 'none' ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1.5 backdrop-blur-md shadow-lg cursor-default">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-red-500 tracking-wider uppercase">Screen Capturing</span>
                <button
                  onClick={stopSharing}
                  className="ml-1 p-0.5 hover:bg-red-500/20 rounded-full text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Hover Preview for PiP mode */}
              <div className="w-48 h-28 bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 origin-top-left pointer-events-none">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
            </div>
          ) : (
            <div className="w-64 h-36 bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <span className="bg-red-500 text-[10px] px-2 py-0.5 rounded-full text-white animate-pulse font-bold">LIVE</span>
                <button
                  onClick={stopSharing}
                  className="bg-black/60 hover:bg-black/80 p-1.5 rounded-full text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto pt-20 pb-40 custom-scrollbar"
        style={{
          maskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 100px), transparent calc(100% - 60px))',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 100px), transparent calc(100% - 60px))'
        }}
      >
        <div className="w-full max-w-5xl mx-auto px-4 flex flex-col gap-4">
          {messages.map((m, i) => (
            <div key={`${m.id}-${i}`} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${m.role === 'user' ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm' : 'bg-transparent text-zinc-300'}`}>
                <div className="text-[15px] max-w-none w-full break-words leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Parágrafos base
                      p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,

                      // Links clicáveis bonitos
                      a: ({ children, href }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-400/30 transition-colors font-medium">
                          {children}
                        </a>
                      ),

                      // Listas refinadas
                      ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                      li: ({ children }) => <li className="pl-1 marker:text-zinc-500">{children}</li>,

                      // Títulos com hierarquia clara
                      h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-zinc-100 pb-2 border-b border-zinc-800">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 text-zinc-100">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-semibold mb-3 mt-4 text-zinc-200">{children}</h3>,

                      // Negrito e Itálico
                      strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
                      em: ({ children }) => <em className="italic text-zinc-400">{children}</em>,

                      // Citações (Blockquotes) com design elegante
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-indigo-500/50 bg-indigo-500/10 pl-4 py-2 my-4 rounded-r-lg italic text-zinc-300">
                          {children}
                        </blockquote>
                      ),

                      // Linha Divisória horizontal (quando a IA usa ---)
                      hr: () => <hr className="my-6 border-zinc-800/80" />,

                      // ==========================================
                      // TABELAS (Muito comum em respostas da IA)
                      // ==========================================
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-6 rounded-lg border border-zinc-800">
                          <table className="w-full text-left border-collapse text-sm">{children}</table>
                        </div>
                      ),
                      th: ({ children }) => <th className="bg-zinc-800/50 px-4 py-3 font-semibold text-zinc-200 border-b border-zinc-800">{children}</th>,
                      td: ({ children }) => <td className="px-4 py-3 text-zinc-300 border-b border-zinc-800/50 last:border-0">{children}</td>,

                      // ==========================================
                      // BLOCOS DE CÓDIGO
                      // ==========================================
                      code: ({ inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline ? (
                          // Bloco de código multi-linhas
                          <div className="relative my-5 rounded-xl overflow-hidden bg-[#161616] border border-zinc-800 shadow-md">
                            {match && (
                              <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-zinc-800">
                                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{match[1]}</span>
                              </div>
                            )}
                            <div className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </div>
                          </div>
                        ) : (
                          // Código Inline (no meio do texto)
                          <code className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded-md font-mono text-[13px] border border-zinc-700/50" {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start w-full px-2 my-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="bg-zinc-800/40 backdrop-blur-sm border border-zinc-700/30 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-typing-dot" style={{ animationDelay: '0s' }} />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-typing-dot" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-typing-dot" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 w-full max-w-5xl mx-auto px-4 pb-8 z-10 pointer-events-none">
        <div className="pointer-events-auto bg-[#1e1e1e] border border-zinc-800/80 rounded-[32px] p-2 shadow-2xl relative">
          {/* QUICK ACTIONS FLUTUANTES */}

          {isScreenShared && (
            <div className="pointer-events-auto flex flex-wrap items-center gap-2 mb-3 ml-2 animate-in fade-in slide-in-from-bottom-2">
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(action.prompt)}
                  className="flex items-center gap-1.5 bg-[#1e1e1e]/90 hover:bg-[#2a2a2a] backdrop-blur-md border border-zinc-700/50 text-zinc-300 hover:text-zinc-100 text-xs font-medium px-3.5 py-2 rounded-full transition-all shadow-lg"
                >
                  <action.icon className="w-3.5 h-3.5" />
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {selectedFile && (
            <div className="absolute -top-14 left-4 bg-[#2a2a2a] border border-zinc-700/80 rounded-xl px-3 py-2 flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-indigo-500/20 p-1.5 rounded-lg">
                <FileUp className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-sm font-medium text-zinc-200 max-w-[180px] truncate">
                {selectedFile.name}
              </span>
              <button onClick={() => setSelectedFile(null)} className="ml-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#121212] rounded-[24px] p-1.5 pr-2">

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={`rounded-full h-10 w-10 transition-colors ${isScreenShared ? 'bg-blue-500/10 text-blue-500' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'}`}>
                  <Plus className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent container={floatingState !== 'none' && pipWindow ? pipWindow.document.body : undefined} align="start" sideOffset={12} className="w-64 bg-[#1a1a1a] border-zinc-800 text-zinc-200 p-1.5 rounded-xl shadow-2xl z-[100]">
                <DropdownMenuItem onClick={isScreenShared ? stopSharing : handleStartSharing} className="flex items-center justify-start gap-3 py-3 px-3 focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg transition-colors group">
                  <MonitorUp className={`w-5 h-5 shrink-0 ${isScreenShared ? 'text-blue-500' : 'text-zinc-400 group-hover:text-zinc-300'}`} />
                  <span className="font-medium text-[14px]">
                    {isScreenShared ? t('app.stop_sharing') : t('app.share_screen')}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="flex items-center justify-start gap-3 py-3 px-3 focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg transition-colors group mt-1">
                  <FileUp className="w-5 h-5 shrink-0 text-zinc-400 group-hover:text-zinc-300" />
                  <span className="font-medium text-[14px]">{t('app.send_file')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,application/pdf,audio/*" />

            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={t('app.send_message')}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-zinc-200 placeholder:text-zinc-500 text-[15px]"
            />

            <div className="flex items-center gap-1.5">
              {floatingState !== 'none' && (
                <Button
                  size="icon"
                  onClick={toggleContinuousMic}
                  title={isContinuousMicOn ? "Desativar Microfone Contínuo" : "Microfone Sempre Ligado"}
                  className={`rounded-full w-10 h-10 transition-all ${isContinuousMicOn ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-transparent text-zinc-500 hover:bg-zinc-800/60'}`}
                >
                  <AudioLines className={`w-5 h-5 ${isUserSpeaking ? 'animate-pulse scale-110' : ''}`} />
                </Button>
              )}
              <Button size="icon" onClick={isVoiceActive ? handleSend : startRecording} className={`rounded-full w-10 h-10 transition-all ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-zinc-500 hover:bg-zinc-800/60'}`}>
                <Mic className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                onClick={toggleSound}
                title={isSoundEnabled ? 'Silenciar IA' : 'Ativar voz da IA'}
                className={`rounded-full w-10 h-10 transition-all ${!isSoundEnabled ? 'bg-zinc-800 text-zinc-500' : 'bg-transparent text-zinc-500 hover:bg-zinc-800/60'}`}
              >
                {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-zinc-600" />}
              </Button>
              <Button size="icon" onClick={handleSend} disabled={!inputValue.trim() && !isScreenShared && !isVoiceActive && !selectedFile} className="rounded-full bg-zinc-200 text-zinc-900 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 w-10 h-10 transition-colors">
                <Navigation className="w-5 h-5" />
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
