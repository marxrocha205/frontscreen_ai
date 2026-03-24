"use client"

import { ReactNode } from 'react'
import { Plus, MessageSquare, Settings as SettingsIcon, HelpCircle, Trash2, Sparkles, FileText, Search, MonitorUp, X, ChevronDown, Check, PanelLeftClose, PanelLeftOpen, PanelLeft } from 'lucide-react'
import { useI18n } from '@/context/i18n-context'
import { SettingsDialog } from '@/components/settings-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useConversations } from '@/hooks/use-conversations'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { LoginPromptDialog } from '@/components/login-prompt-dialog'
import { useChatStore, AI_MODELS } from '@/hooks/use-chat-store'

export default function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const { isLoggedIn, user, logout } = useAuth()
  const { conversations, removeConversation, addConversation } = useConversations()
  const { messages, clearMessages, selectedModel, setSelectedModel } = useChatStore()
  const router = useRouter()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false) // Default to false for mobile SSR

  useEffect(() => {
    // Set initial state based on window width
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    
    // Run once on mount
    handleResize()
    
    // Try to keep it responsive if user resizes window significantly
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleNewChat = () => {
    clearMessages()
    router.push('/app')
  }

  const handleAuthAction = (action: () => void) => {
    if (isLoggedIn) {
      action()
    } else {
      setShowLoginPrompt(true)
    }
  }

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden relative">
      {!isLoggedIn && (
        <div className="absolute top-4 right-5 z-40 flex items-center gap-2">
          <Button onClick={() => router.push('/login')} variant="ghost" className="rounded-[20px] bg-white text-zinc-900 hover:bg-zinc-200 hover:text-black h-10 px-5 font-semibold text-sm shadow-sm">
            Log in
          </Button>
          <Button onClick={() => router.push('/login')} className="hidden sm:inline-flex rounded-[20px] bg-[#1a1a1a] text-white hover:bg-zinc-800 h-10 px-5 font-semibold border border-zinc-700/50 text-sm">
            Sign up for free
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="outline" size="icon" className="rounded-full bg-transparent border-none w-10 h-10 text-zinc-400 hover:bg-transparent hover:text-white data-[state=open]:text-white outline-none ring-0 focus-visible:ring-0">
                <HelpCircle className="w-6 h-6" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-64 bg-[#232323] border-zinc-800 text-zinc-200 p-1.5 rounded-xl shadow-2xl overflow-hidden z-[100]">
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="gap-3 py-3 px-3 focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg transition-colors group">
                <Sparkles className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                <span className="font-medium">See plans and pricing</span>
              </DropdownMenuItem>

              <SettingsDialog trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-3 py-3 px-3 focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg transition-colors group">
                  <SettingsIcon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                  <span className="font-medium">Settings</span>
                </DropdownMenuItem>
              } />

              <DropdownMenuSeparator className="bg-zinc-800/50 my-1.5 mx-1" />

              <DropdownMenuItem onClick={() => router.push('/privacy')} className="gap-3 py-3 px-3 focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg transition-colors group">
                <FileText className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                <span className="font-medium">Terms & policies</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Floating Animated Toggle Button */}
      <div 
        className={`absolute top-[12px] z-[60] flex items-center justify-center transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'left-[204px]' : 'left-[12px]'
        }`}
      >
        <Button
          variant="ghost"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`h-14 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 group relative overflow-hidden transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-10 p-0' : 'w-auto px-1'
          }`}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {/* Logo (Visible when closed) */}
          <div className={`flex items-center justify-center transition-all duration-300 ${
            sidebarOpen ? 'opacity-0 scale-50 absolute' : 'opacity-100 scale-100 group-hover:opacity-0'
          }`}>
             <Image
                src="/logobranco-semfundo.png"
                alt="Screen AI Logo"
                width={180}
                height={56}
                className="h-10 md:h-12 lg:h-14 w-auto object-contain"
                priority
              />
          </div>

          {/* Icon (Close when open, Open when closed & hovered) */}
          <div className={`flex items-center justify-center transition-all duration-300 ${
            sidebarOpen 
              ? 'opacity-100 rotate-0' 
              : 'opacity-0 group-hover:opacity-100 -rotate-90 absolute inset-0'
          }`}>
            {sidebarOpen ? <PanelLeftClose className="w-[22px] h-[22px]" /> : <PanelLeftOpen className="w-[26px] h-[26px]" />}
          </div>
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`absolute lg:relative z-50 lg:z-auto h-full border-r border-zinc-800/60 bg-[#0f0f0f] flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden ${sidebarOpen ? 'w-64' : 'w-0 border-r-0'
          }`}
      >
        <div className="p-3 flex items-center justify-between h-[80px]">
          <div className={`flex items-center pl-1 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            <Image
              src="/logobranco-semfundo.png"
              alt="Screen AI Logo"
              width={180}
              height={56}
              className="h-10 md:h-12 lg:h-14 w-auto object-contain"
              priority
            />
          </div>
          {/* Invisible spacer to keep flex layout intact */}
          <div className="w-10 h-10 pointer-events-none" />
        </div>
        <div className="px-3 pb-3 flex flex-col gap-2">
          <Button
            variant="ghost"
            onClick={handleNewChat}
            className="w-full justify-start gap-2 h-10 px-3 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white rounded-lg border border-zinc-800/80"
          >
            <Plus className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium">{t('app.new_chat')}</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleAuthAction(() => { })}
            className="w-full justify-start gap-2 h-10 px-3 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white rounded-lg border border-zinc-800/80 text-zinc-400 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">{t('app.search_chat')}</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleAuthAction(() => { })}
            className="w-full justify-start gap-2 h-10 px-3 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white rounded-lg border border-zinc-800/80 text-zinc-400 transition-colors"
          >
            <MonitorUp className="w-4 h-4" />
            <span className="text-sm font-medium">{t('app.share_screen')}</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto mt-2 px-3 pb-4">
          {conversations.length > 0 && (
            <div className="px-3 py-2 mb-1">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Suas conversas</span>
            </div>
          )}
          {/* History List */}
          <div className="space-y-[2px]">
            {conversations.map((item) => (
              <div key={item.id} className="w-full relative flex items-center group">
                <button
                  onClick={() => clearMessages()}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white rounded-lg transition-colors pr-10"
                >
                  <MessageSquare className="w-4 h-4 shrink-0 text-zinc-500 group-hover:text-zinc-400" />
                  <span className="truncate flex-1">{item.title}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeConversation(item.id); }}
                  className="absolute right-2 p-1.5 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-zinc-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-zinc-800/60 flex flex-col gap-4">
          {!isLoggedIn && (
            <div className="px-1 py-2 flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-zinc-100 leading-tight">
                  Receba respostas personalizadas para você
                </span>
                <p className="text-[13px] text-zinc-500 leading-normal">
                  Entre para receber respostas com base em chats salvos, além de criar imagens e carregar arquivos.
                </p>
              </div>
              <Button 
                onClick={() => router.push('/login')} 
                className="w-full h-10 bg-zinc-800/50 hover:bg-zinc-800 text-white rounded-[20px] border border-zinc-700/30 font-semibold text-sm transition-all mt-1"
              >
                Entrar
              </Button>
            </div>
          )}

          <SettingsDialog trigger={
            <Button variant="ghost" className="w-full justify-start gap-2.5 h-12 px-3 hover:bg-zinc-800/50 rounded-lg group">
              <SettingsIcon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-300" />
              <span className="text-sm">{t('app.settings')}</span>
            </Button>
          } />

          {isLoggedIn && (
            <SettingsDialog
              defaultTab="account"
              trigger={
                <Button variant="ghost" className="w-full justify-start gap-3 h-14 px-3 hover:bg-zinc-800/50 rounded-lg group">
                  <Avatar className="h-8 w-8 bg-zinc-800 text-xs">
                    <AvatarFallback className="bg-zinc-800 text-zinc-300 font-medium">
                      {user?.email?.substring(0, 2).toUpperCase() || 'US'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-sm font-medium text-zinc-200 truncate w-32 text-left">{user?.email || 'User'}</span>
                    <span className="text-xs text-zinc-500">{t('app.free_plan')}</span>
                  </div>
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full bg-zinc-950">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between pr-4 pl-[20px] pt-3 h-[80px] pointer-events-none">
          {/* Empty space where the floating toggle button will go */}
          <div className="w-auto h-10 relative flex items-center justify-center">
            {/* The actual button is rendered outside context to float freely */}
          </div>

          {/* AI Model selector */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button
                variant="ghost"
                className="pointer-events-auto flex items-center gap-1.5 h-9 px-3 rounded-xl text-zinc-200 hover:bg-zinc-800/60 font-semibold text-sm transition-all"
              >
                {selectedModel.label}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </Button>
            } />
            <DropdownMenuContent
              align="center"
              className="w-56 bg-[#232323] border-zinc-800 text-zinc-200 p-1.5 rounded-xl shadow-2xl overflow-hidden z-[100] pointer-events-auto"
            >
              {AI_MODELS.map(model => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => handleAuthAction(() => setSelectedModel(model))}
                  className="gap-3 py-2.5 px-3 focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg transition-colors group"
                >
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-sm">{model.label}</span>
                    {model.badge && (
                      <span className="text-[10px] text-indigo-400 font-medium mt-0.5">{model.badge}</span>
                    )}
                  </div>
                  {selectedModel.id === model.id && (
                    <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Right spacer to balance layout */}
          <div className="w-9" />
        </div>

        {children}
      </div>

      <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />
    </div>
  )
}
