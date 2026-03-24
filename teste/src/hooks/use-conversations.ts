import { create } from 'zustand'

export interface Conversation {
  id: string
  title: string
}

interface ConversationsState {
  conversations: Conversation[]
  addConversation: (title: string) => void
  removeConversation: (id: string) => void
}

export const useConversations = create<ConversationsState>((set) => ({
  conversations: [],
  addConversation: (title) => set((state) => ({
    conversations: [{ id: Date.now().toString(), title }, ...state.conversations]
  })),
  removeConversation: (id) => set((state) => ({
    conversations: state.conversations.filter(c => c.id !== id)
  }))
}))
