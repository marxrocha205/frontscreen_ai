import { useCallback, useRef } from 'react'
import { useChatStore, Message } from './use-chat-store'

export function useWebsocket() {
  const { messages, isStreaming, addMessage, updateLastAssistantMessage, setIsStreaming, selectedModel } = useChatStore()

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const stopMessage = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsStreaming(false)
  }, [setIsStreaming])

  const sendMessage = useCallback((content: string) => {
    stopMessage()
    
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content }
    addMessage(newUserMsg)
    
    setIsStreaming(true)
    timeoutRef.current = setTimeout(() => {
      const id = (Date.now() + 1).toString()

      // TODO: Replace with real API response handling.
      // When the API returns an out-of-credits error (e.g. HTTP 402 / error code),
      // add a message with isError: true and errorType: 'out_of_credits'.
      const simulateOutOfCredits = content.toLowerCase().includes('upgrade')
      if (simulateOutOfCredits) {
        const errorMsg: Message = { id, role: 'assistant', content: '', isError: true, errorType: 'out_of_credits' }
        addMessage(errorMsg)
        setIsStreaming(false)
        return
      }

      const simulateText = `[${selectedModel.label}] Para analisar estes dados, recomendo olharmos as tendências de crescimento ao longo dos últimos 6 meses. Gostaria de focar em algum período específico?`
      let currentIdx = 0
      
      const assistantMsg: Message = { id, role: 'assistant', content: '' }
      addMessage(assistantMsg)
      
      intervalRef.current = setInterval(() => {
        currentIdx++
        const partial = simulateText.substring(0, currentIdx)
        updateLastAssistantMessage(partial)
        
        if (currentIdx >= simulateText.length) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setIsStreaming(false)
        }
      }, 30)
    }, 500)
  }, [addMessage, updateLastAssistantMessage, setIsStreaming, selectedModel, stopMessage])

  return { messages, isConnected: true, isStreaming, sendMessage, stopMessage }
}
