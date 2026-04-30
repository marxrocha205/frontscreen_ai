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
import { isMobileDevice } from '@/lib/utils'
import { LoginPromptDialog } from '@/components/login-prompt-dialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Mic, Navigation, MonitorUp, Zap, Plus, FileUp, X, AudioLines, Volume2, VolumeX, FileText, Code, Table, Languages, Pencil, Square } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useContinuousVoice } from '@/hooks/use-continuous-voice'
import { UpgradePlanDialog } from '@/components/upgrade-plan-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export function ChatInterface() {
  const { t } = useI18n()
  const [inputValue, setInputValue] = useState('')
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showMobileWarning, setShowMobileWarning] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null) // Referência para a caixa de texto expansível

  // Estados para Edição de Mensagem
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  // Frases de Loading dinâmicas
  const loadingPhrases = [
    "A entender o prompt...",
    "A analisar o contexto...",
    "A processar informações...",
    "A gerar resposta...",
    "Quase pronto..."
  ]
  const [phraseIndex, setPhraseIndex] = useState(0)

  const { messages, sendMessage, isStreaming, sendCancel } = useWebsocket()
  const { credits, addMessage, setIsStreaming, setCredits, floatingState, pipWindow, isSoundEnabled, toggleSound, fetchCredits, isUpgradeDialogOpen, setIsUpgradeDialogOpen, upgradeDialogMessage, setUpgradeDialogMessage, userPlan } = useChatStore()
  const { isLoggedIn } = useAuth()

  useEffect(() => {
    if (isLoggedIn) {
      fetchCredits()
    }
  }, [isLoggedIn])

  // Efeito para ciclar as frases de loading a cada 2.5s enquanto carrega
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length)
      }, 2500)
      return () => clearInterval(interval)
    } else {
      setPhraseIndex(0) // Reseta quando terminar
    }
  }, [isStreaming])

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


  const handleStartSharing = () => {
    if (isMobileDevice()) {
      setShowMobileWarning(true)
      return
    }
    startSharing()
  }

  useEffect(() => {
    if (floatingState === 'none' && isContinuousMicOn) toggleContinuousMic()
  }, [floatingState, isContinuousMicOn, toggleContinuousMic])

  useEffect(() => {
    if (isVoiceActive && isContinuousMicOn) toggleContinuousMic()
  }, [isVoiceActive, isContinuousMicOn, toggleContinuousMic])

  useEffect(() => {
    if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(e => {
        if (e.name !== 'AbortError') console.error("Error playing video:", e)
      })
    }
  }, [stream])

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      const container = scrollRef.current
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }
  }, [messages.length, isStreaming])

  const requireAuth = (action: () => void) => {
    if (!isLoggedIn) setShowLoginPrompt(true)
    else action()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const QUICK_ACTIONS = [
    { icon: FileText, label: "Resumir", prompt: "Por favor, faça um resumo claro e conciso do que está visível na minha tela agora." },
    { icon: Code, label: "Explicar Código", prompt: "Analise e explique o código que está na minha tela passo a passo." },
    { icon: Table, label: "Extrair para Tabela", prompt: "Extraia os dados relevantes desta tela e organize-os em uma tabela Markdown clara." },
    { icon: Languages, label: "Traduzir", prompt: "Traduza o conteúdo principal visível nesta tela para o Português." },
  ]

  const handleSend = async (overrideText?: any) => {
    requireAuth(async () => {
      stopAllAudio()

      let audioBase64 = undefined
      if (isVoiceActive) {
        audioBase64 = await stopRecording()
      }

      const textToSend = typeof overrideText === 'string' ? overrideText : inputValue.trim()

      if (!textToSend && !isScreenShared && !audioBase64 && !selectedFile) return

      // Limpa a caixa de texto e reseta a altura para o tamanho original
      setInputValue('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

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

  // ==========================================
  // LÓGICA BLINDADA DE LOADING (Evita "piscar" e sumir por causa do Markdown)
  // ==========================================
  const lastMessage = messages[messages.length - 1]
  
  const hasVisibleContent = (content: string) => {
    if (!content) return false;
    const clean = content.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '');
    return /[a-zA-Z0-9\u00C0-\u024F]/.test(clean); 
  };

  const isWaitingForFirstChunk = isStreaming && (
    !lastMessage || 
    lastMessage.role === 'user' || 
    (lastMessage.role === 'assistant' && !hasVisibleContent(lastMessage.content))
  );

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
          <Button onClick={() => setShowMobileWarning(false)} className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl h-11 font-medium">
            Entendi
          </Button>
        </DialogContent>
      </Dialog>

      {isLoggedIn && (
        <div id="tour-credits" className="absolute top-4 right-4 z-50 group">
          {/* Badge principal */}
          <div className={`flex items-center gap-2 bg-[#1e1e1e]/80 backdrop-blur-md border rounded-full px-3 md:px-4 h-10 shadow-lg cursor-default transition-colors duration-200 ${
            (credits !== null && credits < 20)
              ? 'border-red-500/40 hover:border-red-500/60'
              : 'border-zinc-800 hover:border-zinc-700'
          }`}>
            <span className={`text-sm font-bold ${
              (credits !== null && credits < 20) ? 'text-red-400' : 'text-zinc-200'
            }`}>
              {credits !== null ? credits.toLocaleString('pt-BR') : '--'}
            </span>
            <span className="text-xs text-zinc-500 hidden sm:inline font-medium">créditos</span>
            {credits !== null && credits < 20 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>

          {/* Tooltip card */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-[#1a1a1a]/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 origin-top-right">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Seu Plano</span>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                {userPlan || 'Free'}
              </span>
            </div>

            <div className="mb-3">
              <div className="flex items-end justify-between mb-1.5">
                <span className="text-xs text-zinc-500">Créditos disponíveis</span>
                <span className={`text-xl font-bold tabular-nums ${
                  credits !== null && credits < 20 ? 'text-red-400' : 'text-zinc-100'
                }`}>
                  {credits !== null ? credits.toLocaleString('pt-BR') : '--'}
                </span>
              </div>
              {/* Barra de progresso */}
              {credits !== null && (
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      credits < 20 ? 'bg-red-500' : credits < 100 ? 'bg-yellow-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, (credits / 500) * 100)}%` }}
                  />
                </div>
              )}
            </div>

            {credits !== null && credits < 20 && (
              <p className="text-[11px] text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 mb-3 leading-relaxed">
                Seus créditos estão quase esgotados. Faça upgrade para continuar usando a IA.
              </p>
            )}

            <a
              href="/pricing"
              className="block w-full text-center text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 rounded-xl py-2.5 transition-all duration-150"
            >
              Ver planos e preços
            </a>
          </div>
        </div>
      )}

      {isScreenShared && (
        <div className={`absolute top-4 left-4 z-40 transition-all duration-300 ${floatingState !== 'none' ? 'group' : ''}`}>
          {floatingState !== 'none' ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1.5 backdrop-blur-md shadow-lg cursor-default">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-red-500 tracking-wider uppercase">Screen Capturing</span>
                <button onClick={stopSharing} className="ml-1 p-0.5 hover:bg-red-500/20 rounded-full text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="w-48 h-28 bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 origin-top-left pointer-events-none">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
            </div>
          ) : (
            <div className="w-64 h-36 bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <span className="bg-red-500 text-[10px] px-2 py-0.5 rounded-full text-white animate-pulse font-bold">LIVE</span>
                <button onClick={stopSharing} className="bg-black/60 hover:bg-black/80 p-1.5 rounded-full text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        ref={scrollRef}
        className={`absolute inset-0 overflow-y-auto pt-20 custom-scrollbar overscroll-contain ${
          (isScreenShared || floatingState !== 'none') ? 'pb-56' : 'pb-40'
        }`}
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0px, black 120px, black calc(100% - 100px), transparent calc(100% - 60px))',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 120px, black calc(100% - 100px), transparent calc(100% - 60px))'
        }}
      >
        <div className="w-full max-w-5xl mx-auto px-4 flex flex-col gap-4">
          {messages.map((m, i) => {
            if (m.role === 'assistant' && isStreaming && i === messages.length - 1) {
              if (!hasVisibleContent(m.content)) return null;
            }

            return (
              <div key={`${m.id}-${i}`} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                {m.role === 'user' && editingMessageId === m.id ? (
                  // UI MODO EDIÇÃO DA MENSAGEM DO USUÁRIO
                  <div className="bg-zinc-800 p-4 rounded-2xl w-full max-w-[85%] shadow-sm border border-zinc-700 animate-in fade-in">
                    <textarea
                      value={editContent}
                      onChange={(e) => {
                        setEditContent(e.target.value)
                        e.target.style.height = 'auto'
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 300)}px`
                      }}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-zinc-100 text-[15px] focus:outline-none focus:border-zinc-500 resize-none min-h-[100px] max-h-[300px] overflow-y-auto custom-scrollbar"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <Button variant="ghost" size="sm" onClick={() => setEditingMessageId(null)} className="text-zinc-400 hover:text-zinc-200">
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={() => {
                        setEditingMessageId(null);
                        handleSend(editContent);
                      }} className="bg-zinc-200 text-zinc-900 hover:bg-white font-medium">
                        Atualizar e Enviar
                      </Button>
                    </div>
                  </div>
                ) : (
                  // UI NORMAL DA MENSAGEM
                  <div className={`group relative max-w-[85%] rounded-2xl px-5 py-4 shadow-sm flex items-start gap-2 ${m.role === 'user' ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm' : 'bg-transparent text-zinc-300'}`}>
                    
                    {/* BOTÃO DE EDITAR (Aparece no Hover) */}
                    {m.role === 'user' && (
                      <button
                        onClick={() => {
                          setEditingMessageId(m.id);
                          setEditContent(m.content);
                        }}
                        className="absolute -left-12 top-3 p-2 bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-700 shadow-sm"
                        title="Editar mensagem"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    <div className="text-[15px] max-w-none w-full break-words leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                          a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-400/30 transition-colors font-medium">{children}</a>,
                          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                          li: ({ children }) => <li className="pl-1 marker:text-zinc-500">{children}</li>,
                          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-zinc-100 pb-2 border-b border-zinc-800">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 text-zinc-100">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg font-semibold mb-3 mt-4 text-zinc-200">{children}</h3>,
                          strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
                          em: ({ children }) => <em className="italic text-zinc-400">{children}</em>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-indigo-500/50 bg-indigo-500/10 pl-4 py-2 my-4 rounded-r-lg italic text-zinc-300">{children}</blockquote>,
                          hr: () => <hr className="my-6 border-zinc-800/80" />,
                          table: ({ children }) => <div className="overflow-x-auto my-6 rounded-lg border border-zinc-800"><table className="w-full text-left border-collapse text-sm">{children}</table></div>,
                          th: ({ children }) => <th className="bg-zinc-800/50 px-4 py-3 font-semibold text-zinc-200 border-b border-zinc-800">{children}</th>,
                          td: ({ children }) => <td className="px-4 py-3 text-zinc-300 border-b border-zinc-800/50 last:border-0">{children}</td>,
                          code: ({ inline, className, children, ...props }: any) => {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline ? (
                              <div className="relative my-5 rounded-xl overflow-hidden bg-[#161616] border border-zinc-800 shadow-md">
                                {match && (
                                  <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-zinc-800">
                                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{match[1]}</span>
                                  </div>
                                )}
                                <div className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed">
                                  <code className={className} {...props}>{children}</code>
                                </div>
                              </div>
                            ) : (
                              <code className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded-md font-mono text-[13px] border border-zinc-700/50" {...props}>{children}</code>
                            )
                          }
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* INDICADOR DE CARREGAMENTO & BOTÃO PARAR */}
          {isStreaming && (
            <div className="flex flex-col items-start w-full pl-2 my-2 gap-3">
              
              {isWaitingForFirstChunk && (
                <div className="flex items-center gap-3 bg-zinc-800/40 px-4 py-2.5 rounded-full border border-zinc-700/50 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                  <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
                    <div className="absolute inset-0 rounded-full border-[2px] border-zinc-600/30"></div>
                    <div className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-zinc-200 animate-[spin_0.8s_linear_infinite]"></div>
                    <img 
                      src="/icon.png" 
                      alt="A carregar" 
                      className="w-3.5 h-3.5 object-contain opacity-80 animate-pulse" 
                    />
                  </div>
                  <span className="text-sm font-medium text-zinc-300 min-w-[160px] animate-pulse">
                    {loadingPhrases[phraseIndex]}
                  </span>
                </div>
              )}

              <button 
                onClick={() => sendCancel()} 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1e1e1e] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-colors text-xs font-medium ml-1 shadow-sm animate-in fade-in"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Parar resposta
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 w-full max-w-5xl mx-auto px-4 pb-8 z-10 pointer-events-none">
        <div id="tour-input-bar" className="pointer-events-auto bg-[#1e1e1e] border border-zinc-800/80 rounded-[32px] p-2 shadow-2xl relative">
        {(isScreenShared || floatingState !== 'none') && (
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

          {/* CAIXA DE TEXTO MULTI-LINHA (AUTO-RESIZE) */}
          <div className="flex items-end gap-2 bg-[#121212] rounded-[24px] p-1.5 pr-2">

            <div className="pb-0.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button id="tour-attachment-btn" variant="ghost" size="icon" className={`rounded-full h-10 w-10 transition-colors ${isScreenShared ? 'bg-blue-500/10 text-blue-500' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'}`}>
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
            </div>

            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,application/pdf,audio/*" />

            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={e => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto'; // Reseta a altura
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`; // Cresce até ao limite de 200px
              }}
              onKeyDown={e => {
                // Se pressionar Enter (SEM o Shift), envia a mensagem.
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t('app.send_message')}
              rows={1}
              className="placeholder-ellipsis flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-zinc-200 placeholder:text-zinc-500 text-[15px] resize-none py-2.5 max-h-[200px] overflow-y-auto custom-scrollbar"
              style={{ minHeight: '40px' }}
            />

            <div className="flex items-center gap-1.5 pb-0.5">
              {floatingState !== 'none' && (
                <Button
                  id="tour-continuous-mic"
                  size="icon"
                  onClick={toggleContinuousMic}
                  title={isContinuousMicOn ? "Desativar Microfone Contínuo" : "Microfone Sempre Ligado"}
                  className={`rounded-full w-10 h-10 transition-all ${isContinuousMicOn ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-transparent text-zinc-500 hover:bg-zinc-800/60'}`}
                >
                  <AudioLines className={`w-5 h-5 ${isUserSpeaking ? 'animate-pulse scale-110' : ''}`} />
                </Button>
              )}
              <Button id="tour-mic-btn" size="icon" onClick={isVoiceActive ? handleSend : startRecording} className={`rounded-full w-10 h-10 transition-all ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-zinc-500 hover:bg-zinc-800/60'}`}>
                <Mic className="w-5 h-5" />
              </Button>
              <Button
                id="tour-audio-toggle"
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
