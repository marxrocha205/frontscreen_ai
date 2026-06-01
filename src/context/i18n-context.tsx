"use client"

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react'
import { translations, Language, TranslationKey } from '@/locales'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'screenai-lang'
const LANGUAGE_CHANGE_EVENT = 'screenai-language-change'

const getServerLanguageSnapshot = (): Language => 'pt-BR'

const getLanguageSnapshot = (): Language => {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null
    if (saved && translations[saved]) return saved
  } catch {
    return getServerLanguageSnapshot()
  }

  const browserLang = navigator.language.split('-')[0]
  if (browserLang === 'pt') return 'pt-BR'
  if (browserLang === 'es') return 'es-ES'
  return 'en-US'
}

const subscribeToLanguageChanges = (callback: () => void) => {
  window.addEventListener('storage', callback)
  window.addEventListener(LANGUAGE_CHANGE_EVENT, callback)

  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, callback)
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(
    subscribeToLanguageChanges,
    getLanguageSnapshot,
    getServerLanguageSnapshot
  )

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const handleSetLanguage = (lang: Language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT))
  }

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
