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
        sideOffset={10}
        alignOffset={isMobile ? 10 : 0}
        className="w-[250px] sm:w-[280px] bg-[#232323] border-zinc-800 text-zinc-200 p-2 rounded-xl shadow-2xl overflow-hidden z-[100]"
      >
        <div className="p-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-zinc-300">
              {language === 'pt-BR' ? 'Plano:' : 'Plan:'}{' '}
              <span className="font-bold text-white uppercase">{userPlan || 'FREE'}</span>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleUpgrade}
            className="w-full relative flex items-center justify-center h-10 rounded-lg bg-indigo-700 text-white text-sm font-bold shadow-[0_0_12px_rgba(79,70,229,0.4)] hover:shadow-[0_0_20px_rgba(79,70,229,0.6)] transition-all overflow-hidden group border border-indigo-500/30"
          >
            {/* Animated blue background pulse */}
            <div className="absolute inset-0 bg-indigo-500 animate-pulse" />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />

            <span className="relative z-10 tracking-wide drop-shadow-sm">{language === 'en-US' ? 'Buy Pro Plan' : 'Comprar Plano Pro'}</span>
          </button>
        </div>

        <DropdownMenuSeparator className="bg-zinc-800/80 my-2 mx-1" />

        <div className="p-2 flex flex-col gap-3">
          <div>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors cursor-pointer group">
                <span className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-zinc-400 group-hover:text-zinc-300" />
                  {language === 'en-US' ? 'Voice Assistant' : 'Voz do Assistente'}
                </span>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-400" />
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent 
                sideOffset={8} 
                className="w-[calc(100vw-3rem)] max-w-[200px] z-[110] bg-[#232323] border-zinc-700 shadow-2xl"
              >
                {GEMINI_VOICES.map((v) => (
                  <DropdownMenuItem
                    key={v.id}
                    onClick={() => setVoiceType(v.id)}
                    className="flex flex-col items-start px-2 py-1.5 focus:bg-zinc-800 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-sm text-zinc-200">{v.label}</span>
                      {voiceType === v.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                      {language === 'pt-BR' ? v.desc_pt : v.desc_en}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {language === 'en-US' ? 'Language' : 'Idioma'}
            </div>
            <div className="rounded-lg bg-zinc-900/50 p-1 border border-zinc-800/50">
              <div className="flex items-center justify-between px-2 py-1.5 text-sm font-medium text-zinc-300 mb-1">
                <span className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4 text-zinc-400" />
                  {currentLanguageLabel}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 px-1 pb-1">
                {LANGUAGE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLanguage(option.value)}
                    className={`h-8 rounded-md text-xs font-semibold transition-colors ${language === option.value
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                  >
                    {option.short}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-zinc-800/80 my-2 mx-1" />

        <DropdownMenuItem
          onClick={logout}
          className="gap-2 p-2 focus:bg-red-500/10 focus:text-red-400 text-red-400/80 cursor-pointer rounded-lg transition-colors group mx-1"
        >
          <LogOut className="h-4 w-4 group-hover:text-red-400" />
          <span className="font-medium text-sm">{language === 'en-US' ? 'Log out' : 'Sair da conta'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

