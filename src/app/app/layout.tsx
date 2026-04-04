"use client"

import { ReactNode } from 'react'
import { Plus, MessageSquare, Settings as SettingsIcon, HelpCircle, Trash2, Sparkles, FileText, Search, MonitorUp, X, ChevronDown, Check, PanelLeftClose, PanelLeftOpen, PictureInPicture2, Pencil } from 'lucide-react'
import { useI18n } from '@/context/i18n-context'
import { SettingsDialog } from '@/components/settings-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useConversations } from '@/hooks/use-conversations'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { LoginPromptDialog } from '@/components/login-prompt-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useChatStore, AI_MODELS } from '@/hooks/use-chat-store'
import { useFloatingChat } from '@/hooks/use-floating-chat'
import { useScreenShare } from '@/hooks/use-screen-share'

export default function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const { isLoggedIn, user, logout } = useAuth()
  
  // A MÁGICA REAL AQUI: Desestruturamos as funções reais do banco de dados
  const { conversations, fetchConversations, loadConversation, deleteConversation, renameConversation, activeId, isLoading, createNewConversation } = useConversations()
  
  // Puxamos o floatingState para saber qual label / cor mostrar no botão
  const { messages, clearMessages, selectedModel, setSelectedModel, floatingState } = useChatStore()
  const { openChat } = useFloatingChat()
  const { isSharing: isScreenShared, startSharing, stopSharing } = useScreenShare()
  
  const router = useRouter()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showMobileWarning, setShowMobileWarning] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const currentModel = AI_MODELS.find(m => m.id === selectedModel)

  // Dispara a busca do histórico no banco de dados assim que a tela abre
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleNewChat = () => {
    createNewConversation?.() // Limpa o ID ativo no Store de Conversas
    clearMessages()           // Limpa a tela
    router.push('/app')
  }

  const handleAuthAction = (action: () => void) => {
    if (isLoggedIn) {
      action()
    } else {
      setShowLoginPrompt(true)
    }
  }

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

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const startEditing = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation()
    setEditingId(id)
    setEditingTitle(currentTitle)
  }

  const handleRenameSubmit = async (id: string) => {
    if (editingTitle.trim() && editingTitle.trim() !== conversations.find(c => c.id === id)?.title) {
      await renameConversation(id, editingTitle.trim())
    }
    setEditingId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(id)
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden relative">
      {!isLoggedIn && (
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
          <Button onClick={() => router.push('/login')} variant="ghost" className="rounded-[20px] bg-white text-zinc-900 hover:bg-zinc-200 hover:text-black h-10 px-4 sm:px-5 font-semibold text-sm shadow-sm">
            Log in
          </Button>
          <Button onClick={() => router.push('/login')} className="hidden sm:inline-flex rounded-[20px] bg-[#1a1a1a] text-white hover:bg-zinc-800 h-10 px-5 font-semibold border border-zinc-700/50 text-sm">
            Sign up for free
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="hidden sm:inline-flex rounded-full bg-transparent border-none w-10 h-10 text-zinc-400 hover:bg-transparent hover:text-white data-[state=open]:text-white outline-none ring-0 focus-visible:ring-0">
                <HelpCircle className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-[#232323] border-zinc-800 text-zinc-200 p-1.5 rounded-xl shadow-2xl overflow-hidden z-[100]">
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="gap-3 py-3 px-3 focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg transition-colors group">
                <Sparkles className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                <span className="font-medium">See plans and pricing</span>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <SettingsDialog
                trigger = {
                <div className="gap-3 py-3 px-3 focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg transition-colors group">
                  <SettingsIcon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                  <span className="font-medium">Settings</span>
                </div>
                }
                />
             </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-zinc-800/50 my-1.5 mx-1" />

              <DropdownMenuItem onClick={() => router.push('/privacy')} className="gap-3 py-3 px-3 focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg transition-colors group">
                <FileText className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                <span className="font-medium">Terms & policies</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div 
        className={`absolute top-4 z-[60] flex items-center justify-center transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'left-[204px]' : 'left-4'
        }`}
      >
        <Button
          variant="ghost"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`h-10 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 group relative overflow-hidden transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-10 p-0' : 'w-auto px-1'
          }`}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <div className={`flex items-center justify-center transition-all duration-300 ${
            sidebarOpen ? 'opacity-0 scale-50 absolute' : 'opacity-100 scale-100 group-hover:opacity-0'
          }`}>
             <Image
                src="/logobranco-semfundo.png"
                alt="Screen AI Logo"
                width={180}
                height={40}
                className="h-8 md:h-9 w-auto object-contain"
                priority
              />
          </div>
          <div className={`flex items-center justify-center transition-all duration-300 ${
            sidebarOpen 
              ? 'opacity-100 rotate-0' 
              : 'opacity-0 group-hover:opacity-100 -rotate-90 absolute inset-0'
          }`}>
            {sidebarOpen ? <PanelLeftClose className="w-[22px] h-[22px]" /> : <PanelLeftOpen className="w-[26px] h-[26px]" />}
          </div>
        </Button>
      </div>

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
          <div className="w-10 h-10 pointer-events-none" />
        </div>
        
        <div className="px-3 pb-3 flex flex-col gap-2">
          <Button
            variant="ghost"
            onClick={() => handleAuthAction(handleNewChat)}
            className="w-full justify-start gap-2 h-10 px-3 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white rounded-lg border border-zinc-800/80"
          >
            <Plus className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium">{t('app.new_chat')}</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleAuthAction(() => setIsSearchOpen(!isSearchOpen))}
            className="w-full justify-start gap-2 h-10 px-3 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white rounded-lg border border-zinc-800/80 text-zinc-400 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">{t('app.search_chat')}</span>
          </Button>

          {isSearchOpen && (
            <div className="px-1 animate-in slide-in-from-top-2 fade-in duration-200 block">
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversa..."
                className="h-9 bg-zinc-900 border-zinc-800 text-sm text-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-700"
              />
            </div>
          )}

          <Button
            variant="ghost"
            onClick={() => handleAuthAction(() => { isScreenShared ? stopSharing() : handleStartSharing() })}
            className={`w-full justify-start gap-2 h-10 px-3 rounded-lg border border-zinc-800/80 transition-colors ${
              isScreenShared 
                ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' 
                : 'bg-zinc-900/50 hover:bg-zinc-800 hover:text-white text-zinc-400'
            }`}
          >
            <MonitorUp className="w-4 h-4" />
            <span className="text-sm font-medium">{isScreenShared ? t('app.stop_sharing') : t('app.share_screen')}</span>
          </Button>
          
          {/* Botão de Destacar Chat (PiP / Popup) */}
          <Button
            variant="ghost"
            onClick={() => handleAuthAction(openChat)}
            className={`w-full justify-start gap-2 h-10 px-3 rounded-lg border border-zinc-800/80 transition-colors ${
              floatingState !== 'none'
                ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
                : 'bg-zinc-900/50 hover:bg-zinc-800 hover:text-white text-zinc-400'
            }`}
          >
            <PictureInPicture2 className={`w-4 h-4 ${floatingState !== 'none' ? 'text-blue-400' : ''}`} />
            <span className="text-sm font-medium">
              {floatingState === 'none' && 'Destacar Chat (PiP)'}
              {floatingState === 'pip' && 'Restaurar (PiP Nativo)'}
              {floatingState === 'popup' && 'Restaurar (Popup)'}
            </span>
          </Button>

        </div>

        <div className="flex-1 overflow-y-auto mt-2 px-3 pb-4">
          <div className="px-3 py-2 mb-1">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Suas conversas</span>
          </div>
          
          <div className="space-y-[2px]">
            {isLoading ? (
               <div className="text-zinc-600 text-sm px-3 mt-2 animate-pulse">A carregar...</div>
            ) : filteredConversations.length === 0 ? (
               <div className="text-zinc-600 text-[13px] px-3 mt-2">
                 {searchQuery ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa ainda.'}
               </div>
            ) : (
              filteredConversations.map((item) => (
                <div key={item.id} className="w-full relative flex items-center group">
                  <button
                    onClick={() => loadConversation(item.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors pr-16 ${
                      activeId === item.id ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                    }`}
                  >
                    <MessageSquare className={`w-4 h-4 shrink-0 ${(activeId === item.id && editingId !== item.id) ? 'text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-400'}`} />
                    
                    {editingId === item.id ? (
                      <Input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleRenameSubmit(item.id)}
                        onKeyDown={(e) => handleKeyDown(e, item.id)}
                        onClick={(e) => e.stopPropagation()}
                        maxLength={30}
                        className="h-6 px-1.5 py-0 bg-zinc-900 border-zinc-700 text-sm text-zinc-200 focus-visible:ring-1 focus-visible:ring-indigo-500 flex-1 min-w-0"
                      />
                    ) : (
                      <span className="truncate flex-1">{item.title}</span>
                    )}
                  </button>
                  <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    <button
                      onClick={(e) => startEditing(e, item.id, item.title)}
                      className="p-1.5 text-zinc-500 hover:text-blue-400 rounded-md hover:bg-zinc-800/80 transition-colors"
                      title="Renomear"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteConversation(item.id); }}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded-md hover:bg-zinc-800/80 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

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

          {isLoggedIn ? (
            <SettingsDialog trigger={
              <Button variant="ghost" className="w-full justify-start gap-2.5 h-12 px-3 hover:bg-zinc-800/50 rounded-lg group">
                <SettingsIcon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-300" />
                <span className="text-sm">{t('app.settings')}</span>
              </Button>
            } />
          ) : (
            <Button
              variant="ghost"
              onClick={() => handleAuthAction(() => {})}
              className="w-full justify-start gap-2.5 h-12 px-3 hover:bg-zinc-800/50 rounded-lg group"
            >
              <SettingsIcon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-300" />
              <span className="text-sm">{t('app.settings')}</span>
            </Button>
          )}

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

      <div className="flex-1 flex flex-col relative h-full bg-zinc-950">
        <div className="absolute top-4 left-0 right-0 z-30 flex items-center justify-center pointer-events-none h-10">

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="pointer-events-auto flex items-center gap-1.5 h-10 px-3 md:px-4 rounded-xl text-zinc-200 hover:bg-zinc-800/60 font-semibold text-sm transition-all"
              >
                {currentModel?.label}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </Button>
           </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="w-52 bg-zinc-900/95 backdrop-blur-md border-zinc-800 text-zinc-200 p-1 rounded-xl shadow-2xl z-[100] pointer-events-auto"
            >
              {AI_MODELS.map(model => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className="flex items-center justify-between gap-3 py-2 px-3 focus:bg-zinc-800/80 focus:text-white cursor-pointer rounded-lg transition-all duration-200 group"
                >
                  <span className="font-medium text-sm text-zinc-300 group-hover:text-white">{model.label}</span>
                  {selectedModel === model.id && (
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 animate-in fade-in zoom-in duration-200" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {children}
      </div>

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
      <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />
    </div>
  )
}