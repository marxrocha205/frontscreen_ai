"use client"

import { useState, useEffect, useRef } from 'react'
import { useI18n } from '@/context/i18n-context'
import { useWebsocket } from '@/hooks/use-websocket'
import { useGeminiVoice } from '@/hooks/use-gemini-voice'
import { useScreenShare } from '@/hooks/use-screen-share'
import { useAuth } from '@/hooks/use-auth'
import { useChatStore } from '@/hooks/use-chat-store'
import { LoginPromptDialog } from '@/components/login-prompt-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mic, Navigation, MonitorUp, Zap, Check, Copy } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function ChatPage() {
  const { t } = useI18n()
  const [inputValue, setInputValue] = useState('')
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const { messages, sendMessage, isStreaming } = useWebsocket()
  const { credits } = useChatStore()
  
  // CORREÇÃO 1: Verifique se useGeminiVoice aceita parâmetros no arquivo do hook
  const { isRecording: isVoiceActive, startRecording, stopRecording } = useGeminiVoice(5, 1500)
  
  // CORREÇÃO 2: Gerenciamento manual da Ref do Vídeo para maior controle
  const videoRef = useRef<HTMLVideoElement>(null)
  const { isSharing: isScreenShared, startSharing, stopSharing, stream } = useScreenShare() 

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const { isLoggedIn } = useAuth()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages.length])

  const requireAuth = (action: () => void) => {
    if (!isLoggedIn) setShowLoginPrompt(true)
    else action()
  }

  const captureScreenFrame = (): string | undefined => {
    if (!isScreenShared || !videoRef.current) return undefined;
    
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx && canvas.width > 0) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.7); 
      }
    } catch (err) {
      console.error("Erro ao capturar frame:", err);
    }
    return undefined;
  }

  const handleSend = async () => {
    requireAuth(async () => {
      let audioBase64 = undefined;
      if (isVoiceActive) {
        audioBase64 = await stopRecording();
      }

      if (!inputValue.trim() && !isScreenShared && !audioBase64) return
      
      const payload = {
        text: inputValue.trim() || undefined,
        image_base64: captureScreenFrame(),
        audio_base64: audioBase64
      }
      
      sendMessage(payload)
      setInputValue('')
    })
  }

  return (
    <div className="flex flex-col h-full w-full relative pt-4 pb-0 overflow-hidden bg-[#0a0a0a]">
      <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />

      {/* PAINEL DE CRÉDITOS */}
      <div className="absolute top-4 right-4 z-50 bg-[#1e1e1e]/80 backdrop-blur-md border border-zinc-800 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
        <Zap className={`w-4 h-4 ${credits !== null && credits < 20 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} />
        <span className="text-sm font-bold text-zinc-200">
          {credits !== null ? `${credits} Créditos` : '...'}
        </span>
      </div>

      {/* Preview da Tela */}
      {isScreenShared && (
        <div className="absolute top-4 left-4 z-10 hidden lg:block">
          <div className="w-64 h-36 bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
             <video 
               ref={videoRef} 
               autoPlay 
               playsInline 
               muted 
               className="w-full h-full object-cover" 
             />
             <div className="absolute top-2 right-2">
               <span className="bg-red-500 text-[10px] px-2 py-0.5 rounded-full text-white animate-pulse">LIVE</span>
             </div>
          </div>
        </div>
      )}

      {/* Feed do Chat */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-24 lg:px-64 pt-16 pb-40 flex flex-col gap-8 custom-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${m.role === 'user' ? 'bg-zinc-900 border border-zinc-800 text-zinc-100' : 'text-zinc-200'}`}>
              <div className="prose prose-invert text-sm max-w-none">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-start px-5">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Input de Baixo */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-20">
        <div className="bg-[#1e1e1e] border border-zinc-800/80 rounded-[32px] p-2 shadow-2xl">
          <div className="flex items-center gap-2 bg-[#121212] rounded-[24px] p-1.5 pr-2">
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={isScreenShared ? stopSharing : startSharing} 
              className={`rounded-full h-10 w-10 ${isScreenShared ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-400'}`}
            >
              <MonitorUp className="w-5 h-5" />
            </Button>
            
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Pergunte sobre sua tela..."
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-zinc-200 placeholder:text-zinc-600"
            />
            
            <div className="flex items-center gap-1.5">
              <Button 
                size="icon" 
                onClick={isVoiceActive ? handleSend : startRecording} 
                className={`rounded-full w-10 h-10 transition-all ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-zinc-500 hover:bg-zinc-800'}`}
              >
                <Mic className="w-4 h-4" />
              </Button>
              
              <Button 
                size="icon" 
                onClick={handleSend} 
                disabled={!inputValue.trim() && !isScreenShared && !isVoiceActive} 
                className="rounded-full bg-zinc-200 text-zinc-900 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 w-10 h-10"
              >
                <Navigation className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}