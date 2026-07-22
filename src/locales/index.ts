/**
 * Ponto de entrada centralizado para o sistema de traduções.
 * Re-exporta os tipos e monta o objeto `translations` usado pelo I18nProvider.
 */
import ptBR from './pt-BR'
import enUS from './en-US'
import esES from './es-ES'

export type { TranslationKey, TranslationRecord, Language } from './types'

export const translations = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es-ES': esES,
} as const
