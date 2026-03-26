"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useChatStore } from '@/hooks/use-chat-store'
import { ChatInterface } from '@/components/chat-interface'

/**
 * Página principal do Chat.
 * Quando o modo flutuante (PiP ou Popup) está ativo, o <ChatInterface /> é
 * "teletransportado" via createPortal para o body da janela externa, sem recriar
 * qualquer WebSocket ou estado do Zustand.
 * Quando o modo está inativo, o <ChatInterface /> renderiza normalmente na página.
 */
export default function ChatPage() {
  const { floatingState, pipWindow } = useChatStore()
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (pipWindow && floatingState !== 'none') {
      // Garante que o body da janela externa já existe antes de fazer o portal
      const timer = setTimeout(() => {
        setPortalContainer(pipWindow.document.body)
      }, 0)
      return () => clearTimeout(timer)
    } else {
      setPortalContainer(null)
    }
  }, [floatingState, pipWindow])

  const chatUI = <ChatInterface />

  // Se temos uma janela externa esperando, usamos o portal para renderizar lá
  if (portalContainer) {
    return createPortal(chatUI, portalContainer)
  }

  // Caso contrário, renderiza normalmente na tela principal
  return chatUI
}