import { create } from 'zustand'

// RESTAURADO: Constante de modelos que o seu layout.tsx exige
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

interface ChatState {
  messages: Message[]
  isStreaming: boolean
  credits: number | null // NOVO: Estado dos créditos
  selectedModel: string  // RESTAURADO: Modelo selecionado
  
  addMessage: (message: Message) => void
  updateLastAssistantMessage: (content: string) => void
  setIsStreaming: (isStreaming: boolean) => void
  setCredits: (credits: number) => void // NOVO: Função para atualizar créditos
  setSelectedModel: (modelId: string) => void // RESTAURADO
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  credits: null,
  selectedModel: AI_MODELS[0].id, // Valor padrão restaurado
  
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
}))