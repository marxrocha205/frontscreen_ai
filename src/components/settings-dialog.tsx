"use client"

import * as React from 'react'
import { useI18n } from '@/context/i18n-context'
import { useTheme } from 'next-themes'
import { useVoiceConfig } from '@/hooks/use-voice-config'
import { useChatStore } from '@/hooks/use-chat-store'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Settings, Mic, User, Check } from 'lucide-react'
import { Language } from '@/locales'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'

interface SettingsDialogProps {
  children?: React.ReactNode
  trigger: React.ReactElement
  defaultTab?: string;
}

const GEMINI_VOICES = [
  { id: 'Puck', label: 'Puck', desc_pt: 'Energética e vibrante', desc_en: 'Energetic and vibrant' },
  { id: 'Charon', label: 'Charon', desc_pt: 'Calma e profunda', desc_en: 'Calm and deep' },
  { id: 'Kore', label: 'Kore', desc_pt: 'Feminina e brilhante', desc_en: 'Female and bright' },
  { id: 'Fenrir', label: 'Fenrir', desc_pt: 'Masculina e séria', desc_en: 'Male and serious' },
  { id: 'Aoede', label: 'Aoede', desc_pt: 'Clara e equilibrada', desc_en: 'Clear and balanced' },
]

export function SettingsDialog({ trigger, defaultTab = 'general' }: SettingsDialogProps) {
  const { t, language, setLanguage } = useI18n()
  const { theme, setTheme } = useTheme()
  const { logout } = useAuth()
  const router = useRouter()

  const { 
    voiceType, setVoiceType
  } = useVoiceConfig()

  const { userPlan } = useChatStore()

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const handleThemeChange = (val: string | null) => {
    if (val) setTheme(val)
  }

  const handleLanguageChange = (val: string | null) => {
    if (val) setLanguage(val as Language)
  }

  if (!mounted) return null

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      
      <DialogContent className="sm:max-w-[480px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl focus:outline-none">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-900">
          <DialogTitle className="text-lg font-semibold">{t('settings.title')}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <div className="px-6 mb-2">
            <TabsList className="w-full grid grid-cols-3 bg-zinc-900/50 p-1">
              <TabsTrigger value="general" className="data-[state=active]:bg-zinc-800/80 data-[state=active]:text-white text-zinc-400 gap-2">
                <Settings className="w-3.5 h-3.5" />
                {t('settings.general')}
              </TabsTrigger>
              <TabsTrigger value="voice" className="data-[state=active]:bg-zinc-800/80 data-[state=active]:text-white text-zinc-400 gap-2">
                <Mic className="w-3.5 h-3.5" />
                {t('settings.voice')}
              </TabsTrigger>
              <TabsTrigger value="account" className="data-[state=active]:bg-zinc-800/80 data-[state=active]:text-white text-zinc-400 gap-2">
                <User className="w-3.5 h-3.5" />
                {t('settings.account')}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollWrapper>
            <TabsContent value="general" className="mt-0 space-y-6 focus-visible:outline-none">
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-zinc-100">{t('settings.theme')}</Label>
                <Select value={theme ?? 'system'} onValueChange={handleThemeChange}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder={language === 'pt-BR' ? "Selecione o tema" : "Select theme"} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectItem value="dark">{t('settings.theme_dark')}</SelectItem>
                    <SelectItem value="light">{t('settings.theme_light')}</SelectItem>
                    <SelectItem value="system">{t('settings.theme_system')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-semibold text-zinc-100">{t('settings.language')}</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="voice" className="mt-0 space-y-4 focus-visible:outline-none">
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-zinc-100">{t('settings.voice_assistant')}</Label>
                <Select value={voiceType} onValueChange={setVoiceType}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder={language === 'pt-BR' ? "Selecione uma voz" : "Select a voice"} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    {GEMINI_VOICES.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        <div className="flex flex-col py-1">
                          <span className="font-medium">{v.label}</span>
                          <span className="text-[10px] text-zinc-500">
                            {language === 'pt-BR' ? v.desc_pt : v.desc_en}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="account" className="mt-0 focus-visible:outline-none">
               <div className="space-y-4">
                 <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-sm font-medium">{language === 'pt-BR' ? 'Plano Atual' : 'Current Plan'}</span>
                     <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{userPlan || 'Free'}</span>
                   </div>
                   <Button onClick={() => router.push("/pricing")} className="w-full bg-zinc-200 text-zinc-900 hover:bg-white text-xs font-bold uppercase h-10">
                     {language === 'pt-BR' ? 'Fazer Upgrade' : 'Upgrade Now'}
                   </Button>
                 </div>

                 <div className="p-3 border-t border-zinc-800/50">
                    <Button onClick={logout} variant="outline" className="w-full border-zinc-800 text-red-400 hover:bg-red-950/20">
                       {language === 'pt-BR' ? 'Sair da Conta' : 'Log Out'}
                    </Button>
                 </div>
               </div>
            </TabsContent>
          </ScrollWrapper>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function ScrollWrapper({ children }: { children: React.ReactNode }) {
  return <div className="px-6 pb-6 pt-2 h-[420px] overflow-y-auto custom-scrollbar">{children}</div>
}