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
    return (
      <div className="w-full h-full flex flex-col">
        {createPortal(chatUI, portalContainer)}
        <div className="flex flex-col items-center justify-center flex-1 w-full text-zinc-400 gap-4 bg-[#0a0a0a]">
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50 flex flex-col items-center gap-3">
            <span className="text-2xl font-semibold text-zinc-200">Chat Flutuante Aberto</span>
            <span className="text-sm text-center max-w-sm">
              Sua conversa está ativa em uma janela flutuante. Feche-a para continuar interagindo na tela principal.
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Caso contrário, renderiza normalmente na tela principal
  return chatUI
}