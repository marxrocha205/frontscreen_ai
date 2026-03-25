import { create } from 'zustand'
import { useChatStore } from './use-chat-store'
import { stopAllAudio } from './use-websocket'


export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface ConversationsState {
  conversations: Conversation[]
  activeId: string | null
  isLoading: boolean
  
  // Ações
  fetchConversations: () => Promise<void>
  loadConversation: (id: string) => Promise<void>
  createNewConversation: () => void
  setActiveId: (id: string) => void // NOVO: Para setar o ID após a 1ª mensagem
}

export const useConversations = create<ConversationsState>((set, get) => ({
  conversations: [],
  activeId: null,
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true })
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (!token) return

      const res = await fetch('http://127.0.0.1:8000/api/chat/sessions', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        set({ conversations: data })
      } else {
        console.error("Falha ao buscar conversas:", await res.text())
      }
    } catch (error) {
      console.error("Erro de rede ao buscar conversas:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  loadConversation: async (id: string) => {
    stopAllAudio()
    set({ activeId: id })
    
    const { clearMessages, addMessage } = useChatStore.getState()
    clearMessages()

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (!token) return

      const res = await fetch(`http://127.0.0.1:8000/api/chat/sessions/${id}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const messages = await res.json()
        
        messages.forEach((msg: any) => {
          addMessage({
            id: msg.id || Date.now().toString() + Math.random(),
            role: msg.role,
            content: msg.content
          })
        })
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens antigas:", error)
    }
  },

  createNewConversation: () => {
    stopAllAudio()
    set({ activeId: null })
    useChatStore.getState().clearMessages()
  },

  // NOVO: Função para o input de chat atualizar o ID ativo
  setActiveId: (id: string) => set({ activeId: id }) 
}))