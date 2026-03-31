"use client"

import { useI18n } from '@/context/i18n-context'
import { useTheme } from 'next-themes'
import { useVoiceConfig } from '@/hooks/use-voice-config'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Settings, Mic, User } from 'lucide-react'
import { ReactNode } from 'react'
import { Language } from '@/locales'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'

export function SettingsDialog({ trigger, defaultTab = 'general' }: { trigger: React.ReactElement, defaultTab?: string }) {
  const { t, language, setLanguage } = useI18n()
  const { theme, setTheme } = useTheme()
  const { speechThreshold, setSpeechThreshold, silenceMs, setSilenceMs } = useVoiceConfig()
  const { user, logout } = useAuth()
  const router = useRouter()

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-[480px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-900">
          <DialogTitle className="text-lg font-semibold">{t('settings.title')}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <div className="px-6 mb-2">
             <TabsList className="w-full grid w-full grid-cols-3 bg-zinc-900/50 p-1">
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
            <TabsContent value="general" className="mt-0 space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-zinc-100">{t('settings.theme')}</Label>
                <Select value={theme} onValueChange={(val) => val && setTheme(val)}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 ring-offset-zinc-950 focus:ring-zinc-800">
                    <SelectValue />
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
                <Select value={language} onValueChange={(val) => val && setLanguage(val as Language)}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 ring-offset-zinc-950 focus:ring-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es-ES">Español (ES)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 border-t border-zinc-800/50 pt-6">
                <Label className="text-xs font-semibold text-zinc-100">{t('settings.voice_assistant')}</Label>
                <Select defaultValue="nova">
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 ring-offset-zinc-950 focus:ring-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectItem value="nova">Nova</SelectItem>
                    <SelectItem value="shimmer">Shimmer</SelectItem>
                    <SelectItem value="alloy">Alloy</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-zinc-500">Escolha a voz que o assistente usará para responder</p>
              </div>

              <div className="space-y-3 border-t border-zinc-800/50 pt-6">
                <Label className="text-xs font-semibold text-zinc-100">{t('settings.voice_calibration')}</Label>
                <Button variant="outline" className="w-full bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white">
                  {t('settings.open_calibration')}
                </Button>
                <p className="text-[11px] text-zinc-500">Calibre sua voz para melhor reconhecimento no modo VAD</p>
              </div>
            </TabsContent>

            <TabsContent value="voice" className="mt-0 space-y-6">
              <div className="space-y-6">
                <h4 className="text-sm font-medium text-zinc-200 mb-4">Configurações de Microfone</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-zinc-200">{t('settings.mic_sensitivity')}</Label>
                    <span className="text-xs text-zinc-400">{speechThreshold}</span>
                  </div>
                  <Slider 
                    value={[speechThreshold]} 
                    max={10} 
                    step={1} 
                    onValueChange={(vals) => typeof vals === 'number' ? setSpeechThreshold(vals) : (vals && vals[0] !== undefined) && setSpeechThreshold(vals[0])} 
                    className="py-2"
                  />
                  <p className="text-[11px] text-zinc-500">Ajuste a sensibilidade do microfone para captar sua voz</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-zinc-200">{t('settings.mic_pause')}</Label>
                    <span className="text-xs text-zinc-400">{silenceMs / 1000}s</span>
                  </div>
                  <Slider 
                    value={[silenceMs]} 
                    max={3000} 
                    min={500} 
                    step={100} 
                    onValueChange={(vals) => typeof vals === 'number' ? setSilenceMs(vals) : (vals && vals[0] !== undefined) && setSilenceMs(vals[0])} 
                    className="py-2"
                  />
                  <p className="text-[11px] text-zinc-500">Tempo de silêncio antes de considerar que você terminou de falar</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="account" className="mt-0">
               <div className="space-y-1">
                 <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-4 mb-6">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-medium text-zinc-200">Plano Atual</span>
                     <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">Free</span>
                   </div>
                   <p className="text-xs text-zinc-400 mb-4">Você está usando o plano gratuito do ScreenAI</p>
                   <ul className="text-xs text-zinc-500 space-y-1.5 list-disc pl-4 mb-4">
                     <li>10 conversas por mês</li>
                     <li>5 minutos de captura de tela por conversa</li>
                     <li>Análise básica com IA</li>
                   </ul>
                   <Button onClick={() => router.push("/pricing")} className="w-full bg-zinc-200 text-zinc-900 hover:bg-white h-9 text-xs font-medium">
                     Fazer Upgrade para Pro
                   </Button>
                 </div>
                 
                 <div className="space-y-2 pb-6 border-b border-zinc-800/50 mb-6">
                    <h4 className="text-xs font-semibold text-zinc-100 mb-3">Informações da Conta</h4>
                     <div className="flex justify-between text-xs">
                       <span className="text-zinc-500">Email:</span>
                       <span className="text-zinc-200">{user?.email || 'joao.silva@email.com'}</span>
                     </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Membro desde:</span>
                      <span className="text-zinc-200">15 Mar 2026</span>
                    </div>
                 </div>

                 <Button onClick={logout} variant="outline" className="w-full bg-transparent border-zinc-800 text-red-400 hover:bg-red-950/30 hover:border-red-900">
                    Sair da Conta
                 </Button>
               </div>
            </TabsContent>
          </ScrollWrapper>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function ScrollWrapper({ children }: { children: ReactNode }) {
  return <div className="px-6 pb-6 pt-2 h-[420px] overflow-y-auto custom-scrollbar">{children}</div>
}
