import { create } from 'zustand'
import { config } from '@/lib/config'
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
  deleteConversation: (id: string) => Promise<void>
  renameConversation: (id: string, newTitle: string) => Promise<void>
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

      const res = await fetch(`${config.apiUrl}/api/chat/sessions`, {
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

      const res = await fetch(`${config.apiUrl}/api/chat/sessions/${id}/messages`, {
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

  deleteConversation: async (id: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (!token) return

      const res = await fetch(`${config.apiUrl}/api/chat/sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        // Remove da lista local
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          // Se era a conversa ativa, limpa a tela
          activeId: state.activeId === id ? null : state.activeId
        }))

        // Se era a conversa ativa, limpa as mensagens no chat store
        if (get().activeId === null) {
          useChatStore.getState().clearMessages()
          stopAllAudio()
        }
      } else {
        console.error("Erro ao excluir conversa:", await res.text())
      }
    } catch (error) {
      console.error("Erro de rede ao excluir conversa:", error)
    }
  },

  renameConversation: async (id: string, newTitle: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (!token) return

      const res = await fetch(`${config.apiUrl}/api/chat/sessions/${id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTitle })
      })

      if (res.ok) {
        set((state) => ({
          conversations: state.conversations.map((c) => c.id === id ? { ...c, title: newTitle } : c)
        }))
      } else {
        console.error("Erro ao renomear conversa:", await res.text())
      }
    } catch (error) {
      console.error("Erro de rede ao renomear conversa:", error)
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