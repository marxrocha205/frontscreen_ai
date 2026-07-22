/**
 * Tipagem derivada automaticamente do pt-BR (fonte de verdade).
 * Se uma chave existir em pt-BR mas não aqui, o TypeScript reclama.
 */
import type ptBR from './pt-BR'

export type TranslationKey = keyof typeof ptBR
export type TranslationRecord = Record<TranslationKey, string>
export type Language = 'pt-BR' | 'en-US' | 'es-ES'
