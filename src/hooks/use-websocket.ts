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
      }
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        // =======================================================
        // 1. MÁGICA DO STREAMING: A IA vai começar a falar
        // =======================================================
        case 'stream_start':
          // Desliga a animação de loading/pensando
          setIsStreaming(false) 

          // Puxa a sessão e trava a barra lateral (Sidebar) IMEDIATAMENTE
          const { activeId, setActiveId, fetchConversations } = useConversations.getState()
          if (!activeId && data.session_id) {
            setActiveId(data.session_id)
            fetchConversations()
          }

          // Cria uma "bolha" de mensagem vazia na tela com um ID temporário
          addMessage({ id: 'streaming-msg', role: 'assistant', content: '' })
          break;

        // =======================================================
        // 2. MÁGICA DO STREAMING: Efeito de Digitação (Chunks)
        // =======================================================
        case 'chunk':
          // Pegamos no estado atual das mensagens na tela
          const currentMessages = useChatStore.getState().messages;
          if (currentMessages.length > 0) {
            const lastMsgIndex = currentMessages.length - 1;
            const lastMsg = currentMessages[lastMsgIndex];
            
            // Se a última bolha for da IA, anexamos o pedacinho (chunk) ao texto dela
            if (lastMsg.role === 'assistant') {
              useChatStore.setState({
                messages: [
                  ...currentMessages.slice(0, lastMsgIndex),
                  { ...lastMsg, content: lastMsg.content + data.text }
                ]
              });
            }
          }
          break;

        // =======================================================
        // 3. FINALIZAÇÃO: Áudio e Cobrança
        // =======================================================
        case 'ai_response':
          setIsStreaming(false) // Fallback de segurança

          // Como já preenchemos o texto via 'chunk', apenas atualizamos a bolha com o ID real 
          // e garantimos que o texto final está 100% perfeito.
          const msgs = useChatStore.getState().messages;
          if (msgs.length > 0) {
            const lastMsgIndex = msgs.length - 1;
            const lastMsg = msgs[lastMsgIndex];
            
            if (lastMsg.role === 'assistant' && lastMsg.id === 'streaming-msg') {
              useChatStore.setState({
                messages: [
                  ...msgs.slice(0, lastMsgIndex),
                  { ...lastMsg, id: Date.now().toString(), content: data.message }
                ]
              });
            } else {
              // Se por acaso a IA não mandou 'stream_start' (ex: um erro rápido da API), 
              // cria a bolha inteira de uma vez.
              addMessage({ id: Date.now().toString(), role: 'assistant', content: data.message })
            }
          } else {
             addMessage({ id: Date.now().toString(), role: 'assistant', content: data.message })
          }

          stopAllAudio()
          
          // Toca áudio só se o botão de som estiver ativado
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

          // Atualiza os créditos na tela
          if (data.remaining_credits !== undefined) {
            setCredits(data.remaining_credits)
          }
          break;

        case 'transcription':
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
  }, [addMessage, setIsStreaming, setCredits, setIsUpgradeDialogOpen, setUpgradeDialogMessage])

  // Função para enviar o Payload Multimodal
  const sendMessage = useCallback((payload: { text?: string, image_base64?: string, audio_base64?: string }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      
      const { activeId } = useConversations.getState()

      if (payload.text) {
        addMessage({ id: Date.now().toString(), role: 'user', content: payload.text })
      }
      
      setIsStreaming(true)

      const finalPayload = {
        ...payload,
        session_id: activeId 
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