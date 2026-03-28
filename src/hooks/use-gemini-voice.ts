"use client"

import { useState, useRef, useCallback } from 'react'
import { stopAllAudio } from './use-websocket'

/**
 * Hook para gerenciar a gravação de voz e conversão para Base64.
 * @param threshold Sensibilidade (reservado para lógica futura de VAD)
 * @param silenceTimeout Tempo de silêncio (reservado para lógica futura de auto-stop)
 */
export function useGeminiVoice(threshold: number = 5, silenceTimeout: number = 1500) {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([]) // Mudado para Blob[] para melhor tipagem

  const startRecording = useCallback(async () => {
    // Limpeza de segurança caso já exista uma gravação rodando
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    try {
      // 1. Interrompe qualquer áudio que a IA esteja falando no momento (Barge-In)
      stopAllAudio()

      // 2. Configura microfone com cancelamento de eco agressivo
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          // @ts-ignore - Propriedade experimental para forçar o browser a ignorar áudio local
          suppressLocalAudioPlayback: true,
        }
      })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      
      console.log(`[VoiceLog] Gravação iniciada. Threshold: ${threshold}, Timeout: ${silenceTimeout}`)
    } catch (error) {
      console.error("[VoiceError] Erro ao acessar o microfone:", error)
      alert("Por favor, permita o acesso ao microfone no seu navegador.")
    }
  }, [threshold, silenceTimeout])

  const stopRecording = useCallback((): Promise<string | undefined> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current

      if (!recorder || recorder.state === 'inactive') {
        setIsRecording(false)
        resolve(undefined)
        return
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        
        reader.readAsDataURL(audioBlob)
        reader.onloadend = () => {
          // O resultado do FileReader inclui o prefixo "data:audio/webm;base64,"
          const base64String = reader.result as string
          resolve(base64String)
        }

        // Cleanup: Desliga o hardware do microfone
        recorder.stream.getTracks().forEach(track => track.stop())
        setIsRecording(false)
      }

      recorder.stop()
    })
  }, [])

  return { isRecording, startRecording, stopRecording }
}