import { useEffect, useRef, useCallback, useState } from 'react'
import { useChatStore } from './use-chat-store'
import { useConversations } from './use-conversations'
import { config } from '@/lib/config'
import { useAuth } from './use-auth'

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

function getInterruptedMessage() {
  if (typeof document !== 'undefined' && document.documentElement.lang !== 'pt-BR') {
    return 'Response interrupted'
  }

  return 'Resposta interrompida'
}

function markGenerationCancelled() {
  const interruptedMessage = getInterruptedMessage()

  useChatStore.setState((state) => {
    const streamingIndex = state.messages.findIndex((message) => message.id === 'streaming-msg')

    if (streamingIndex !== -1) {
      const streamingMessage = state.messages[streamingIndex]

      if (streamingMessage.content.trim().length > 0) {
        return { messages: state.messages }
      }

      const previousMessage = state.messages[streamingIndex - 1]
      if (previousMessage?.role === 'assistant' && previousMessage.content === interruptedMessage) {
        return {
          messages: [
            ...state.messages.slice(0, streamingIndex),
            ...state.messages.slice(streamingIndex + 1)
          ]
        }
      }

      return {
        messages: [
          ...state.messages.slice(0, streamingIndex),
          {
            ...streamingMessage,
            id: Date.now().toString(),
            content: interruptedMessage
          },
          ...state.messages.slice(streamingIndex + 1)
        ]
      }
    }

    const lastMessage = state.messages[state.messages.length - 1]
    if (lastMessage?.role === 'assistant' && lastMessage.content === interruptedMessage) {
      return { messages: state.messages }
    }

    const { selectedModel, selectedAgentId } = state
    return {
      messages: [
        ...state.messages,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: interruptedMessage,
          model: selectedModel,
          agent_id: selectedAgentId
        }
      ]
    }
  })
}

