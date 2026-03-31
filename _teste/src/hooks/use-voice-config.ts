import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface VoiceConfigState {
  speechThreshold: number
  silenceMs: number
  setSpeechThreshold: (val: number) => void
  setSilenceMs: (val: number) => void
}

export const useVoiceConfig = create<VoiceConfigState>()(
  persist(
    (set) => ({
      speechThreshold: 5, // Default sensitivity
      silenceMs: 1500, // Default pause before stop
      setSpeechThreshold: (val) => set({ speechThreshold: val }),
      setSilenceMs: (val) => set({ silenceMs: val }),
    }),
    {
      name: 'screenai-voice-config',
    }
  )
)
