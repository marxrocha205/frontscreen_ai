import { useCallback } from 'react'
import { useChatStore, Message } from './use-chat-store'

export function useWebsocket() {
  const { messages, isStreaming, addMessage, updateLastAssistantMessage, setIsStreaming, selectedModel } = useChatStore()

  const sendMessage = useCallback((content: string) => {
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content }
    addMessage(newUserMsg)
    
    // Simulate assistant streaming response
    setIsStreaming(true)
    setTimeout(() => {
      const id = (Date.now() + 1).toString()
      const simulateText = `[${selectedModel.label}] Para analisar estes dados, recomendo olharmos as tendências de crescimento ao longo dos últimos 6 meses. Gostaria de focar em algum período específico?`
      let currentIdx = 0
      
      const assistantMsg: Message = { id, role: 'assistant', content: '' }
      addMessage(assistantMsg)
      
      const interval = setInterval(() => {
        currentIdx++
        const partial = simulateText.substring(0, currentIdx)
        updateLastAssistantMessage(partial)
        
        if (currentIdx >= simulateText.length) {
          clearInterval(interval)
          setIsStreaming(false)
        }
      }, 30) // 30ms per char
    }, 500)
  }, [addMessage, updateLastAssistantMessage, setIsStreaming])

  return { messages, isConnected: true, isStreaming, sendMessage }
}
