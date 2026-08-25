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

export function formatErrorMessage(detail: any, defaultMsg = 'Erro inesperado'): string {
  if (!detail) return defaultMsg
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map(item => (typeof item === 'object' && item !== null ? item.msg || item.message || JSON.stringify(item) : String(item)))
      .join('; ')
  }
  if (typeof detail === 'object') {
    return detail.message || detail.msg || detail.detail || JSON.stringify(detail)
  }
  return String(detail)
}
