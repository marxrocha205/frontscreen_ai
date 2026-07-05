"use client"

import * as React from 'react'
import { useI18n } from '@/context/i18n-context'
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
import { Mic, User } from 'lucide-react'
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

export function SettingsDialog({ trigger, defaultTab = 'voice' }: SettingsDialogProps) {
  const { t, language } = useI18n()
  const { logout } = useAuth()
  const router = useRouter()

  const { voiceType, setVoiceType } = useVoiceConfig()

  const { userPlan, fetchCredits } = useChatStore()


  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
    fetchCredits()
  }, [fetchCredits])

  if (!mounted) return null

  const initialTab = defaultTab === 'account' ? 'account' : 'voice'
  const planName = userPlan || (language === 'pt-BR' ? 'Carregando...' : 'Loading...')
  const isFreePlan = (userPlan || '').trim().toLowerCase() === 'free'

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      
      <DialogContent className="sm:max-w-[480px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl focus:outline-none">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-900">
          <DialogTitle className="text-lg font-semibold">{t('settings.title')}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={initialTab} className="w-full">
          <div className="px-6 mb-2">
            <TabsList className="w-full grid grid-cols-2 bg-zinc-900/50 p-1">
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
            <TabsContent value="voice" className="mt-0 space-y-6 focus-visible:outline-none animate-enter-fade-zoom origin-top">
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-zinc-100">{t('settings.voice_assistant')}</Label>
                <Select value={voiceType} onValueChange={(val) => val && setVoiceType(val)}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder={language === 'pt-BR' ? "Selecione uma voz" : "Select a voice"} />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} className="bg-zinc-900 border-zinc-800 text-zinc-100 z-[100]">
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

            <TabsContent value="account" className="mt-0 focus-visible:outline-none animate-enter-fade-zoom origin-top">
               <div className="space-y-4">
                 <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-sm font-medium">{language === 'pt-BR' ? 'Plano Atual' : 'Current Plan'}</span>
                     <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{planName}</span>
                   </div>
                   {isFreePlan && (
                     <Button onClick={() => router.push("/pricing")} className="w-full bg-zinc-200 text-zinc-900 hover:bg-white text-xs font-bold uppercase h-10">
                       {language === 'pt-BR' ? 'Fazer Upgrade' : 'Upgrade Now'}
                     </Button>
                   )}
                 </div>

                 <div className="p-3 border-t border-zinc-800/50 flex flex-col gap-3">
                    <Button 
                      onClick={() => router.push('/settings')} 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                    >
                       <SettingsIcon className="w-4 h-4 mr-2" />
                       {language === 'pt-BR' ? 'Configurar Perfil' : 'Profile Settings'}
                    </Button>
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
  return <div className="px-6 pb-6 pt-2 h-[calc(85vh-160px)] md:h-[420px] max-h-[420px] overflow-y-auto custom-scrollbar">{children}</div>
}
