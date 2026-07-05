"use client"

import type { ReactElement } from 'react'
import { ChevronDown, ChevronRight, Globe2, LogOut, Sparkles, Zap, Settings as SettingsIcon, Mic } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useChatStore } from '@/hooks/use-chat-store'
import { useI18n } from '@/context/i18n-context'
import type { Language } from '@/locales'
import { useVoiceConfig } from '@/hooks/use-voice-config'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

import { useState, useEffect } from 'react'

const LANGUAGE_OPTIONS: { value: Language; label: string; short: string }[] = [
  { value: 'pt-BR', label: 'Português', short: 'PT' },
  { value: 'en-US', label: 'English', short: 'EN' },
  { value: 'es-ES', label: 'Español', short: 'ES' },
]

const GEMINI_VOICES = [
  { id: 'Puck', label: 'Puck', desc_pt: 'Energética e vibrante', desc_en: 'Energetic and vibrant' },
  { id: 'Charon', label: 'Charon', desc_pt: 'Calma e profunda', desc_en: 'Calm and deep' },
  { id: 'Kore', label: 'Kore', desc_pt: 'Feminina e brilhante', desc_en: 'Female and bright' },
  { id: 'Fenrir', label: 'Fenrir', desc_pt: 'Masculina e séria', desc_en: 'Male and serious' },
  { id: 'Aoede', label: 'Aoede', desc_pt: 'Clara e equilibrada', desc_en: 'Clear and balanced' },
]

export function SettingsSideMenu({ trigger }: { trigger: ReactElement }) {
  const router = useRouter()
  const { language, setLanguage } = useI18n()
  const { logout } = useAuth()
  const { userPlan, setIsSidebarOpen } = useChatStore()
  const { voiceType, setVoiceType } = useVoiceConfig()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const currentLanguageLabel = LANGUAGE_OPTIONS.find(option => option.value === language)?.label || 'Português'

  const handleUpgrade = () => {
    setIsSidebarOpen(false)
    router.push('/pricing')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isMobile ? "top" : "right"}
        align={isMobile ? "start" : "end"}
        sideOffset={12}
        alignOffset={isMobile ? 12 : 0}
        className="w-[260px] sm:w-[280px] bg-[#0c0c0e]/95 backdrop-blur-xl border border-zinc-800/80 text-zinc-200 p-1.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] overflow-hidden z-[100]"
      >

        {/* Header & Plan */}
        <div className="p-3 mb-1">
          <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">
            {language === 'pt-BR' ? 'Seu Plano' : 'Your Plan'}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-black text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              {userPlan || 'FREE'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleUpgrade}
            className="mt-3 w-full relative flex items-center justify-center h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-bold shadow-[0_0_15px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] transition-all duration-300 overflow-hidden group border border-indigo-400/20 hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
            <span className="relative z-10 tracking-wide drop-shadow-md flex items-center gap-1.5">

              {language === 'en-US' ? 'Upgrade to Pro' : 'Comprar Plano Pro'}
            </span>
          </button>
        </div>

        <DropdownMenuSeparator className="bg-zinc-800/60 my-1 mx-2" />

        {/* Menu Items */}
        <div className="px-1 py-1 flex flex-col gap-0.5">
          <DropdownMenuItem
            onClick={() => {
              setIsSidebarOpen(false)
              router.push('/settings')
            }}
            className="w-full flex items-center gap-3 px-2 py-2 text-[13px] font-medium text-zinc-300 focus:bg-white/5 focus:text-white rounded-xl transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-zinc-800/40 group-focus:bg-zinc-700/50 flex items-center justify-center border border-zinc-700/40 group-focus:border-zinc-600/50 transition-colors">
              <SettingsIcon className="h-3.5 w-3.5 text-zinc-400 group-focus:text-zinc-200" />
            </div>
            {language === 'en-US' ? 'Settings' : 'Configurações da Conta'}
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="w-full flex items-center justify-between px-2 py-2 text-[13px] font-medium text-zinc-300 focus:bg-white/5 focus:text-white data-[state=open]:bg-white/5 data-[state=open]:text-white rounded-xl transition-all cursor-pointer group">
              <span className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-zinc-800/40 group-focus:bg-zinc-700/50 flex items-center justify-center border border-zinc-700/40 group-focus:border-zinc-600/50 transition-colors">
                  <Mic className="h-3.5 w-3.5 text-zinc-400 group-focus:text-zinc-200" />
                </div>
                {language === 'en-US' ? 'Voice Assistant' : 'Voz do Assistente'}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-focus:text-zinc-400" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              sideOffset={12}
              className="w-[calc(100vw-3rem)] max-w-[220px] z-[110] bg-[#0c0c0e]/95 backdrop-blur-xl border-zinc-800/80 shadow-2xl rounded-xl p-1.5"
            >
              {GEMINI_VOICES.map((v) => (
                <DropdownMenuItem
                  key={v.id}
                  onClick={() => setVoiceType(v.id)}
                  className="flex flex-col items-start px-3 py-2 focus:bg-white/5 rounded-lg cursor-pointer transition-all mb-0.5 last:mb-0"
                >
                  <div className="flex items-center justify-between w-full mb-0.5">
                    <span className="font-semibold text-[13px] text-zinc-200">{v.label}</span>
                    {voiceType === v.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {language === 'pt-BR' ? v.desc_pt : v.desc_en}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </div>

        <DropdownMenuSeparator className="bg-zinc-800/60 my-1 mx-2" />

        {/* Language Segmented Control */}
        <div className="px-3 py-3">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Globe2 className="h-3 w-3" />
            {language === 'en-US' ? 'Language' : 'Idioma'}
          </div>
          <div className="flex bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/40 shadow-inner">
            {LANGUAGE_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setLanguage(option.value)}
                className={`flex-1 h-8 rounded-lg text-[11px] font-bold transition-all duration-300 ${language === option.value
                    ? 'bg-zinc-700/80 text-white shadow-sm ring-1 ring-zinc-600/50'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                  }`}
              >
                {option.short}
              </button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator className="bg-zinc-800/60 my-1 mx-2" />

        {/* Logout */}
        <div className="px-1 pb-1 pt-1">
          <DropdownMenuItem
            onClick={logout}
            className="w-full flex items-center gap-3 px-2 py-2 text-[13px] font-medium text-red-400 focus:bg-red-500/10 focus:text-red-300 rounded-xl transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-red-500/10 group-focus:bg-red-500/20 flex items-center justify-center border border-red-500/20 transition-colors">
              <LogOut className="h-3.5 w-3.5 text-red-400" />
            </div>
            {language === 'en-US' ? 'Log out' : 'Sair da conta'}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

