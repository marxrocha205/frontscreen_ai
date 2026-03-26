
"use client"

import * as React from 'react'
import { useI18n } from '@/context/i18n-context'
import { useTheme } from 'next-themes'
import { useVoiceConfig } from '@/hooks/use-voice-config'
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
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Settings, Mic, User, Volume2, VolumeX } from 'lucide-react'
import { Language } from '@/locales'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'

interface SettingsDialogProps {
  children?: React.ReactNode
  trigger: React.ReactElement
  defaultTab?: string;
}

export function SettingsDialog({ trigger, defaultTab = 'general' }: SettingsDialogProps) {
  const { t, language, setLanguage } = useI18n()
  const { theme, setTheme } = useTheme()
  const { logout } = useAuth()
  const router = useRouter()

  const { 
    speechThreshold, setSpeechThreshold, 
    silenceMs, setSilenceMs,
    isVoiceEnabled, setIsVoiceEnabled,
    voiceType, setVoiceType
  } = useVoiceConfig()

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  // Handler seguro para o Select (Base UI espera string | null)
  const handleThemeChange = (val: string | null) => {
    if (val) setTheme(val)
  }

  const handleLanguageChange = (val: string | null) => {
    if (val) setLanguage(val as Language)
  }

  const handleVoiceChange = (val: string | null) => {
    if (val) setVoiceType(val)
  }

  // Handler seguro para o Slider
  const handleSliderChange = (setter: (val: number) => void) => (vals: number | readonly number[]) => {
    const value = Array.isArray(vals) ? vals[0] : vals
    setter(value)
  }

  if (!mounted) return null

  return (
    <Dialog>
      {/* DICA SÊNIOR: Removido asChild. 
          No Base UI, o DialogTrigger por padrão funciona como um wrapper. 
          Certifique-se que seu componente Button use forwardRef.
      */}
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
                    <SelectValue placeholder="Selecione o tema" />
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
                    <SelectItem value="es-ES">Español (ES)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="voice" className="mt-0 space-y-6 focus-visible:outline-none">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                  <div className="flex items-center gap-3">
                    {isVoiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Respostas por Voz</span>
                      <span className="text-[11px] text-zinc-500">A IA falará as respostas</span>
                    </div>
                  </div>
                  <Switch 
                    checked={isVoiceEnabled} 
                    onCheckedChange={setIsVoiceEnabled} 
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-zinc-100">Voz do Assistente</Label>
                  <Select 
                    value={voiceType} 
                    onValueChange={handleVoiceChange}
                    disabled={!isVoiceEnabled}
                  >
                    <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                      <SelectItem value="nova">Nova (Feminina)</SelectItem>
                      <SelectItem value="shimmer">Shimmer (Expressiva)</SelectItem>
                      <SelectItem value="alloy">Alloy (Neutra)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 border-t border-zinc-800/50 pt-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-zinc-200">Sensibilidade do Microfone</Label>
                    <span className="text-xs text-zinc-400">{speechThreshold}</span>
                  </div>
                  <Slider 
                    value={[speechThreshold]} 
                    max={10} 
                    step={1} 
                     onValueChange={(v) => setSpeechThreshold(v[0])}
                  />

                  <div className="flex items-center justify-between mt-4">
                    <Label className="text-xs font-semibold text-zinc-200">Tempo de Pausa (Silêncio)</Label>
                    <span className="text-xs text-zinc-400">{silenceMs / 1000}s</span>
                  </div>
                  <Slider 
                    value={[silenceMs]} 
                    max={3000} 
                    min={500} 
                    step={100} 
                    onValueChange={(v) => setSilenceMs(v[0])}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="account" className="mt-0 focus-visible:outline-none">
               <div className="space-y-4">
                 <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-sm font-medium">Plano Atual</span>
                     <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">Free</span>
                   </div>
                   <Button onClick={() => router.push("/pricing")} className="w-full bg-zinc-200 text-zinc-900 hover:bg-white text-xs font-bold uppercase h-10">
                     Fazer Upgrade
                   </Button>
                 </div>

                 <div className="p-3 border-t border-zinc-800/50">
                    <Button onClick={logout} variant="outline" className="w-full border-zinc-800 text-red-400 hover:bg-red-950/20">
                       Sair da Conta
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
  return <div className="px-6 pb-6 pt-2 h-[400px] overflow-y-auto custom-scrollbar">{children}</div>
}