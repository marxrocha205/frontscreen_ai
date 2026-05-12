import { create } from 'zustand'

const getStoredToken = () => {
  if (typeof window === 'undefined') return null

  try {
    const localToken = localStorage.getItem('access_token')
    if (localToken) return localToken
  } catch {}

  const cookieToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('access_token='))
    ?.split('=')[1]

  if (cookieToken) {
    const decodedToken = decodeURIComponent(cookieToken)
    try {
      localStorage.setItem('access_token', decodedToken)
    } catch {}
    return decodedToken
  }

  return null
}

const clearStoredToken = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('access_token')
    localStorage.removeItem('screenai-auth')
  } catch {}
  document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
}

const getEmailFromToken = (token: string) => {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(window.atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof decoded.email === 'string' ? decoded.email : ''
  } catch {
    return ''
  }
}

interface AuthState {
  hasHydrated: boolean
  isLoggedIn: boolean
  user: { email: string } | null
  login: (email: string) => void
  logout: () => void
  syncFromStorage: () => void
}

export const useAuth = create<AuthState>((set) => ({
  hasHydrated: false,
  isLoggedIn: false,
  user: null,
  login: (email) => set({ hasHydrated: true, isLoggedIn: true, user: { email } }),
  logout: () => {
    clearStoredToken()
    set({ hasHydrated: true, isLoggedIn: false, user: null })
  },
  syncFromStorage: () => {
    try {
      const token = getStoredToken()
      if (!token) {
        set({ hasHydrated: true, isLoggedIn: false, user: null })
        return
      }

      const email = getEmailFromToken(token)
      set((state) => ({
        hasHydrated: true,
        isLoggedIn: true,
        user: state.user?.email ? state.user : { email }
      }))
    } catch (error) {
      console.error('Falha ao sincronizar autenticação:', error)
      set({ hasHydrated: true, isLoggedIn: false, user: null })
    }
  },
}))
