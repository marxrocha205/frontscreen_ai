"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useI18n } from '@/context/i18n-context'
import { useWebsocket } from '@/hooks/use-websocket'
import { useGeminiVoice } from '@/hooks/use-gemini-voice'
import { useScreenShare, captureScreenFrame } from '@/hooks/use-screen-share'
import { useAuth } from '@/hooks/use-auth'
import { useConversations } from '@/hooks/use-conversations'
import { config } from '@/lib/config'
import { LoginPromptDialog } from '@/components/login-prompt-dialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Mic, Navigation, Plus, FileUp, X, AudioLines, Pencil, Square, ChevronRight, Check, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useGeminiLive } from '@/hooks/use-gemini-live'
import { UpgradePlanDialog } from '@/components/upgrade-plan-dialog'
import { GeminiLiveOrb } from '@/components/gemini-live-orb'
import { useChatStore, AI_MODELS } from '@/hooks/use-chat-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

// Premium descriptions lookup table to match mockups exactly
const modelDescriptions: Record<string, { title: string; desc: string }> = {
  'screen-ai-1.2': {
    title: 'ScreenAI 1.2',
    desc: 'Velocidade cotidiana e ótimo para tarefas do dia a dia.'
  },
  'openai/gpt-4o-mini': {
    title: 'GPT-4o Mini',
    desc: 'Respostas rápidas, leve e super inteligente.'
  },
  'openrouter/deepseek/deepseek-chat': {
    title: 'DeepSeek V3',
    desc: 'Desempenho ágil com excelente custo-benefício.'
  },
  'openai/gpt-4o': {
    title: 'GPT-4 Omni',
    desc: 'Versatilidade e alta complexidade em tarefas complexas.'
  },
  'anthropic/claude-3-5-sonnet-20241022': {
    title: 'Claude 3.5 Sonnet',
    desc: 'Raciocínio sutil, escrita fluida e códigos.'
  },
  'gemini/gemini-2.5-pro': {
    title: 'Gêmeos Pro 1.5', // matching visual label style
    desc: 'Processamento de dados extensos e multimodais.'
  },
  'openrouter/deepseek/deepseek-r1': {
    title: 'Gêmeos 1.5 Pro (Pesquisa)', // matching deep reasoning visual label
    desc: 'Raciocínio lógico, matemática e programação.'
  },
  'openrouter/meta-llama/llama-3.3-70b-instruct': {
    title: 'Llama-3 70B R',
    desc: 'Análise complexa, robusta e open-source.'
  }
}

// Gorgeous colorful logos mapping for each model container
const ModalModelIcon = ({ id }: { id: string }) => {
  if (id === 'screen-ai-1.2') {
    return (
      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.25)] shrink-0">
        <Image src="/screenai-logo.png" alt="ScreenAI" width={18} height={18} className="w-5 h-5 object-contain" />
      </div>
    )
  }
  if (id === 'openai/gpt-4o' || id === 'openai/gpt-4o-mini') {
    return (
      <div className="w-9 h-9 rounded-xl bg-[#10a37f] flex items-center justify-center shadow-[0_0_12px_rgba(16,163,127,0.25)] shrink-0">
        <Image src="/chatgpt-logo.png" alt="GPT" width={18} height={18} className="w-5 h-5 object-contain" />
      </div>
    )
  }
  if (id === 'anthropic/claude-3-5-sonnet-20241022') {
    return (
      <div className="w-9 h-9 rounded-xl bg-[#e05600] flex items-center justify-center shadow-[0_0_12px_rgba(224,86,0,0.25)] shrink-0">
        <Image src="/claude-logo.png" alt="Claude" width={18} height={18} className="w-5 h-5 object-contain" />
      </div>
    )
  }
  if (id === 'gemini/gemini-2.5-pro') {
    return (
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-[#1a73e8] flex items-center justify-center shadow-[0_0_12px_rgba(26,115,232,0.25)] shrink-0">
        <Image src="/gemini-logo.png" alt="Gemini" width={18} height={18} className="w-5 h-5 object-contain" />
      </div>
    )
  }
  if (id.includes('deepseek')) {
    return (
      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-600 to-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.25)] shrink-0">
        <span className="text-base text-white">🐋</span>
      </div>
    )
  }
  if (id.includes('llama')) {
    return (
      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.25)] shrink-0">
        <span className="text-base text-white">🦙</span>
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
      <Sparkles className="w-5 h-5 text-zinc-400" />
    </div>
  )
}

