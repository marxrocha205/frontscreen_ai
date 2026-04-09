import { create } from 'zustand'
import { config } from '@/lib/config'

export const AI_MODELS = [
  { id: 'screen-ai-1.2', label: 'ScreenAI 1.2', description: 'Rápido, seguro e ótimo para tarefas do dia a dia', requiresPro: false },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Iteração rápida e respostas ágeis', requiresPro: true },
  { id: 'gemini-1.5-pro', label: 'Gemini 3.1 Pro', description: '1M de contexto — ideal para transcrições longas', requiresPro: true },
  { id: 'claude-3-opus', label: 'Claude Sonnet 4.6', description: 'Melhor para roteiros, legendas e escrita criativa', requiresPro: true },
  { id: 'gpt-5', label: 'GPT-5.2 Thinking', description: 'Raciocínio profundo para decisões de edição complexas', requiresPro: true }
]

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

// Tipo discriminado para os 3 estados possíveis do chat flutuante
export type FloatingState = 'none' | 'pip' | 'popup'

interface ChatState {
  messages: Message[]
  isStreaming: boolean
  credits: number | null
  userPlan: string | null
  selectedModel: string
  floatingState: FloatingState
  pipWindow: Window | null
  isUpgradeDialogOpen: boolean
  setIsUpgradeDialogOpen: (open: boolean) => void
  upgradeDialogMessage: string | null
  setUpgradeDialogMessage: (message: string | null) => void


  addMessage: (message: Message) => void
  updateLastAssistantMessage: (content: string) => void
  setIsStreaming: (isStreaming: boolean) => void
  setCredits: (credits: number) => void
  fetchCredits: () => Promise<void>
  setSelectedModel: (modelId: string) => void
  clearMessages: () => void
  openFloatingMode: (win: Window, type: 'pip' | 'popup') => void
  closeFloatingMode: () => void
  isSoundEnabled: boolean
  toggleSound: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  credits: null,
  userPlan: null,
  selectedModel: AI_MODELS[0].id,
  floatingState: 'none',
  pipWindow: null,
  isUpgradeDialogOpen: false,
  upgradeDialogMessage: null,
  isSoundEnabled: false,

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  updateLastAssistantMessage: (content) => set((state) => {
    const newMessages = [...state.messages]
    const lastIdx = newMessages.findLastIndex(m => m.role === 'assistant')
    if (lastIdx !== -1) {
      newMessages[lastIdx] = { ...newMessages[lastIdx], content }
    }
    return { messages: newMessages }
  }),

  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setCredits: (credits) => set({ credits }),

  fetchCredits: async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (!token) return

      const res = await fetch(`${config.apiUrl}/users/me/credits`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (res.ok) {
        const data = await res.json()
        if (data.remaining_credits !== undefined) {
          set({ credits: data.remaining_credits })
        }
        if (data.plan_name !== undefined) {
          set({ userPlan: data.plan_name })
        }
      }
    } catch (error) {
      console.error("Erro ao buscar créditos:", error)
    }
  },

  setSelectedModel: (modelId) => set({ selectedModel: modelId }),
  clearMessages: () => set({ messages: [], isStreaming: false }),

  openFloatingMode: (win, type) => set({ floatingState: type, pipWindow: win }),
  closeFloatingMode: () => set({ floatingState: 'none', pipWindow: null }),
  setIsUpgradeDialogOpen: (open) => set({ isUpgradeDialogOpen: open }),
  setUpgradeDialogMessage: (message) => set({ upgradeDialogMessage: message }),
  toggleSound: () => set((state) => ({ isSoundEnabled: !state.isSoundEnabled })),
}))