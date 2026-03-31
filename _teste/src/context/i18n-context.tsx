"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, Language, TranslationKey } from '@/locales'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('pt-BR')

  // Optional: load from localStorage or detect browser lang
  useEffect(() => {
    const saved = localStorage.getItem('screenai-lang') as Language
    if (saved && translations[saved]) {
      setLanguage(saved)
    } else {
      const browserLang = navigator.language.split('-')[0] // e.g. "pt" from "pt-BR"
      if (browserLang === 'pt') setLanguage('pt-BR')
      else if (browserLang === 'es') setLanguage('es-ES')
      else setLanguage('en-US')
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('screenai-lang', lang)
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