// Gorgeous mini logos mapping for the input bar selector
const InputModelIcon = ({ id }: { id: string }) => {
  if (id === 'screen-ai-1.2') {
    return (
      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shrink-0">
        <Image src="/screenai-logo.png" alt="ScreenAI" width={10} height={10} className="w-2.5 h-2.5 object-contain" />
      </div>
    )
  }
  if (id === 'openai/gpt-4o' || id === 'openai/gpt-4o-mini') {
    return (
      <div className="w-5 h-5 rounded-full bg-[#10a37f] flex items-center justify-center shrink-0">
        <Image src="/chatgpt-logo.png" alt="GPT" width={10} height={10} className="w-2.5 h-2.5 object-contain" />
      </div>
    )
  }
  if (id === 'anthropic/claude-3-5-sonnet-20241022') {
    return (
      <div className="w-5 h-5 rounded-full bg-[#e05600] flex items-center justify-center shrink-0">
        <Image src="/claude-logo.png" alt="Claude" width={10} height={10} className="w-2.5 h-2.5 object-contain" />
      </div>
    )
  }
  if (id === 'gemini/gemini-2.5-pro') {
    return (
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-[#1a73e8] flex items-center justify-center shrink-0">
        <Image src="/gemini-logo.png" alt="Gemini" width={10} height={10} className="w-2.5 h-2.5 object-contain" />
      </div>
    )
  }
  if (id.includes('deepseek')) {
    return (
      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shrink-0">
        <span className="text-[10px] text-white select-none">🐋</span>
      </div>
    )
  }
  if (id.includes('llama')) {
    return (
      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shrink-0">
        <span className="text-[10px] text-white select-none">🦙</span>
      </div>
    )
  }
  return (
    <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
      <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
    </div>
  )
}

export function ChatInterface() {
  const { t, language } = useI18n()
  const [inputValue, setInputValue] = useState('')
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isModelsDialogOpen, setIsModelsDialogOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null) // Referência para a caixa de texto expansível

  // Estados para Edição de Mensagem
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  // Frases de Loading dinâmicas
  const loadingPhrases = language === 'pt-BR' ? [
    "A entender o prompt...",
    "A analisar o contexto...",
    "A processar informações...",
    "A gerar resposta...",
    "Quase pronto..."
  ] : [
    "Understanding the prompt...",
    "Analyzing context...",
    "Processing information...",
    "Generating response...",
    "Almost ready..."
  ]
  const [phraseIndex, setPhraseIndex] = useState(0)

  const { messages, sendMessage, isStreaming, sendCancel } = useWebsocket()
  const { credits, addMessage, setIsStreaming, setCredits, floatingState, pipWindow, fetchCredits, isUpgradeDialogOpen, setIsUpgradeDialogOpen, upgradeDialogMessage, setUpgradeDialogMessage, userPlan, selectedModel, setSelectedModel } = useChatStore()
  const { hasHydrated, isLoggedIn, syncFromStorage } = useAuth()

  const handleModelSelect = (modelId: string) => {
    const model = AI_MODELS.find(m => m.id === modelId)
    if (!model) return
    const isFreeUser = !userPlan || userPlan.toLowerCase() === 'free'
    if (model.requiresPro && isFreeUser) {
      setUpgradeDialogMessage(t('app.model_upgrade_message').replace('{model}', model.label))
      setIsUpgradeDialogOpen(true)
      return
    }
    setSelectedModel(modelId)
  }

  useEffect(() => {
    syncFromStorage()
  }, [syncFromStorage])

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

  const {
    isActive: isGeminiLiveActive,
    isConnected: isGeminiLiveConnected,
    phase: geminiLivePhase,
    audioLevel: geminiLiveAudioLevel,
    startSession: startGeminiLive,
    stopSession: stopGeminiLive
  } = useGeminiLive()

  const toggleGeminiLive = useCallback(() => {
    if (isGeminiLiveActive) {
      stopGeminiLive()
    } else {
      startGeminiLive()
    }
  }, [isGeminiLiveActive, startGeminiLive, stopGeminiLive])

  const videoRef = useRef<HTMLVideoElement>(null)
  const { isSharing: isScreenShared, stopSharing, stream } = useScreenShare()

  useEffect(() => {
    if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(e => {
        if (e.name !== 'AbortError') console.error("Error playing video:", e)
      })
    }
  }, [stream])

  const scrollRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const isAtBottomRef = useRef(true)

  // Função para verificar se o usuário está próximo ao final do chat
  const checkIsAtBottom = useCallback(() => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    // Consideramos que está no final se o scroll está a menos de 150px do fundo
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 150
    isAtBottomRef.current = isAtBottom
  }, [])

  // Função para rolar até o final da conversa
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const scrollMax = container.scrollHeight + 2000

    container.scrollTo({
      top: scrollMax,
      behavior
    })

    // Executa uma segunda rolagem no próximo frame para garantir atualizações dinâmicas do DOM
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight + 2000,
          behavior
        })
      }
    })
  }, [])

  // Scroll automático durante streaming de mensagens (apenas se o usuário já estiver no final do chat)
  useEffect(() => {
    if (!scrollRef.current || messages.length === 0) return

    if (isStreaming && isAtBottomRef.current) {
      scrollToBottom('auto')
    }
  }, [messages, isStreaming, scrollToBottom])

  // Scroll automático para novas mensagens enviadas pelo próprio usuário
  useEffect(() => {
    if (messages.length === 0) return
    const lastMessage = messages[messages.length - 1]

    if (lastMessage?.role === 'user') {
      isAtBottomRef.current = true
      scrollToBottom('smooth')
    }
  }, [messages.length, scrollToBottom])

  const setMessageRef = useCallback((key: string, node: HTMLDivElement | null) => {
    if (node) {
      messageRefs.current.set(key, node)
    } else {
      messageRefs.current.delete(key)
    }
  }, [])

  const requireAuth = (action: () => void) => {
    if (!hasHydrated) {
      syncFromStorage()
    }

    if (useAuth.getState().isLoggedIn) {
      action()
    } else {
      setShowLoginPrompt(true)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSend = async (overrideText?: any) => {
    requireAuth(async () => {

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
          content: textToSend || (language === 'pt-BR' ? `[Arquivo: ${selectedFile.name}]` : `[File: ${selectedFile.name}]`)
        })

        setIsStreaming(true)
        const fileToSend = selectedFile
        setSelectedFile(null)

        const formData = new FormData()
        formData.append('token', token)
        if (textToSend) formData.append('text', textToSend)
        formData.append('file', fileToSend)
        if (activeId) formData.append('session_id', activeId)
        if (selectedModel) formData.append('model', selectedModel)

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
  const isEmptyChat = messages.length === 0 && !isStreaming;
  const emptyChatPrompt = language === 'pt-BR'
    ? 'O que está na sua mente hoje?'
    : "What's on your mind today?";

  const activeModelName = modelDescriptions[selectedModel]?.title || AI_MODELS.find(m => m.id === selectedModel)?.label || 'ScreenAI'
  const placeholderText = !isEmptyChat
    ? (language === 'pt-BR' ? `Mensagem para o ${activeModelName}` : `Message for ${activeModelName}`)
    : t('app.send_message');

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a]">
      <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />

      <Dialog open={isModelsDialogOpen} onOpenChange={setIsModelsDialogOpen}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[960px] max-h-[90vh] overflow-y-auto md:overflow-hidden bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/80 text-zinc-100 p-4 md:p-6 rounded-2xl shadow-2xl focus:outline-none pointer-events-auto custom-scrollbar">
          <DialogHeader className="relative flex flex-col items-center justify-center pb-4 border-b border-zinc-900">
            {/* Elegant Header Title */}
            <div className="flex items-center gap-2.5 px-5 py-1.5 rounded-full text-xs font-bold bg-zinc-900/60 border border-zinc-800/80 text-zinc-100 shadow-md select-none">
              <Image src="/chatgpt-logo.png" alt="OpenAI" width={14} height={14} className="opacity-80 shrink-0" />
              <span>MODELOS DE IA</span>
            </div>
          </DialogHeader>

          {/* Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 pt-4 md:pt-5 pb-2">
            {/* RÁPIDO Column */}
            <div className="flex flex-col min-w-0">
              <span className="text-zinc-500 tracking-wider text-[11px] font-bold uppercase mb-3 px-1">
                {language === 'pt-BR' ? 'RÁPIDO' : 'FAST'}
              </span>
              <div className="flex flex-col gap-2.5 max-h-none overflow-visible md:max-h-[360px] md:overflow-y-auto pr-0 md:pr-1 pointer-events-auto custom-scrollbar">
                {AI_MODELS.filter(m => ['screen-ai-1.2', 'openai/gpt-4o-mini', 'openrouter/deepseek/deepseek-chat'].includes(m.id)).map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      handleModelSelect(model.id)
                      setIsModelsDialogOpen(false)
                    }}
                    className={`w-full flex items-start gap-3.5 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer group pointer-events-auto ${selectedModel === model.id
                      ? 'border-zinc-700 bg-zinc-800/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_15px_rgba(99,102,241,0.08)]'
                      : 'border-transparent bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-800/60'
                      }`}
                  >
                    <ModalModelIcon id={model.id} />
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <span className="font-semibold text-[13px] text-zinc-100 group-hover:text-white leading-tight block truncate md:whitespace-normal">
                        {modelDescriptions[model.id]?.title || model.label}
                      </span>
                      <span className="text-[11px] text-zinc-500 group-hover:text-zinc-400 mt-1 leading-normal line-clamp-2">
                        {modelDescriptions[model.id]?.desc || model.description || ''}
                      </span>
                    </div>
                    {selectedModel === model.id && (
                      <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 self-center ml-auto shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                        <Check className="w-3 h-3 text-zinc-900 stroke-[3px]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* AVANÇADO Column */}
            <div className="flex flex-col min-w-0">
              <span className="text-zinc-500 tracking-wider text-[11px] font-bold uppercase mb-3 px-1">
                {language === 'pt-BR' ? 'AVANÇADO' : 'ADVANCED'}
              </span>
              <div className="flex flex-col gap-2.5 max-h-none overflow-visible md:max-h-[360px] md:overflow-y-auto pr-0 md:pr-1 pointer-events-auto custom-scrollbar">
                {AI_MODELS.filter(m => ['openai/gpt-4o', 'anthropic/claude-3-5-sonnet-20241022', 'gemini/gemini-2.5-pro'].includes(m.id)).map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      handleModelSelect(model.id)
                      setIsModelsDialogOpen(false)
                    }}
                    className={`w-full flex items-start gap-3.5 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer group pointer-events-auto ${selectedModel === model.id
                      ? 'border-zinc-700 bg-zinc-800/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_15px_rgba(99,102,241,0.08)]'
                      : 'border-transparent bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-800/60'
                      }`}
                  >
                    <ModalModelIcon id={model.id} />
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <span className="font-semibold text-[13px] text-zinc-100 group-hover:text-white leading-tight block truncate md:whitespace-normal">
                        {modelDescriptions[model.id]?.title || model.label}
                      </span>
                      <span className="text-[11px] text-zinc-500 group-hover:text-zinc-400 mt-1 leading-normal line-clamp-2">
                        {modelDescriptions[model.id]?.desc || model.description || ''}
                      </span>
                    </div>
                    {selectedModel === model.id && (
                      <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 self-center ml-auto shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                        <Check className="w-3 h-3 text-zinc-900 stroke-[3px]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* RACIOCÍNIO PROFUNDO Column */}
            <div className="flex flex-col min-w-0">
              <span className="text-zinc-500 tracking-wider text-[11px] font-bold uppercase mb-3 px-1">
                {language === 'pt-BR' ? 'RACIOCÍNIO PROFUNDO' : 'DEEP REASONING'}
              </span>
              <div className="flex flex-col gap-2.5 max-h-none overflow-visible md:max-h-[360px] md:overflow-y-auto pr-0 md:pr-1 pointer-events-auto custom-scrollbar">
                {AI_MODELS.filter(m => ['openrouter/deepseek/deepseek-r1', 'openrouter/meta-llama/llama-3.3-70b-instruct'].includes(m.id)).map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      handleModelSelect(model.id)
                      setIsModelsDialogOpen(false)
                    }}
                    className={`w-full flex items-start gap-3.5 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer group pointer-events-auto ${selectedModel === model.id
                      ? 'border-zinc-700 bg-zinc-800/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_15px_rgba(99,102,241,0.08)]'
                      : 'border-transparent bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-800/60'
                      }`}
                  >
                    <ModalModelIcon id={model.id} />
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <span className="font-semibold text-[13px] text-zinc-100 group-hover:text-white leading-tight block truncate md:whitespace-normal">
                        {modelDescriptions[model.id]?.title || model.label}
                      </span>
                      <span className="text-[11px] text-zinc-500 group-hover:text-zinc-400 mt-1 leading-normal line-clamp-2">
                        {modelDescriptions[model.id]?.desc || model.description || ''}
                      </span>
                    </div>
                    {selectedModel === model.id && (
                      <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 self-center ml-auto shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                        <Check className="w-3 h-3 text-zinc-900 stroke-[3px]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {hasHydrated && isLoggedIn && (
        <div id="tour-credits" className="absolute top-4 right-4 z-50 group">
          {/* Badge principal */}
          <div className={`flex items-center gap-2 bg-[#1e1e1e]/80 backdrop-blur-md border rounded-full px-3 md:px-4 h-10 shadow-lg cursor-default transition-colors duration-200 ${(credits !== null && credits < 20)
            ? 'border-red-500/40 hover:border-red-500/60'
            : 'border-zinc-800 hover:border-zinc-700'
            }`}>
            <span className={`text-sm font-bold ${(credits !== null && credits < 20) ? 'text-red-400' : 'text-zinc-200'
              }`}>
              {credits !== null ? credits.toLocaleString(language) : '--'}
            </span>
            <span className="text-xs text-zinc-500 hidden sm:inline font-medium">{t('app.credits')}</span>
            {credits !== null && credits < 20 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>

          {/* Tooltip card */}
          <div className="absolute top-full right-0 pt-2 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 origin-top-right">
            <div className="w-64 bg-[#1a1a1a]/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{language === 'pt-BR' ? 'Seu Plano' : 'Your Plan'}</span>
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  {userPlan || 'Free'}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex items-end justify-between mb-1.5">
                  <span className="text-xs text-zinc-500">{t('app.available_credits')}</span>
                  <span className={`text-xl font-bold tabular-nums ${credits !== null && credits < 20 ? 'text-red-400' : 'text-zinc-100'
                    }`}>
                    {credits !== null ? credits.toLocaleString(language) : '--'}
                  </span>
                </div>
                {/* Barra de progresso */}
                {credits !== null && (
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${credits < 20 ? 'bg-red-500' : credits < 100 ? 'bg-yellow-500' : 'bg-indigo-500'
                        }`}
                      style={{ width: `${Math.min(100, (credits / 500) * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {credits !== null && credits < 20 && (
                <p className="text-[11px] text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 mb-3 leading-relaxed">
                  {t('app.credits_low')}
                </p>
              )}

              <a
                href="/pricing"
                className="block w-full text-center text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 rounded-xl py-2.5 transition-all duration-150"
              >
                {t('app.view_plans')}
              </a>
            </div>
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

      <GeminiLiveOrb
        active={isGeminiLiveActive}
        connected={isGeminiLiveConnected}
        phase={geminiLivePhase}
        level={geminiLiveAudioLevel}
        onClose={stopGeminiLive}
      />

      <div
        ref={scrollRef}
        onScroll={checkIsAtBottom}
        className={`absolute inset-0 overflow-y-auto pt-20 custom-scrollbar overscroll-contain transition-all duration-300 ${(isScreenShared || floatingState !== 'none') ? 'pb-64' : 'pb-48'
          } ${isGeminiLiveActive ? 'opacity-25 blur-[2px] scale-[0.995]' : 'opacity-100 blur-0 scale-100'}`}
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0px, black 120px, black calc(100% - 185px), transparent calc(100% - 165px))',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 120px, black calc(100% - 185px), transparent calc(100% - 165px))'
        }}
      >
        <div className="w-full max-w-5xl mx-auto px-4 flex flex-col gap-4">
          {messages.map((m, i) => {
            const messageKey = `${m.id}-${i}`

            if (m.role === 'assistant' && isStreaming && i === messages.length - 1) {
              if (!hasVisibleContent(m.content)) return null;
            }

            return (
              <div
                key={messageKey}
                ref={(node) => setMessageRef(messageKey, node)}
                className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >

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
                        {language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
                      </Button>
                      <Button size="sm" onClick={() => {
                        setEditingMessageId(null);
                        handleSend(editContent);
                      }} className="bg-zinc-200 text-zinc-900 hover:bg-white font-medium">
                        {language === 'pt-BR' ? 'Atualizar e Enviar' : 'Update and Send'}
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
                        title={language === 'pt-BR' ? "Editar mensagem" : "Edit message"}
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
                          code: ({ className, children, ...props }: any) => {
                            const match = /language-(\w+)/.exec(className || '')
                            return match ? (
                              <div className="relative my-5 rounded-xl overflow-hidden bg-[#161616] border border-zinc-800 shadow-md">
                                <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-zinc-800">
                                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{match[1]}</span>
                                </div>
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
                      alt="Loading"
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
                {language === 'pt-BR' ? 'Parar resposta' : 'Stop response'}
              </button>
            </div>
          )}

          {/* Espaçador físico garantido no final do chat para afastar o texto da barra de input */}
          {!isEmptyChat && <div className="h-36 w-full shrink-0 pointer-events-none" />}
        </div>
      </div>

      {!isGeminiLiveActive && (
        <div
          className={`absolute left-0 right-0 w-full max-w-5xl mx-auto px-4 pointer-events-none transition-all duration-300 ${isEmptyChat
            ? 'top-1/2 -translate-y-1/2 pb-0'
            : 'bottom-0 translate-y-0 pb-5 sm:pb-8'
            } z-10`}
        >
          {isEmptyChat && (
            <>
              <h1 className="empty-chat-prompt pointer-events-none mb-5 text-center text-2xl font-semibold leading-tight text-zinc-100 sm:mb-6 sm:text-3xl">
                <span className="empty-chat-prompt__text">{emptyChatPrompt}</span>
              </h1>

              <div className="flex flex-wrap justify-center items-center gap-2.5 mb-6 pointer-events-auto max-w-full px-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                {/* Pill 1: ScreenAI 1.2 */}
                <button
                  onClick={() => handleModelSelect('screen-ai-1.2')}
                  className={`group flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-all duration-200 ${selectedModel === 'screen-ai-1.2'
                    ? 'border border-zinc-100 bg-[#1e2030]/80 text-zinc-100 shadow-[0_0_12px_rgba(99,102,241,0.15)] scale-[1.02]'
                    : 'border border-zinc-800/80 bg-[#141414]/30 text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f1f]/80'
                    }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-400 to-cyan-300 shadow-[0_0_8px_rgba(99,102,241,0.9)] animate-pulse shrink-0" />
                  <span>ScreenAI 1.2</span>
                </button>

                {/* Pill 2: GPT-5.1 */}
                <button
                  onClick={() => handleModelSelect('openai/gpt-4o')}
                  className={`group flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-all duration-200 ${selectedModel === 'openai/gpt-4o'
                    ? 'border border-zinc-100 bg-[#1e2030]/80 text-zinc-100 shadow-[0_0_12px_rgba(99,102,241,0.15)] scale-[1.02]'
                    : 'border border-zinc-800/80 bg-[#141414]/30 text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f1f]/80'
                    }`}
                >
                  <Image
                    src="/chatgpt-logo.png"
                    alt="GPT-5.1"
                    width={16}
                    height={16}
                    className={`w-4 h-4 object-contain shrink-0 ${selectedModel === 'openai/gpt-4o' ? 'opacity-100' : 'opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all'}`}
                  />
                  <span>GPT-5.1</span>
                </button>

                {/* Pill 3: Claude 4.6 Sonnet Thinking */}
                <button
                  onClick={() => handleModelSelect('anthropic/claude-3-5-sonnet-20241022')}
                  className={`group flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-all duration-200 ${selectedModel === 'anthropic/claude-3-5-sonnet-20241022'
                    ? 'border border-zinc-100 bg-[#1e2030]/80 text-zinc-100 shadow-[0_0_12px_rgba(99,102,241,0.15)] scale-[1.02]'
                    : 'border border-zinc-800/80 bg-[#141414]/30 text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f1f]/80'
                    }`}
                >
                  <Image
                    src="/claude-logo.png"
                    alt="Claude"
                    width={16}
                    height={16}
                    className={`w-4 h-4 object-contain shrink-0 ${selectedModel === 'anthropic/claude-3-5-sonnet-20241022' ? 'opacity-100' : 'opacity-60 group-hover:opacity-100 transition-all'}`}
                  />
                  <span>Claude 4.6 Sonnet Thinking</span>
                </button>

                {/* Pill 4: Ver todos os modelos */}
                <button
                  onClick={() => setIsModelsDialogOpen(true)}
                  className={`group flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-all duration-200 ${!['screen-ai-1.2', 'openai/gpt-4o', 'anthropic/claude-3-5-sonnet-20241022'].includes(selectedModel)
                    ? 'border border-zinc-100 bg-[#1e2030]/80 text-zinc-100 shadow-[0_0_12px_rgba(99,102,241,0.15)] scale-[1.02]'
                    : 'border border-zinc-800/80 bg-[#141414]/30 text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f1f]/80'
                    }`}
                >
                  <span>
                    {!['screen-ai-1.2', 'openai/gpt-4o', 'anthropic/claude-3-5-sonnet-20241022'].includes(selectedModel)
                      ? AI_MODELS.find(m => m.id === selectedModel)?.label || (language === 'pt-BR' ? 'Ver todos os modelos' : 'View all models')
                      : (language === 'pt-BR' ? 'Ver todos os modelos' : 'View all models')}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-zinc-400 group-hover:text-zinc-200 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </>
          )}
          <div id="tour-input-bar" className="pointer-events-auto bg-[#1e1e1e] border border-zinc-800/80 rounded-[32px] p-2 shadow-2xl relative flex flex-col gap-2">
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

            {/* CAIXA DE TEXTO MULTI-LINHA COM LAYOUT DO MOCKUP (TEXTAREA ACIMA, BOTÕES ABAIXO) */}
            <div className="flex flex-col gap-2.5 bg-[#121212] rounded-[24px] p-3 pr-2.5">

              {/* Textarea Area */}
              <div className="w-full flex items-start">
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
                  placeholder={placeholderText}
                  rows={1}
                  className="placeholder-ellipsis w-full bg-transparent border-none focus:outline-none focus:ring-0 text-zinc-200 placeholder:text-zinc-500 text-[15px] resize-none py-1.5 max-h-[200px] overflow-y-auto custom-scrollbar"
                  style={{ minHeight: '36px' }}
                />
              </div>

            </div>

            {/* Bottom Row: Pills (Left) and Action Buttons (Right) - POSICIONADOS NA PARTE CINZA */}
            <div className="flex items-center justify-between w-full px-2 py-1">
              {/* Left Side: Pills */}
              <div className="flex items-center gap-2">
                {/* Plus Attachment Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      id="tour-attachment-btn"
                      className="flex items-center gap-1 bg-[#121212] hover:bg-zinc-850 border border-zinc-800 rounded-full px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-200 transition-colors shadow-sm select-none cursor-pointer font-semibold text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{language === 'pt-BR' ? 'Adicionar' : 'Add'}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent container={floatingState !== 'none' && pipWindow ? pipWindow.document.body : undefined} align="start" sideOffset={12} className="w-64 bg-[#1a1a1a] border-zinc-800 text-zinc-200 p-1.5 rounded-xl shadow-2xl z-[100]">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="flex items-center justify-start gap-3 py-3 px-3 focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg transition-colors group">
                      <FileUp className="w-5 h-5 shrink-0 text-zinc-400 group-hover:text-zinc-300" />
                      <span className="font-medium text-[14px]">{t('app.send_file')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* AI Model Selector Button (Only visible if NOT empty chat) */}
                {!isEmptyChat && (
                  <button
                    onClick={() => setIsModelsDialogOpen(true)}
                    className="flex items-center gap-1.5 bg-[#121212] hover:bg-zinc-850 border border-zinc-800 rounded-full pl-1.5 pr-2.5 py-1 text-xs text-zinc-300 hover:text-zinc-200 transition-colors shadow-sm select-none cursor-pointer"
                  >
                    <InputModelIcon id={selectedModel} />
                    <span className="font-semibold text-[11px] leading-none">
                      {modelDescriptions[selectedModel]?.title || AI_MODELS.find(m => m.id === selectedModel)?.label || 'ScreenAI'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                )}
              </div>

              {/* Right Side: Action Buttons */}
              <div className="flex items-center gap-1.5 pr-1">
                <Button
                  id="tour-continuous-mic"
                  size="icon"
                  onClick={toggleGeminiLive}
                  title={language === 'pt-BR' ? "Iniciar Gemini Live (Voz + Visão)" : "Start Gemini Live (Voice + Vision)"}
                  className="rounded-full w-9 h-9 transition-all bg-transparent text-zinc-400 hover:bg-zinc-800/80"
                >
                  <AudioLines className="w-4.5 h-4.5" />
                </Button>
                <Button id="tour-mic-btn" size="icon" onClick={isVoiceActive ? handleSend : startRecording} className={`rounded-full w-9 h-9 transition-all ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-zinc-400 hover:bg-zinc-800/80'}`}>
                  <Mic className="w-4.5 h-4.5" />
                </Button>
                <Button size="icon" onClick={handleSend} disabled={!inputValue.trim() && !isScreenShared && !isVoiceActive && !selectedFile} className="rounded-full bg-zinc-200 text-zinc-900 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 w-9 h-9 transition-colors">
                  <Navigation className="w-4.5 h-4.5" />
                </Button>
              </div>
            </div>

            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,application/pdf,audio/*" />
          </div>
        </div>
      )}
    </div>
  )
}
