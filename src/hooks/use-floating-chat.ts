"use client"

import { useCallback } from 'react'
import { useChatStore } from './use-chat-store'

/**
 * Copia todas as folhas de estilo CSS da aba principal para a janela de destino (PiP ou Popup).
 * É isso que garante que o componente de chat terá a mesma aparência visual fora da aba principal.
 */
function syncStylesheets(targetDoc: Document) {
  // Copia as classes do <html> e <body> da página original
  // Isso carrega a fonte (Inter) gerada pelo Next.js e também o tema (dark mode)
  targetDoc.documentElement.className = document.documentElement.className
  targetDoc.body.className = document.body.className

  // Limpa estilos antigos para não duplicar se o chat for aberto e fechado várias vezes
  targetDoc.head.innerHTML = '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">'

  // Copia todos os estilos (tanto <link> quando <style>) da aba principal
  Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach((el) => {
    targetDoc.head.appendChild(el.cloneNode(true))
  })

  // Aplica estilos base no body da nova janela para remover espaços brancos e rolagem
  targetDoc.body.style.margin = '0'
  targetDoc.body.style.padding = '0'
  targetDoc.body.style.width = '100vw'
  targetDoc.body.style.height = '100vh'
  targetDoc.body.style.overflow = 'hidden'
  targetDoc.body.style.backgroundColor = '#0a0a0a'
}

export function useFloatingChat() {
  const { closeFloatingMode, openFloatingMode, floatingState } = useChatStore()

  const openChat = useCallback(async () => {
    // Segurança: não abre dois popups ao mesmo tempo
    if (floatingState !== 'none') {
      closeFloatingMode()
      return
    }

    const width = 420
    const height = 620

    // CAMINHO 1: Document Picture-in-Picture (Chrome, Edge, Opera, Brave)
    // Essa API permite o popup flutuante com interface completa (botões, texto, etc.)
    if ('documentPictureInPicture' in window) {
      try {
        const pipWin = await (window as unknown as { documentPictureInPicture: { requestWindow: (opts: object) => Promise<Window> } })
          .documentPictureInPicture.requestWindow({ width, height })

        syncStylesheets(pipWin.document)

        // Registra o fechamento automático ao "X" da janelinha
        pipWin.addEventListener('pagehide', () => closeFloatingMode())

        openFloatingMode(pipWin, 'pip')
        return
      } catch (err) {
        console.warn('[FloatingChat] Document PiP falhou, usando popup como fallback.', err)
      }
    }

    // CAMINHO 2: Popup clássico via window.open (Safari, Firefox, mobile)
    // Abre uma janele minimalista sem barra de endereço
    const popupFeatures = `width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no,scrollbars=no`
    const popup = window.open('', 'ScreenAIChatPopup', popupFeatures)

    if (!popup) {
      alert('Seu navegador bloqueou o popup. Por favor, permita popups para este site nas configurações do navegador.')
      return
    }

    syncStylesheets(popup.document)
    popup.document.title = 'ScreenAI Chat'

    // Registra o fechamento automático ao "X" da janela
    popup.addEventListener('beforeunload', () => closeFloatingMode())

    openFloatingMode(popup, 'popup')
  }, [floatingState, openFloatingMode, closeFloatingMode])

  return { openChat }
}
