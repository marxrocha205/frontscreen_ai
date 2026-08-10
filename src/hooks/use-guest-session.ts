import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GuestSessionState {
  guestCredits: number
  hasSeenWelcomeModal: boolean
  setGuestCredits: (credits: number) => void
  decrementGuestCredits: (amount?: number) => void
  setHasSeenWelcomeModal: (seen: boolean) => void
  clearGuestSession: () => void
}

export const useGuestSession = create<GuestSessionState>()(
  persist(
    (set) => ({
      guestCredits: typeof window !== 'undefined' && window.innerWidth < 768 ? 10 : 20, 
      hasSeenWelcomeModal: false,
      setGuestCredits: (credits) => set({ guestCredits: credits }),
      decrementGuestCredits: (amount = 1) => 
        set((state) => ({ guestCredits: Math.max(0, state.guestCredits - amount) })),
      setHasSeenWelcomeModal: (seen) => set({ hasSeenWelcomeModal: seen }),
      clearGuestSession: () => set({ guestCredits: typeof window !== 'undefined' && window.innerWidth < 768 ? 10 : 20 }), 
    }),
    {
      name: 'guest-session-storage',
    }
  )
)
