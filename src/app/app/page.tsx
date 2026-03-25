"use client"

import { useState, useEffect, useRef } from 'react'
import { useI18n } from '@/context/i18n-context'
import { useWebsocket } from '@/hooks/use-websocket'
import { useGeminiVoice } from '@/hooks/use-gemini-voice'
import { useScreenShare } from '@/hooks/use-screen-share'
import { useAuth } from '@/hooks/use-auth'
import { useConversations } from '@/hooks/use-conversations'
import { useChatStore } from '@/hooks/use-chat-store' // NOVO IMPORT
import { LoginPromptDialog } from '@/components/login-prompt-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Mic, Navigation, MonitorUp, Eye, MessageSquare, Copy, Check, Zap } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8 rounded-lg text-zinc-500 hover:text-zinc-300 transition-all">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  )
}

export default function ChatPage() {
  const { t } = useI18n()
  const [inputValue, setInputValue] = useState('')
  const [voiceMode, setVoiceMode] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const { messages, sendMessage, isStreaming } = useWebsocket()
  const { credits } = useChatStore() // PUXANDO OS CRÉDITOS
  
  const { isRecording: isVoiceActive, startRecording, stopRecording } = useGeminiVoice(5, 1500)
  // Assumindo que o seu hook de ScreenShare devolve um 'videoRef' para capturarmos o ecrã
  const { isSharing: isScreenShared, startSharing, stopSharing, videoRef } = useScreenShare(3000) 
  
  const { isLoggedIn } = useAuth()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll automático mantido
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages.length])

  const requireAuth = (action: () => void) => {
    if (!isLoggedIn) setShowLoginPrompt(true)
    else action()
  }

  // Captura um frame do vídeo partilhado e converte em Base64 para a IA ver
  const captureScreenFrame = (): string | undefined => {
    if (!isScreenShared || !videoRef?.current) return undefined;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      // Exporta em JPEG de qualidade média para ser leve no WebSocket
      return canvas.toDataURL("image/jpeg", 0.7); 
    }
    return undefined;
  }

  const handleSend = () => {
    requireAuth(() => {
      if (!inputValue.trim() && !isScreenShared && !isVoiceActive) return
      
      // Monta o Payload Multimodal Oficial da API
      const payload = {
        text: inputValue.trim() || undefined,
        image_base64: captureScreenFrame() // Captura a tela atual se estiver partilhando
        // audio_base64: viria do seu hook de voz se implementado
      }
      
      sendMessage(payload)
      setInputValue('')
    })
  }

  return (
    <div className="flex flex-col h-full w-full relative pt-4 pb-0 overflow-hidden">
      <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />

      {/* PAINEL DE CRÉDITOS NO TOPO (Mágica Visual) */}
      <div className="absolute top-4 right-4 z-50 bg-[#1e1e1e] border border-zinc-800 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
        <Zap className={`w-4 h-4 ${credits !== null && credits < 20 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} />
        <span className="text-sm font-bold text-zinc-200">
          {credits !== null ? `${credits} Créditos` : 'Verificando...'}
        </span>
      </div>

      {/* Dynamic Screen Preview Region */}
      {isScreenShared && (
        <div className="absolute top-4 left-4 z-10 hidden lg:block">
          <div className="w-64 h-36 bg-[#1a1a1a] rounded-xl overflow-hidden flex items-center justify-center">
             {/* Importante: O vídeo precisa estar aqui para o captureScreenFrame funcionar */}
             <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Main Chat Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-24 lg:px-64 pt-16 pb-32 flex flex-col gap-8 custom-scrollbar relative">
        {/* ... (O seu Empty State da Eye Icon continua igualzinho aqui) ... */}

        {messages.map((m, index) => (
          <div key={m.id} data-role={m.role} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-5 py-4 flex flex-col gap-2 
              ${m.role === 'user' ? 'bg-[#2a2a2a] text-zinc-100' : 
                m.role === 'system' ? 'bg-red-500/10 border border-red-500/50 text-red-200' : 
                'bg-transparent text-zinc-200'}`}>
              
              <div className="prose prose-invert text-sm max-w-none whitespace-pre-wrap break-words">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start px-5 py-5 items-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          </div>
        )}
        <div className="h-[70vh] shrink-0" />
      </div>

      {/* Input de Baixo (Mantido do seu código, com onClick handleSend) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-20">
         {/* ... (Todo o seu Floating Input Pill continua aqui) ... */}
         <div className="bg-[#1e1e1e] border border-zinc-800/80 rounded-[32px] p-2 flex flex-col gap-2 shadow-2xl">
          <div className="flex items-center gap-2 bg-[#121212] rounded-[24px] p-1.5 pr-2">
            <Button variant="ghost" size="icon" onClick={useScreenShare().startSharing} className="text-zinc-400">
              <MonitorUp className="w-5 h-5" />
            </Button>
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="O que deseja saber?"
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-zinc-200"
            />
            <Button size="icon" onClick={handleSend} disabled={!inputValue.trim() && !isScreenShared} className="rounded-full bg-zinc-300 text-zinc-900 hover:bg-white w-10 h-10 ml-1">
              <Navigation className="w-4 h-4 mr-0.5 mt-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}