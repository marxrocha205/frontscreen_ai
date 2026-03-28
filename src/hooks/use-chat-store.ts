import { create } from 'zustand'

export const AI_MODELS = [
  { id: 'gemini-1.5-flash', label: 'Gemini Flash' },
  { id: 'gemini-1.5-pro', label: 'Gemini Pro', badge: 'PRO' },
  { id: 'claude-3-opus', label: 'Claude 3 Opus', badge: 'TOP' }
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
  selectedModel: string
  floatingState: FloatingState
  pipWindow: Window | null

  addMessage: (message: Message) => void
  updateLastAssistantMessage: (content: string) => void
  setIsStreaming: (isStreaming: boolean) => void
  setCredits: (credits: number) => void
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
  selectedModel: AI_MODELS[0].id,
  floatingState: 'none',
  pipWindow: null,
  isSoundEnabled: true,

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
  setSelectedModel: (modelId) => set({ selectedModel: modelId }),
  clearMessages: () => set({ messages: [], isStreaming: false }),

  openFloatingMode: (win, type) => set({ floatingState: type, pipWindow: win }),
  closeFloatingMode: () => set({ floatingState: 'none', pipWindow: null }),
  toggleSound: () => set((state) => ({ isSoundEnabled: !state.isSoundEnabled })),
}))