import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface VoiceConfigState {
  speechThreshold: number
  silenceMs: number
  isVoiceEnabled: boolean 
  voiceType: string 
  
  // Ações
  setSpeechThreshold: (val: number) => void
  setSilenceMs: (val: number) => void
  setIsVoiceEnabled: (val: boolean) => void
  setVoiceType: (val: string) => void
}

export const useVoiceConfig = create<VoiceConfigState>()(
  persist(
    (set) => ({
      speechThreshold: 5,
      silenceMs: 1500,
      isVoiceEnabled: true, 
      voiceType: 'nova', 
      
      setSpeechThreshold: (val) => {
        console.log(`[VoiceConfig] Threshold alterado para: ${val}`);
        set({ speechThreshold: val });
      },
      setSilenceMs: (val) => set({ silenceMs: val }),
      setIsVoiceEnabled: (val) => {
        console.log(`[VoiceConfig] Voz habilitada: ${val}`);
        set({ isVoiceEnabled: val });
      },
      setVoiceType: (val) => {
        console.log(`[VoiceConfig] Modelo de voz alterado para: ${val}`);
        set({ voiceType: val });
      },
    }),
    {
      name: 'screenai-voice-config',
    }
  )
)