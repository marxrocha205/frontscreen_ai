import { create } from 'zustand'
import { useAuth } from './use-auth'
import { config } from '@/lib/config'
import { useChatStore } from './use-chat-store'
import { stopAllAudio } from './use-websocket'


export interface Conversation {
  id: string
  title: string
  agent_id?: string
  created_at: string
  updated_at: string
}

interface ConversationMessage {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string
  agent_id?: string
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
        const errorText = await res.text()
        console.error("Falha ao buscar conversas:", errorText)
        if (res.status === 401 || errorText.includes("Token expirado")) {
          // Se o token expirou, desloga o usuário para forçar novo login
          const { logout } = useAuth.getState()
          logout()
        }
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
    
    // Restaurar agente selecionado se houver
    const session = get().conversations.find((c) => c.id === id)
    const { clearMessages, addMessage, setSelectedAgentId } = useChatStore.getState()
    
    if (session && session.agent_id) {
      setSelectedAgentId(session.agent_id)
    } else {
      setSelectedAgentId('') // fallback para assistente geral
    }
    
    clearMessages()

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (!token) return

      const res = await fetch(`${config.apiUrl}/api/chat/sessions/${id}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const messages = await res.json()
        
        messages.forEach((msg: ConversationMessage) => {
          addMessage({
            id: msg.id || Date.now().toString() + Math.random(),
            role: msg.role,
            content: msg.content,
            model: msg.model,
            agent_id: msg.agent_id
          })
        })
      } else {
        const errorText = await res.text()
        console.error("Erro ao carregar mensagens:", errorText)
        if (res.status === 401 || errorText.includes("Token expirado")) {
          useAuth.getState().logout()
        }
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens antigas:", error)
    }
  },

  deleteConversation: async (id: string) => {
    // Salva o estado anterior para rollback em caso de erro
    const previousConversations = get().conversations
    const previousActiveId = get().activeId

    // 1. Atualização Otimista: Remove da UI imediatamente
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeId: state.activeId === id ? null : state.activeId
    }))

    // Se era a conversa ativa, limpa a tela imediatamente
    if (previousActiveId === id) {
      useChatStore.getState().clearMessages()
      stopAllAudio()
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (!token) {
        // Rollback
        set({ conversations: previousConversations, activeId: previousActiveId })
        return
      }

      const res = await fetch(`${config.apiUrl}/api/chat/sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        // Rollback em caso de erro do servidor
        set({ conversations: previousConversations, activeId: previousActiveId })
        const errorText = await res.text()
        console.error("Erro ao excluir conversa:", errorText)
        if (res.status === 401 || errorText.includes("Token expirado")) {
          useAuth.getState().logout()
        }
      }
    } catch (error) {
      // Rollback em caso de erro de rede
      set({ conversations: previousConversations, activeId: previousActiveId })
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
        const errorText = await res.text()
        console.error("Erro ao renomear conversa:", errorText)
        if (res.status === 401 || errorText.includes("Token expirado")) {
          useAuth.getState().logout()
        }
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
