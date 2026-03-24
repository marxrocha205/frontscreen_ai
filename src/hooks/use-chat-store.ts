import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isError?: boolean
  errorType?: 'out_of_credits' | string
}

export const AI_MODELS = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', badge: 'Recommended' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', badge: null },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', badge: null },
]

interface ChatState {
  messages: Message[]
  isStreaming: boolean
  selectedModel: typeof AI_MODELS[0]
  addMessage: (message: Message) => void
  updateLastAssistantMessage: (content: string) => void
  setIsStreaming: (isStreaming: boolean) => void
  setSelectedModel: (model: typeof AI_MODELS[0]) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  selectedModel: AI_MODELS[0],
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
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  clearMessages: () => set({ messages: [], isStreaming: false }),
}))
