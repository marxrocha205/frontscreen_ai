"use client"

import { useState, useEffect, useRef } from 'react'
import { useI18n } from '@/context/i18n-context'
import { useWebsocket } from '@/hooks/use-websocket'
import { useGeminiVoice } from '@/hooks/use-gemini-voice'
import { useScreenShare } from '@/hooks/use-screen-share'
import { useAuth } from '@/hooks/use-auth'
import { useConversations } from '@/hooks/use-conversations'
import { LoginPromptDialog } from '@/components/login-prompt-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Mic, Navigation, MonitorUp, Eye, MessageSquare, Copy, Check, Square, Zap } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useRouter } from 'next/navigation'

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-8 w-8 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  )
}

function OutOfCreditsCard({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="flex justify-start w-full">
      <div className="max-w-sm rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-sm font-semibold text-amber-300">Créditos esgotados</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Você usou todos os seus créditos disponíveis. Faça upgrade para o plano Pro e continue conversando sem limites.
        </p>
        <Button
          onClick={onUpgrade}
          className="w-full h-9 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-xs rounded-xl transition-all"
        >
          <Zap className="w-3.5 h-3.5 mr-1.5" />
          Fazer Upgrade
        </Button>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { t } = useI18n()
  const [inputValue, setInputValue] = useState('')
  const [voiceMode, setVoiceMode] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const router = useRouter()

  const { messages, sendMessage, stopMessage, isStreaming } = useWebsocket()
  const { isRecording: isVoiceActive, startRecording, stopRecording } = useGeminiVoice(5, 1500)
  const { isSharing: isScreenShared, startSharing, stopSharing } = useScreenShare(3000)
  const { isLoggedIn } = useAuth()
  const { addConversation } = useConversations()
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToLastUserMessage = () => {
    const container = scrollRef.current
    if (!container) return
    const userMessages = container.querySelectorAll('[data-role="user"]')
    if (userMessages.length > 0) {
      const lastUser = userMessages[userMessages.length - 1] as HTMLElement
      const scrollTarget = lastUser.offsetTop - 20
      container.scrollTo({ top: scrollTarget, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      const timer = setTimeout(scrollToLastUserMessage, 100)
      return () => clearTimeout(timer)
    }
  }, [messages.length])

  const requireAuth = (action: () => void) => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true)
    } else {
      action()
    }
  }

  const handleVoiceToggle = (checked: boolean) => {
    requireAuth(() => {
      setVoiceMode(checked)
      if (checked) {
        startRecording()
      } else {
        stopRecording()
      }
    })
  }

  const handleScreenShareToggle = () => {
    requireAuth(() => {
      if (isScreenShared) stopSharing()
      else startSharing()
    })
  }

  const handleSend = () => {
    requireAuth(() => {
      if (!inputValue.trim()) return
      if (messages.length === 0) {
        addConversation(inputValue.length > 30 ? inputValue.substring(0, 30) + '...' : inputValue)
      }
      sendMessage(inputValue)
      setInputValue('')
    })
  }

  const lastUserMsgIndex = messages.reduce((acc, m, i) => m.role === 'user' ? i : acc, -1)

  return (
    <div className="flex flex-col h-full w-full relative pt-4 pb-0 overflow-hidden">
      <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />

      {/* Dynamic Screen Preview Region */}
      {isScreenShared && (
        <div className="absolute top-4 left-4 z-10 hidden lg:block">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold tracking-tight text-white/50">
            {t('app.preview_screen')}
            {isScreenShared && <span className="flex items-center gap-1 text-[10px] uppercase text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> {t('app.recording')}</span>}
          </div>
          <div className={`w-64 h-36 bg-[#1a1a1a] rounded-xl border border-zinc-800/60 overflow-hidden flex items-center justify-center transition-all cursor-pointer ${isScreenShared ? 'ring-1 ring-zinc-700/50' : ''}`} onClick={handleScreenShareToggle}>
            {isScreenShared ? (
              <div className="w-full h-full bg-zinc-800/20 relative flex flex-col items-center justify-center">
                <MonitorUp className="w-8 h-8 text-zinc-600/50 mb-2" />
                <span className="text-[10px] text-zinc-500 text-center">{t('app.capturing')}</span>
              </div>
            ) : (
              <MonitorUp className="w-8 h-8 text-zinc-600" />
            )}
          </div>
        </div>
      )}

      {/* Main Chat Feed */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto px-4 md:px-24 lg:px-64 pt-16 pb-32 flex flex-col gap-8 custom-scrollbar relative"
        style={{
          maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
        }}
      >
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 gap-4 mt-20">
            <Eye className="w-12 h-12 text-zinc-800" />
            <p className="max-w-[300px] text-zinc-400 mb-2">Your AI assistant is ready. Share your screen or start typing to begin.</p>

            <Button onClick={handleScreenShareToggle} variant="outline" className="bg-[#1a1a1a] border-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-800 h-10 gap-2 rounded-xl">
              <MonitorUp className="w-4 h-4" />
              {t('app.share_screen')}
            </Button>
          </div>
        )}

        {messages.map((m, index) => {
          if (m.role === 'assistant' && m.isError && m.errorType === 'out_of_credits') {
            return <OutOfCreditsCard key={m.id} onUpgrade={() => router.push('/pricing')} />
          }
          return (
            <div key={m.id} data-role={m.role} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'} min-w-0`}>
              <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-5 py-4 flex flex-col gap-2 ${m.role === 'user' ? 'bg-[#2a2a2a] text-zinc-100 rounded-tr-sm' : 'bg-transparent text-zinc-200'} min-w-0 overflow-hidden`}>
                <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#111] prose-pre:border prose-pre:border-zinc-800 text-sm max-w-none whitespace-pre-wrap [word-break:break-word] break-words">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
                {m.role === 'assistant' && m.content.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <CopyButton content={m.content} />
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {isStreaming && (messages.length === 0 || messages[messages.length - 1].role !== 'assistant' || messages[messages.length - 1].content.length === 0) && (
          <div className="flex justify-start">
            <div className="px-5 py-5 flex items-center">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            </div>
          </div>
        )}

        {/* Spacer to allow the last user message to scroll to the top */}
        {messages.length > 0 && <div className="h-[70vh] shrink-0" />}
      </div>
      
      {/* Bottom Blur/Fade Overlay - Refined */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-10 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black,transparent_70%)]" 
      />

      {/* Floating Input Pill */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-20">
        <div className="bg-[#1e1e1e] border border-zinc-800/80 rounded-[32px] p-2 flex flex-col gap-2 shadow-2xl">

          <div className="flex items-center justify-between px-4 pt-1">
            <div className="flex items-center gap-2">
              <Switch checked={voiceMode} onCheckedChange={handleVoiceToggle} className="scale-75 origin-left" />
              <span className="text-xs font-medium text-zinc-400">{t('app.voice_conversation')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#121212] rounded-[24px] p-1.5 pr-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleScreenShareToggle}
              className={`rounded-full hover:bg-zinc-800 shrink-0 h-10 w-10 ${isScreenShared ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 bg-zinc-800/50'}`}
            >
              <MonitorUp className="w-[18px] h-[18px]" />
            </Button>

            <Input
              id="chat-input"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !isStreaming) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={t('app.type_message')}
              disabled={isStreaming}
              className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-zinc-200 placeholder:text-zinc-500 h-10 px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            />

            {!voiceMode && (
              <Button size="icon" variant="ghost" disabled={isStreaming} className="rounded-full text-zinc-400 hover:text-white shrink-0 hover:bg-zinc-800 w-10 h-10 disabled:opacity-50">
                <Mic className="w-4 h-4" />
              </Button>
            )}

            {isStreaming ? (
              <Button
                size="icon"
                onClick={stopMessage}
                className="rounded-full bg-zinc-300 text-zinc-900 hover:bg-white shrink-0 w-10 h-10 ml-1"
              >
                <Square className="w-4 h-4 fill-zinc-900" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="rounded-full bg-zinc-300 text-zinc-900 hover:bg-white shrink-0 w-10 h-10 ml-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Navigation className="w-4 h-4 mr-0.5 mt-0.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="text-center mt-4 text-[10px] text-zinc-500">
          {t('app.disclaimer')}
        </div>

      </div>
    </div>
  )
}
