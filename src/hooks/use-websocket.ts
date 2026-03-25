import { useEffect, useRef, useCallback, useState } from 'react'
import { useChatStore } from './use-chat-store'

export function useWebsocket() {
  const { messages, isStreaming, addMessage, setIsStreaming, setCredits } = useChatStore()
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Inicia a ligação quando o hook é montado
  useEffect(() => {
    // Puxa o token que guardámos no Login
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    
    if (!token) {
      console.error("Sem token de autenticação. Redirecionando para o login...")
      if (typeof window !== 'undefined') {
          window.location.href = '/login' // Expulsa o utilizador para a tela de login
      }
      return
    }

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/assistente?token=${token}`)
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
          // 1. Renderiza a resposta de texto
          addMessage({ id: Date.now().toString(), role: 'assistant', content: data.message })
          
          // 2. Toca o áudio realista (se for plano pago) ou fallback (se for Free)
          if (data.audio_base64) {
            const audio = new Audio("data:audio/mp3;base64," + data.audio_base64)
            audio.play().catch(e => console.error("Erro ao tocar áudio:", e))
          } else if (data.message) {
            // Fallback para vozes gratuitas do navegador (Plano Free)
            const utterance = new SpeechSynthesisUtterance(data.message.replace(/[*#_]/g, ''))
            utterance.lang = 'pt-BR'
            window.speechSynthesis.speak(utterance)
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
          addMessage({ id: Date.now().toString(), role: 'system', content: `⚠️ Aviso: ${data.message}` })
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
      
      // Só adiciona a mensagem visualmente se houver texto escrito
      if (payload.text) {
        addMessage({ id: Date.now().toString(), role: 'user', content: payload.text })
      }
      
      setIsStreaming(true)
      wsRef.current.send(JSON.stringify(payload))
    } else {
      alert("Aguarde a conexão com o servidor de IA.")
    }
  }, [addMessage, setIsStreaming])

  return { messages, isConnected, isStreaming, sendMessage }
}