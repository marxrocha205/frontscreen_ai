import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  isLoggedIn: boolean
  user: { email: string } | null
  login: (email: string) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      login: (email) => set({ isLoggedIn: true, user: { email } }),
      logout: () => {
        // Remove o token do navegador por segurança
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
        }
        set({ isLoggedIn: false, user: null })
      },
    }),
    {
      name: 'screenai-auth',
    }
  )
)