export function useWebsocket() {
  const { messages, isStreaming, addMessage, setIsStreaming, setCredits, setIsUpgradeDialogOpen, setUpgradeDialogMessage, setInlineUpsell } = useChatStore()
  const { isLoggedIn, syncFromStorage } = useAuth()
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [reconnectKey, setReconnectKey] = useState(0)

  useEffect(() => {
    syncFromStorage()

    const requestReconnect = () => {
      syncFromStorage()
      const readyState = wsRef.current?.readyState
      if (readyState !== WebSocket.OPEN && readyState !== WebSocket.CONNECTING) {
        setReconnectKey((key) => key + 1)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestReconnect()
      }
    }

    window.addEventListener('pageshow', requestReconnect)
    window.addEventListener('focus', requestReconnect)
    window.addEventListener('online', requestReconnect)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pageshow', requestReconnect)
      window.removeEventListener('focus', requestReconnect)
      window.removeEventListener('online', requestReconnect)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [syncFromStorage])

  // Inicia a ligação quando o hook é montado
  useEffect(() => {
    if (!isLoggedIn) {
      return
    }

    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return
    }

    // Puxa o token que guardámos no Login
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

    if (!token) {
      syncFromStorage()
      return // Sem token: o usuário não está logado, mas pode navegar livremente
    }

    const ws = new WebSocket(`${config.wsUrl}/ws/assistente?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      if (wsRef.current !== ws) return
      console.log("Conectado ao ScreenAI Backend!")
      setIsConnected(true)
    }

    ws.onclose = (event) => {
      if (wsRef.current !== ws) return
      setIsConnected(false)
      if (event.code === 1008) {
        alert("Sessão Encerrada: A sua conta foi aberta noutro dispositivo.")
      }
    }

    ws.onmessage = (event) => {
      if (wsRef.current !== ws) return
      const data = JSON.parse(event.data)

      switch (data.type) {
        // =======================================================
        // 1. MÁGICA DO STREAMING: A IA vai começar a falar
        // =======================================================
        case 'stream_start':
          if (!useChatStore.getState().isStreaming) {
            break;
          }

          // CORREÇÃO CRÍTICA: NÃO desligamos o setIsStreaming(false) aqui!
          // O estado isStreaming deve continuar TRUE para a UI de Loading continuar a piscar
          // enquanto aguardamos o primeiro "chunk" de texto real vindo da API da IA.

          // Puxa a sessão e trava a barra lateral (Sidebar) IMEDIATAMENTE
          const { activeId, setActiveId, fetchConversations } = useConversations.getState()
          if (!activeId && data.session_id) {
            setActiveId(data.session_id)
            fetchConversations()
          }

          // Cria uma "bolha" de mensagem vazia na tela com um ID temporário
          const storeState = useChatStore.getState()
          const startModel = storeState.selectedModel === 'screen-ai-1.2' ? 'screen-ai-1.2' : data.model || storeState.selectedModel
          const startAgentId = data.agent_id || storeState.selectedAgentId

          console.log('%c[WS][stream_start] ✅ Streaming iniciado. Modelo atribuído à mensagem:', 'color: #34d399; font-weight: bold', startModel || '(não definido)')
          addMessage({ 
            id: 'streaming-msg', 
            role: 'assistant', 
            content: '',
            model: startModel,
            agent_id: startAgentId 
          })
          break;

        // =======================================================
        // 2. MÁGICA DO STREAMING: Efeito de Digitação (Chunks)
        // =======================================================
        case 'chunk':
          // Oculta os pontinhos de "pensando" assim que o texto começa a aparecer
          setIsStreaming(false)
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
          // AGORA SIM! A resposta terminou, podemos desligar o modo streaming/loading.
          setIsStreaming(false)
          
          const currentStoreState = useChatStore.getState()
          console.log('%c[WS][ai_response] ✅ Resposta final recebida do backend:', 'color: #22c55e; font-weight: bold')
          console.log('%c[WS][ai_response] Modelo que o frontend associou à resposta:', 'color: #22c55e', currentStoreState.selectedModel)
          console.log('%c[WS][ai_response] Model field no evento WS:', 'color: #22c55e', data.model || '(backend não enviou campo model no evento)')

          if (data.session_id) {
            const { activeId, setActiveId, fetchConversations } = useConversations.getState()
            if (!activeId) {
              setActiveId(data.session_id)
            }
            fetchConversations()
          }

          // Como já preenchemos o texto via 'chunk', apenas atualizamos a bolha com o ID real 
          // e garantimos que o texto final está 100% perfeito.
          const msgs = currentStoreState.messages;
          const finalModel = currentStoreState.selectedModel === 'screen-ai-1.2' ? 'screen-ai-1.2' : data.model || currentStoreState.selectedModel;
          const finalAgentId = data.agent_id || currentStoreState.selectedAgentId;

          if (msgs.length > 0) {
            const lastMsgIndex = msgs.length - 1;
            const lastMsg = msgs[lastMsgIndex];

            if (lastMsg.role === 'assistant' && lastMsg.id === 'streaming-msg') {
              useChatStore.setState({
                messages: [
                  ...msgs.slice(0, lastMsgIndex),
                  { 
                    ...lastMsg, 
                    id: Date.now().toString(), 
                    content: data.message,
                    model: lastMsg.model || finalModel,
                    agent_id: finalAgentId
                  }
                ]
              });
            } else {
              // Se por acaso a IA não mandou 'stream_start' (ex: um erro rápido da API), 
              // cria a bolha inteira de uma vez.
              addMessage({ 
                id: Date.now().toString(), 
                role: 'assistant', 
                content: data.message,
                model: finalModel,
                agent_id: finalAgentId
              })
            }
          } else {
            addMessage({ 
              id: Date.now().toString(), 
              role: 'assistant', 
              content: data.message,
              model: finalModel,
              agent_id: finalAgentId
            })
          }

          // Toca áudio vindo do servidor (caso ainda venha algum, embora desativado no backend)
          const { isSoundEnabled } = useChatStore.getState()
          if (isSoundEnabled && data.audio_base64) {
            currentPremiumAudio = new Audio("data:audio/mp3;base64," + data.audio_base64)
            currentPremiumAudio.play().catch(e => console.error("Erro ao tocar áudio:", e))
          }

          // Atualiza os créditos na tela
          if (data.remaining_credits !== undefined) {
            setCredits(data.remaining_credits)
          }

          // Upsell inline: dispara card no chat quando o backend envia oferta contextual
          if (data.upsell?.message) {
            setInlineUpsell({
              message: data.upsell.message,
              remainingCredits: data.upsell.remaining_credits ?? data.remaining_credits,
              threshold: data.upsell.threshold,
            })
          }
          break;

        case 'transcription':
          addMessage({ id: Date.now().toString(), role: 'user', content: data.message })
          break;

        case 'error':
          setIsStreaming(false) // Desliga o loading em caso de erro também
          if (data.message && data.message.includes('Créditos insuficientes')) {
            setUpgradeDialogMessage(data.message)
            setIsUpgradeDialogOpen(true)
          } else {
            addMessage({ id: Date.now().toString(), role: 'system', content: `⚠️ Aviso: ${data.message}` })
          }
          break;

        case 'cancelled':
          setIsStreaming(false)
          stopAllAudio()
          markGenerationCancelled()
          break;
      }
    }

    return () => {
      ws.close()
      if (wsRef.current === ws) {
        wsRef.current = null
      }
    }
  }, [isLoggedIn, reconnectKey, syncFromStorage, addMessage, setIsStreaming, setCredits, setIsUpgradeDialogOpen, setUpgradeDialogMessage, setInlineUpsell])

  // Função para enviar o Payload Multimodal
  const sendMessage = useCallback((payload: { text?: string, image_base64?: string, audio_base64?: string }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {

      const { activeId } = useConversations.getState()
      // 1. CAPTURAR O MODELO E AGENTE SELECIONADOS NO STORE
      const { selectedModel, selectedAgentId } = useChatStore.getState()

      if (payload.text) {
        addMessage({ id: Date.now().toString(), role: 'user', content: payload.text })
      }

      setIsStreaming(true)

      // 2. ADICIONAR AO PAYLOAD FINAL
      const finalPayload = {
        ...payload,
        session_id: activeId,
        language: document.documentElement.lang || 'pt-BR',
        model: selectedModel && selectedModel !== '' ? selectedModel : undefined, // <-- A MÁGICA ACONTECE AQUI
        agent_id: selectedAgentId && selectedAgentId !== '' ? selectedAgentId : undefined // <-- A MÁGICA DO AGENTE AQUI
      }
      
      console.log('%c[WS][SEND] ========================================', 'color: #818cf8; font-weight: bold')
      console.log('%c[WS][SEND] 🧠 Modelo selecionado no store:', 'color: #818cf8', selectedModel || '(vazio - usa padrão do backend)')
      console.log('%c[WS][SEND] Agente selecionado:', 'color: #818cf8', selectedAgentId || '(nenhum)')
      console.log('%c[WS][SEND] Payload completo enviado ao backend:', 'color: #818cf8', JSON.stringify(finalPayload, null, 2))
      console.log('%c[WS][SEND] ========================================', 'color: #818cf8; font-weight: bold')
      
      wsRef.current.send(JSON.stringify(finalPayload))
    } else {
      alert("Aguarde a conexão com o servidor de IA.")
    }
  }, [addMessage, setIsStreaming])

  const sendCancel = useCallback(() => {
    setIsStreaming(false)
    stopAllAudio()
    markGenerationCancelled()

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "cancel_generation" }))
    }
  }, [setIsStreaming])

  return { messages, isConnected, isStreaming, sendMessage, sendCancel }
}
