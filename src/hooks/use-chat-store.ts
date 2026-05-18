import { create } from 'zustand'
import { config } from '@/lib/config'

export const AI_MODELS = [
  { id: '', label: '✨ Automático (Melhor modelo)', requiresPro: false },

  // Modelos OpenAI roteados pelo OpenRouter
  { id: 'openrouter/openai/gpt-4o', label: '🟢 GPT-4o', requiresPro: false },
  { id: 'openrouter/openai/gpt-4o-mini', label: '🟢 GPT-4o Mini', requiresPro: false },

  // Modelos Google roteados pelo OpenRouter
  { id: 'openrouter/google/gemini-2.5-pro', label: '🔵 Gemini 2.5 Pro', requiresPro: false },
  { id: 'openrouter/google/gemini-2.5-flash', label: '🔵 Gemini 2.5 Flash', requiresPro: false },

  // Modelos Anthropic roteados pelo OpenRouter
  { id: 'openrouter/anthropic/claude-3.5-sonnet', label: '🟠 Claude 3.5 Sonnet', requiresPro: false },

  // Modelos Open-Source / Outros
  { id: 'openrouter/deepseek/deepseek-chat', label: '🐋 DeepSeek V3', requiresPro: false },
  { id: 'openrouter/deepseek/deepseek-r1', label: '🐋 DeepSeek R1 (Raciocínio)', requiresPro: false },
  { id: 'openrouter/meta-llama/llama-3.3-70b-instruct', label: '🦙 Llama 3.3 70B', requiresPro: false }
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
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
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
  isSidebarOpen: false,

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
  setIsSidebarOpen: (open) => set({ isSidebarOpen: open }),
}))
