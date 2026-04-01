import { useEffect, useRef, useCallback, useState } from 'react'
import { useChatStore } from './use-chat-store'
import { useConversations } from './use-conversations'
import { config } from '@/lib/config'

// -------------------------------------------------------------------
// MÁGICA: Variável global ao módulo para rastrear o áudio premium atual
let currentPremiumAudio: HTMLAudioElement | null = null;

// Função exportada que corta imediatamente qualquer áudio da IA
export function stopAllAudio() {
  // 1. Para o áudio Premium (OpenAI/Base64)
  if (currentPremiumAudio) {
    currentPremiumAudio.pause();
    currentPremiumAudio.currentTime = 0; // Volta ao início
    currentPremiumAudio = null;
  }
  // 2. Para o áudio Free (Navegador / SpeechSynthesis)
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function useWebsocket() {
  const { messages, isStreaming, addMessage, setIsStreaming, setCredits, setIsUpgradeDialogOpen, setUpgradeDialogMessage } = useChatStore()
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Inicia a ligação quando o hook é montado
  useEffect(() => {
    // Puxa o token que guardámos no Login
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    
    if (!token) {
      return // Sem token: o usuário não está logado, mas pode navegar livremente
    }

    const ws = new WebSocket(`${config.wsUrl}/ws/assistente?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log("Conectado ao ScreenAI Backend!")
      setIsConnected(true)
    }

    ws.onclose = (event) => {
      setIsConnected(false)
      if (event.code === 1008) {
        alert("Sessão Encerrada: A sua conta foi aberta noutro dispositivo.")
        // Opcional: window.location.href = '/login'
      }
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'ai_response':
          setIsStreaming(false)

          // ==========================================
          // NOVO: MÁGICA DA BARRA LATERAL AQUI!
          // Se o backend devolveu um session_id e nós não tínhamos um,
          // significa que uma nova conversa foi criada no banco.
          const { activeId, setActiveId, fetchConversations } = useConversations.getState()
          
          if (!activeId && data.session_id) {
            setActiveId(data.session_id) // Trava a tela nesta nova conversa
            fetchConversations() // Recarrega a barra lateral para ela aparecer lá
          }
          // ==========================================

          // 1. Renderiza a resposta de texto
          addMessage({ id: Date.now().toString(), role: 'assistant', content: data.message })
          stopAllAudio()
          
          // 2. Toca áudio só se o botão de som estiver ativado
          const { isSoundEnabled } = useChatStore.getState()
          if (isSoundEnabled) {
            if (data.audio_base64) {
              currentPremiumAudio = new Audio("data:audio/mp3;base64," + data.audio_base64)
              currentPremiumAudio.play().catch(e => console.error("Erro ao tocar áudio:", e))
            } else if (data.message) {
              const utterance = new SpeechSynthesisUtterance(data.message.replace(/[*#_]/g, ''))
              utterance.lang = 'pt-BR'
              window.speechSynthesis.speak(utterance)
            }
          }

          // 3. Atualiza os créditos na tela (A MÁGICA DA SPRINT 4)
          if (data.remaining_credits !== undefined) {
            setCredits(data.remaining_credits)
          }
          break;

        case 'transcription':
          // O backend transcreveu o nosso áudio
          addMessage({ id: Date.now().toString(), role: 'user', content: data.message })
          break;

        case 'error':
          setIsStreaming(false)
          if (data.message && data.message.includes('Créditos insuficientes')) {
            setUpgradeDialogMessage(data.message)
            setIsUpgradeDialogOpen(true)
          } else {
            addMessage({ id: Date.now().toString(), role: 'system', content: `⚠️ Aviso: ${data.message}` })
          }
          break;
      }
    }

    return () => {
      ws.close()
      if (wsRef.current === ws) {
      wsRef.current = null
      }
    }
  }, [addMessage, setIsStreaming, setCredits])

  // Função para enviar o Payload Multimodal
  const sendMessage = useCallback((payload: { text?: string, image_base64?: string, audio_base64?: string }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      
      // NOVO: Pega o ID da conversa atual no momento do envio
      const { activeId } = useConversations.getState()

      // Só adiciona a mensagem visualmente se houver texto escrito
      if (payload.text) {
        addMessage({ id: Date.now().toString(), role: 'user', content: payload.text })
      }
      
      setIsStreaming(true)

      // NOVO: Injeta o session_id no payload antes de enviar para o Python
      const finalPayload = {
        ...payload,
        session_id: activeId // Se for null, o Python criará uma conversa nova
      }

      wsRef.current.send(JSON.stringify(finalPayload))
    } else {
      alert("Aguarde a conexão com o servidor de IA.")
    }
  }, [addMessage, setIsStreaming])

  const sendCancel = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "cancel_generation" }))
    }
  }, [])

  return { messages, isConnected, isStreaming, sendMessage, sendCancel }
}