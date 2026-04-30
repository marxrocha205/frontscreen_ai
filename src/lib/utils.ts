import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function isMobileDevice() {
  if (typeof window === 'undefined') return false
  
  const isSmallScreen = window.innerWidth < 768
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  // Se for uma tela pequena E (tiver touch OU UA mobile), consideramos mobile.
  // Isso permite laptops com touch e iPads em modo desktop (que são largos) funcionarem.
  return isSmallScreen && (isMobileUA || navigator.maxTouchPoints > 0)
}
