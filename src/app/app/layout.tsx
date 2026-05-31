"use client"

import { ReactNode } from 'react'
import { Plus, MessageSquare, Settings as SettingsIcon, HelpCircle, Trash2, Sparkles, FileText, Search, MonitorUp, Laptop, X, ChevronDown, Save, PanelLeftClose, PanelLeftOpen, PictureInPicture2, Pencil, Paintbrush, Video, Check, Loader2 } from 'lucide-react'
import { useI18n } from '@/context/i18n-context'
import { SettingsDialog } from '@/components/settings-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useConversations } from '@/hooks/use-conversations'
import { useRouter, usePathname } from 'next/navigation' // <-- Adicionado usePathname
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { LoginPromptDialog } from '@/components/login-prompt-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useChatStore, AI_MODELS } from '@/hooks/use-chat-store'
import { useFloatingChat } from '@/hooks/use-floating-chat'
import { useScreenShare } from '@/hooks/use-screen-share'
import { UpgradePlanDialog } from '@/components/upgrade-plan-dialog'
import { isMobileDevice } from '@/lib/utils'

const ModelIcon = ({ id }: { id: string }) => {
  switch (id) {
    case 'auto':
      return <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0" />;
    case 'gpt-5':
    case 'gpt-4':
      return <Image src="/chatgpt-logo.png" alt="GPT" width={20} height={20} className="w-5 h-5 object-contain flex-shrink-0" />;
    case 'claude-3-opus':
      return <Image src="/claude-logo.png" alt="Claude" width={20} height={20} className="w-5 h-5 object-contain flex-shrink-0" />;
    case 'gemini-1.5-pro':
    case 'gemini-1.5-flash':
      return <Image src="/gemini-logo.png" alt="Gemini" width={20} height={20} className="w-5 h-5 object-contain flex-shrink-0" />;
    case 'screen-ai-1.2':
    default:
      return <Image src="/screenai-logo.png" alt="Screen AI" width={20} height={20} className="w-5 h-5 object-contain flex-shrink-0" />;
  }
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { t, language } = useI18n()
  const { hasHydrated, isLoggedIn, user, logout, syncFromStorage } = useAuth()

  // A MÁGICA REAL AQUI: Desestruturamos as funções reais do banco de dados
  const { conversations, fetchConversations, loadConversation, deleteConversation, renameConversation, activeId, isLoading, createNewConversation } = useConversations()

  // Puxamos o floatingState para saber qual label / cor mostrar no botão
  const { messages, clearMessages, selectedModel, setSelectedModel, floatingState, userPlan, fetchCredits, isUpgradeDialogOpen, setIsUpgradeDialogOpen, upgradeDialogMessage, setUpgradeDialogMessage, isSidebarOpen, setIsSidebarOpen } = useChatStore()
  const { openChat } = useFloatingChat()
  const { isSharing: isScreenShared, startSharing, stopSharing } = useScreenShare()

  const router = useRouter()
  const pathname = usePathname() // <-- Captura a rota atual
  
  // Verifica se o usuário está na rota do Studio
  const isStudioRoute = pathname?.startsWith('/app/studio')

  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showMobileWarning, setShowMobileWarning] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isStudioSubmenuOpen, setIsStudioSubmenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const currentModel = AI_MODELS.find(m => m.id === selectedModel)
  const [showComingSoon, setShowComingSoon] = useState(false)
  
  const currentPlanLabel = userPlan
    ? (language === 'pt-BR' ? `Plano ${userPlan}` : `${userPlan} Plan`)
    : (language === 'pt-BR' ? 'Carregando plano...' : 'Loading plan...')
  const ADMIN_EMAILS = ['marxrochascr@gmail.com', 'marxrocha.scr@gmail.com', 'admin@frontscreen.ai'] // Substitua pelos e-mails reais
  const isAdmin = Boolean(user?.email && ADMIN_EMAILS.includes(user.email.trim().toLowerCase()))
  
  const handleModelSelect = (model: typeof AI_MODELS[number]) => {
    // Se o modelo requer plano pago e o usuário está no plano Free (ou sem plano), bloqueia
    const isFreeUser = !userPlan || userPlan.toLowerCase() === 'free'
    if (model.requiresPro && isFreeUser) {
      setUpgradeDialogMessage(t('app.model_upgrade_message').replace('{model}', model.label))
      setIsUpgradeDialogOpen(true)
      return
    }
    setSelectedModel(model.id)
  }

  // Dispara a busca do histórico no banco de dados assim que a tela abre
  useEffect(() => {
    syncFromStorage()

    const handleResume = () => {
      syncFromStorage()
      if (useAuth.getState().isLoggedIn) {
        fetchCredits()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncFromStorage()
        if (useAuth.getState().isLoggedIn) {
          fetchCredits()
        }
      }
    }

    window.addEventListener('pageshow', handleResume)
    window.addEventListener('focus', handleResume)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pageshow', handleResume)
      window.removeEventListener('focus', handleResume)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [syncFromStorage, fetchCredits])

  useEffect(() => {
    if (isLoggedIn) {
      fetchConversations()
      fetchCredits()
    }
  }, [isLoggedIn, fetchConversations, fetchCredits])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true)
      } else {
        setIsSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleNewChat = () => {
    createNewConversation?.() // Limpa o ID ativo no Store de Conversas
    clearMessages()           // Limpa a tela
    setIsSidebarOpen(false)
    router.push('/app')
  }

  const handleAuthAction = (action: () => void) => {
    if (!hasHydrated) {
      syncFromStorage()
    }

    if (useAuth.getState().isLoggedIn) {
      action()
    } else {
      setShowLoginPrompt(true)
    }
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
    if (isRenaming) return
    if (editingTitle.trim() && editingTitle.trim() !== conversations.find(c => c.id === id)?.title) {
      setIsRenaming(true)
      await renameConversation(id, editingTitle.trim())
      await new Promise(resolve => setTimeout(resolve, 800))
      setIsRenaming(false)
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
    <div className="flex h-[100dvh] w-full bg-zinc-950 text-zinc-100 overflow-hidden relative">
      {hasHydrated && !isLoggedIn && (
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
          <Button onClick={() => router.push('/login')} variant="ghost" className="rounded-[20px] bg-white text-zinc-900 hover:bg-zinc-200 hover:text-black h-10 px-4 sm:px-5 font-semibold text-sm shadow-sm">
            {t('register.login')}
          </Button>
          <Button onClick={() => router.push('/login')} className="hidden sm:inline-flex rounded-[20px] bg-[#1a1a1a] text-white hover:bg-zinc-800 h-10 px-5 font-semibold border border-zinc-700/50 text-sm">
            {t('login.signup')}
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
                <span className="font-medium">{t('help.see_plans')}</span>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <SettingsDialog
                  trigger={
                    <div className="gap-3 py-3 px-3 focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg transition-colors group">
                      <SettingsIcon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                      <span className="font-medium">{t('app.settings')}</span>
                    </div>
                  }
                />
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-zinc-800/50 my-1.5 mx-1" />

              <DropdownMenuItem onClick={() => router.push('/privacy')} className="gap-3 py-3 px-3 focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg transition-colors group">
                <FileText className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                <span className="font-medium">{t('help.terms')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Condição para esconder Overlay e Botões do Sidebar se estiver no Studio */}
      {!isStudioRoute && (
        <>
          {isSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <div
            className={`absolute top-4 z-[60] flex items-center justify-center transition-all duration-300 ease-in-out ${isSidebarOpen ? 'left-[204px]' : 'left-4'
              }`}
          >
            <Button
              variant="ghost"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`h-10 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 group relative overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-10 p-0' : 'w-auto px-1'
                }`}
              title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <div className={`flex items-center justify-center transition-all duration-300 ${isSidebarOpen ? 'opacity-0 scale-50 absolute' : 'opacity-100 scale-100 group-hover:opacity-0'
                }`}>
                <Image
                  src="/logobranco-semfundo.png"
                  alt="Screen AI Logo"
                  width={180}
                  height={40}
                  className="h-15 md:h-15 w-auto object-contain"
                  priority
                />
              </div>
              <div id="tour-sidebar-toggle" className={`flex items-center justify-center transition-all duration-300 ${isSidebarOpen
                ? 'opacity-100 rotate-0'
                : 'opacity-0 group-hover:opacity-100 -rotate-90 absolute inset-0'
                }`}>
                {isSidebarOpen ? <PanelLeftClose className="w-[22px] h-[22px]" /> : <PanelLeftOpen className="w-[26px] h-[26px]" />}
              </div>
            </Button>
          </div>

          <div
            className={`absolute lg:relative z-50 lg:z-auto h-full border-r border-zinc-800/60 bg-[#0f0f0f] flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'w-64' : 'w-0 border-r-0'
              }`}
          >
            <div className="w-64 flex flex-col h-full">
              <div className="p-3 flex items-center justify-between h-[80px]">
                <div className={`flex items-center pl-1 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                  <Image
                    src="/logobranco-semfundo.png"
                    alt="Screen AI Logo"
                    width={180}
                    height={56}
                    className="h-15 md:h-15 lg:h-15 w-auto object-contain"
                    priority
                  />
                </div>
                <div className="w-10 h-10 pointer-events-none" />
              </div>

              <div className="px-3 pb-3 flex flex-col gap-2">
                <Button
                  id="tour-new-chat"
                  variant="ghost"
                  onClick={() => handleAuthAction(handleNewChat)}
                  className="w-full justify-start gap-2 h-10 px-3 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white rounded-lg border border-zinc-800/80"
                >
                  <Plus className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-medium">{t('app.new_chat')}</span>
                </Button>
                <Button
                  id="tour-search-chat"
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
                      placeholder={t('app.search_chat')}
                      className="h-9 bg-zinc-900 border-zinc-800 text-sm text-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-700"
                    />
                  </div>
                )}

                <Button
                  id="tour-studio"
                  variant="ghost"
                  onClick={() => handleAuthAction(() => {
                    if (!isAdmin) {
                      setIsSidebarOpen(false)
                      router.push('/app/studio')
                    } else {
                      setShowComingSoon(true)
                    }
                  })}
                  className="w-full justify-start gap-2 h-10 px-3 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white rounded-lg border border-zinc-800/80 text-zinc-400 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">ScreenAI Studio</span>
                    {!isAdmin && (
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded ml-1">Beta</span>
                    )}
                  </div>
                </Button>

                {isStudioSubmenuOpen && (
                  <div className="ml-4 flex flex-col gap-1 px-1 animate-in slide-in-from-top-2 fade-in duration-200">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsStudioSubmenuOpen(false)
                        setIsSidebarOpen(false)
                        router.push('/app/studio?cat=imagens')
                      }}
                      className="w-full justify-start gap-2 h-9 px-3 rounded-lg border border-zinc-800/80 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white text-sm"
                    >
                      <Paintbrush className="w-4 h-4" />
                      <span>{language === 'pt-BR' ? 'Imagem' : 'Image'}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsStudioSubmenuOpen(false)
                        setIsSidebarOpen(false)
                        router.push('/app/studio?cat=video')
                      }}
                      className="w-full justify-start gap-2 h-9 px-3 rounded-lg border border-zinc-800/80 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white text-sm"
                    >
                      <Video className="w-4 h-4" />
                      <span>{language === 'pt-BR' ? 'Vídeo' : 'Video'}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsStudioSubmenuOpen(false)
                        setIsSidebarOpen(false)
                        router.push('/app/studio?cat=documentos')
                      }}
                      className="w-full justify-start gap-2 h-9 px-3 rounded-lg border border-zinc-800/80 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{language === 'pt-BR' ? 'Documentos' : 'Documents'}</span>
                    </Button>
                  </div>
                )}

                <Button
                  id="tour-screen-share"
                  variant="ghost"
                  onClick={() => handleAuthAction(() => { isScreenShared ? stopSharing() : handleStartSharing() })}
                  className={`w-full justify-start gap-2 h-10 px-3 rounded-lg border border-zinc-800/80 transition-colors ${isScreenShared
                    ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                    : 'bg-zinc-900/50 hover:bg-zinc-800 hover:text-white text-zinc-400'
                    }`}
                >
                  <MonitorUp className="w-4 h-4" />
                  <span className="text-sm font-medium">{isScreenShared ? t('app.stop_sharing') : t('app.share_screen')}</span>
                </Button>

                {/* Botão de Destacar Chat (PiP / Popup) */}
                <Button
                   id="tour-pip-chat"
                   variant="ghost"
                   onClick={() => handleAuthAction(() => {
                     if (isMobileDevice()) {
                       setShowMobileWarning(true)
                       return
                     }
                     openChat()
                   })}
                   className={`w-full justify-start gap-2 h-10 px-3 rounded-lg border border-zinc-800/80 transition-colors ${floatingState !== 'none'
                     ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
                     : 'bg-zinc-900/50 hover:bg-zinc-800 hover:text-white text-zinc-400'
                     }`}
                >
                  <PictureInPicture2 className={`w-4 h-4 ${floatingState !== 'none' ? 'text-blue-400' : ''}`} />
                  <span className="text-sm font-medium">
                    {floatingState === 'none' && (language === 'pt-BR' ? 'Abrir Chat Flutuante' : 'Detach Chat')}
                    {floatingState === 'pip' && (language === 'pt-BR' ? 'Restaurar Chat' : 'Restore Chat')}
                    {floatingState === 'popup' && (language === 'pt-BR' ? 'Restaurar (Popup)' : 'Restore (Popup)')}
                  </span>
                </Button>

              </div>

              <div className="flex-1 overflow-y-auto mt-2 px-3 pb-4">
                <div className="px-3 py-2 mb-1">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{language === 'pt-BR' ? 'Suas conversas' : 'Your conversations'}</span>
                </div>

                <div className="space-y-[2px]">
                  {isLoading ? (
                    <div className="text-zinc-600 text-sm px-3 mt-2 animate-pulse">{language === 'pt-BR' ? 'A carregar...' : 'Loading...'}</div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="text-zinc-600 text-[13px] px-3 mt-2">
                      {searchQuery ? (language === 'pt-BR' ? 'Nenhuma conversa encontrada.' : 'No conversation found.') : (language === 'pt-BR' ? 'Nenhuma conversa ainda.' : 'No conversation yet.')}
                    </div>
                  ) : (
                    filteredConversations.map((item) => (
                      <div key={item.id} className="w-full relative flex items-center group">
                        <button
                          onClick={() => loadConversation(item.id)}
                          className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors pr-16 ${activeId === item.id ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
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
                        <div className="absolute right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          {editingId === item.id ? (
                            <>
                              <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => { e.stopPropagation(); handleRenameSubmit(item.id); }}
                                className="p-1.5 text-zinc-500 hover:text-emerald-400 rounded-md hover:bg-zinc-800/80 transition-colors"
                                title={language === 'pt-BR' ? "Salvar" : "Save"}
                                disabled={isRenaming}
                              >
                                {isRenaming ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in duration-200" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                                className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-md hover:bg-zinc-800/80 transition-colors"
                                title={language === 'pt-BR' ? "Cancelar" : "Cancel"}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => startEditing(e, item.id, item.title)}
                                className="p-1.5 text-zinc-500 hover:text-blue-400 rounded-md hover:bg-zinc-800/80 transition-colors"
                                title={language === 'pt-BR' ? "Renomear" : "Rename"}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteConversation(item.id); }}
                                className="p-1.5 text-zinc-500 hover:text-red-400 rounded-md hover:bg-zinc-800/80 transition-colors"
                                title={language === 'pt-BR' ? "Excluir" : "Delete"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-3 border-t border-zinc-800/60 flex flex-col gap-4">
                {hasHydrated && !isLoggedIn && (
                  <div className="px-1 py-2 flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-zinc-100 leading-tight">
                        {t('help.personalized_responses')}
                      </span>
                      <p className="text-[13px] text-zinc-500 leading-normal">
                        {t('help.login_benefit')}
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push('/login')}
                      className="w-full h-10 bg-zinc-800/50 hover:bg-zinc-800 text-white rounded-[20px] border border-zinc-700/30 font-semibold text-sm transition-all mt-1"
                    >
                      {t('register.login')}
                    </Button>
                  </div>
                )}

                {hasHydrated && isLoggedIn ? (
                  <SettingsDialog trigger={
                    <Button id="tour-settings" variant="ghost" className="w-full justify-start gap-2.5 h-12 px-3 hover:bg-zinc-800/50 rounded-lg group">
                      <SettingsIcon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-300" />
                      <span className="text-sm">{t('app.settings')}</span>
                    </Button>
                  } />
                ) : (
                  <Button
                    id="tour-settings"
                    variant="ghost"
                    onClick={() => handleAuthAction(() => { })}
                    className="w-full justify-start gap-2.5 h-12 px-3 hover:bg-zinc-800/50 rounded-lg group"
                  >
                    <SettingsIcon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-300" />
                    <span className="text-sm">{t('app.settings')}</span>
                  </Button>
                )}

                {hasHydrated && isLoggedIn && (
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
                          <span className="text-xs text-zinc-500">{currentPlanLabel}</span>
                        </div>
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Como o flex-1 ocupa todo o restante do espaço, se a sidebar estiver oculta, a children ocupará 100% da tela */}
      <div className="flex-1 flex flex-col relative h-full bg-zinc-950">
        {children}
      </div>

      <Dialog open={showMobileWarning} onOpenChange={setShowMobileWarning}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm bg-[#1e1e1e] border-zinc-800 text-zinc-100 rounded-2xl">
          <DialogHeader className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800 mb-2">
              <Laptop className="w-6 h-6 text-zinc-400" />
            </div>
            <DialogTitle className="text-center text-lg font-semibold text-zinc-100">
              {t('app.exclusive_desktop')}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-zinc-400 leading-relaxed mt-1">
              {t('app.exclusive_desktop_desc')}
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => setShowMobileWarning(false)}
            className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl h-11 font-medium"
          >
            OK
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm bg-[#1e1e1e] border-zinc-800 text-zinc-100 rounded-2xl">
          <DialogHeader className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 mb-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <DialogTitle className="text-center text-lg font-semibold text-zinc-100">
              {language === 'pt-BR' ? 'Em Breve!' : 'Coming Soon!'}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-zinc-400 leading-relaxed mt-1">
              {language === 'pt-BR' 
                ? 'O ScreenAI Studio está em fase beta e restrito a administradores. Em breve liberaremos para todos os usuários!'
                : 'ScreenAI Studio is currently in beta and restricted to admins. We will release it to all users soon!'}
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => setShowComingSoon(false)}
            className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl h-11 font-medium transition-colors"
          >
            {language === 'pt-BR' ? 'Entendi' : 'Got it'}
          </Button>
        </DialogContent>
      </Dialog>
      <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />
      <UpgradePlanDialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen} message={upgradeDialogMessage} />
    </div>
  )
}
