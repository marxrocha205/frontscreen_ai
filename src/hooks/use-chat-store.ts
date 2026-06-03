import { create } from 'zustand'
import { config } from '@/lib/config'

export const AI_MODELS = [
  { id: 'screen-ai-1.2', label: 'ScreenAI 1.2', description: 'Rápido, seguro e ótimo para tarefas do dia a dia', provider: 'ScreenAI', requiresPro: false }, // Se vazio, usa a sua regra de fallback do backend

  // OpenAI
  { id: 'openai/gpt-4o', label: 'GPT-4o', provider: 'OpenAI', requiresPro: false },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI', requiresPro: false },
  { id: 'openai/gpt-oss', label: 'GPT OSS', provider: 'OpenAI', requiresPro: false },
  { id: 'openai/gpt-5-mini', label: 'GPT-5 Mini', provider: 'OpenAI', requiresPro: false },
  { id: 'openai/gpt-5.1', label: 'GPT-5.1', provider: 'OpenAI', requiresPro: false },
  { id: 'openai/gpt-5.2-thinking', label: 'GPT-5.2 Thinking', provider: 'OpenAI', requiresPro: false },
  { id: 'openai/gpt-5.3-codex', label: 'GPT-5.3 Codex', provider: 'OpenAI', requiresPro: false },
  { id: 'openai/o4-mini', label: 'o4 Mini', provider: 'OpenAI', requiresPro: false },

  // Gemini / Google
  { id: 'gemini/gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google', requiresPro: false },
  { id: 'gemini/gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Google', requiresPro: false },
  { id: 'google/gemini-3.1-flash', label: 'Gemini 3.1 Flash', provider: 'Google', requiresPro: false },
  { id: 'google/gemini-3.1-pro', label: 'Gemini 3.1 Pro', provider: 'Google', requiresPro: false },

  // Grok / xAI
  { id: 'x-ai/grok-3', label: 'Grok 3', provider: 'Grok', requiresPro: false },
  { id: 'x-ai/grok-4', label: 'Grok 4', provider: 'Grok', requiresPro: false },
  { id: 'x-ai/grok-4-fast', label: 'Grok 4 Fast', provider: 'Grok', requiresPro: false },

  // DeepSeek
  { id: 'openrouter/deepseek/deepseek-chat', label: 'DeepSeek V3', provider: 'DeepSeek', requiresPro: false },
  { id: 'openrouter/deepseek/deepseek-r1', label: 'DeepSeek R1 (Raciocínio)', provider: 'DeepSeek', requiresPro: false },
  { id: 'openrouter/deepseek/deepseek-4.0-flash', label: 'DeepSeek 4.0 Flash', provider: 'DeepSeek', requiresPro: false },
  { id: 'openrouter/deepseek/deepseek-4.0-pro', label: 'DeepSeek 4.0 Pro', provider: 'DeepSeek', requiresPro: false },

  // Claude (mantém modelos já existentes)
  { id: 'anthropic/claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'Anthropic', requiresPro: true },
  { id: 'anthropic/claude-4.5-haiku', label: 'Claude 4.5 Haiku', provider: 'Anthropic', requiresPro: true },
  { id: 'anthropic/claude-4.6-sonnet', label: 'Claude 4.6 Sonnet', provider: 'Anthropic', requiresPro: true },
  { id: 'anthropic/claude-4.6-sonnet-thinking', label: 'Claude 4.6 Sonnet Thinking', provider: 'Anthropic', requiresPro: true }
]

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string
  agent_id?: string
}

// Tipo discriminado para os 3 estados possíveis do chat flutuante
export type FloatingState = 'none' | 'pip' | 'popup'

// Payload do upsell inline (aparece como card no chat)
export interface InlineUpsellPayload {
  message: string
  remainingCredits?: number
  threshold?: number
}

interface ChatState {
  messages: Message[]
  isStreaming: boolean
  credits: number | null
  userPlan: string | null
  selectedModel: string
  selectedAgentId: string
  floatingState: FloatingState
  pipWindow: Window | null
  isUpgradeDialogOpen: boolean
  setIsUpgradeDialogOpen: (open: boolean) => void
  upgradeDialogMessage: string | null
  setUpgradeDialogMessage: (message: string | null) => void
  upgradeDialogTitle: string | null
  setUpgradeDialogTitle: (title: string | null) => void


  addMessage: (message: Message) => void
  updateLastAssistantMessage: (content: string) => void
  setIsStreaming: (isStreaming: boolean) => void
  setCredits: (credits: number) => void
  fetchCredits: () => Promise<void>
  setSelectedModel: (modelId: string) => void
  setSelectedAgentId: (agentId: string) => void
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
  selectedAgentId: '',
  floatingState: 'none',
  pipWindow: null,
  isUpgradeDialogOpen: false,
  upgradeDialogMessage: null,
  upgradeDialogTitle: null,
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

  setSelectedModel: (modelId) => {
    console.log('%c[STORE] 🔄 setSelectedModel chamado com:', 'color: #f472b6; font-weight: bold', modelId)
    set({ selectedModel: modelId })
  },
  setSelectedAgentId: (agentId) => set({ selectedAgentId: agentId }),
  clearMessages: () => set({ messages: [], isStreaming: false }),

  openFloatingMode: (win, type) => set({ floatingState: type, pipWindow: win }),
  closeFloatingMode: () => set({ floatingState: 'none', pipWindow: null }),
  setIsUpgradeDialogOpen: (open) => set({ isUpgradeDialogOpen: open }),
  setUpgradeDialogMessage: (message) => set({ upgradeDialogMessage: message }),
  setUpgradeDialogTitle: (title) => set({ upgradeDialogTitle: title }),
  toggleSound: () => set((state) => ({ isSoundEnabled: !state.isSoundEnabled })),
  setIsSidebarOpen: (open) => set({ isSidebarOpen: open }),
}))
