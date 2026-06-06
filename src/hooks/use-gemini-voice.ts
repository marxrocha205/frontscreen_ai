"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { stopAllAudio } from './use-websocket'
import { useI18n } from '@/context/i18n-context'

/**
 * Hook para gerenciar a gravação de voz e conversão para Base64.
 * @param threshold Sensibilidade (reservado para lógica futura de VAD)
 * @param silenceTimeout Tempo de silêncio (reservado para lógica futura de auto-stop)
 */
type VoiceEvents = {
  onTranscript?: (text: string) => void
  onStop?: () => void
}

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

export function useGeminiVoice(
  threshold: number = 5,
  silenceTimeout: number = 1500,
  events: VoiceEvents = {}
) {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([]) // Mudado para Blob[] para melhor tipagem
  const startedAtRef = useRef(0)
  const hasSpeechRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const transcriptRef = useRef('')
  const [recognitionSupported, setRecognitionSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const cleanupRecognition = useCallback(() => {
    const recognition = recognitionRef.current
    if (recognition) {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.onstart = null
      try {
        recognition.stop()
      } catch {}
    }
    recognitionRef.current = null
  }, [])

  useEffect(() => {
    const speechWindow = window as Window & typeof globalThis & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
    const SpeechRecognitionCtor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition

    setRecognitionSupported(Boolean(SpeechRecognitionCtor))
  }, [])

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
          // @ts-expect-error - Propriedade experimental para forçar o browser a ignorar áudio local
          suppressLocalAudioPlayback: true,
        }
      })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      startedAtRef.current = Date.now()
      hasSpeechRef.current = false
      transcriptRef.current = ''

      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024
      source.connect(analyser)
      audioContextRef.current = audioContext

      const samples = new Uint8Array(analyser.fftSize)
      const detectSpeech = () => {
        analyser.getByteTimeDomainData(samples)
        let sum = 0

        for (let i = 0; i < samples.length; i += 1) {
          const normalized = (samples[i] - 128) / 128
          sum += normalized * normalized
        }

        if (Math.sqrt(sum / samples.length) > 0.025) {
          hasSpeechRef.current = true
        }

        if (mediaRecorderRef.current?.state === 'recording') {
          animationFrameRef.current = requestAnimationFrame(detectSpeech)
        }
      }
      detectSpeech()

      const speechWindow = window as Window & typeof globalThis & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
      const SpeechRecognitionCtor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition

      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor()
        recognition.lang = document.documentElement.lang || 'pt-BR'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onresult = (event) => {
          let newFinal = ''
          let newInterim = ''

          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const result = event.results[i]
            const text = result[0]?.transcript || ''
            
            if (result.isFinal) {
              newFinal += text
            } else {
              newInterim += text
            }
          }

          // Atualiza a memória definitiva APENAS com as palavras já confirmadas
          if (newFinal) {
            transcriptRef.current += newFinal
          }

          // Envia para a caixa de texto a memória confirmada + a palavra temporária atual
          const combined = `${transcriptRef.current}${newInterim}`.trim()
          events.onTranscript?.(combined)
        }

        recognition.onerror = (event) => {
          console.error('[VoiceError] Erro no reconhecimento de voz:', event.error)
        }

        recognition.onend = () => {
          if (mediaRecorderRef.current?.state === 'recording') {
            try {
              recognition.start()
            } catch {}
          }
        }

        recognitionRef.current = recognition

        try {
          recognition.start()
        } catch (error) {
          console.error('[VoiceError] Não foi possível iniciar o reconhecimento de voz:', error)
        }
      }

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
  }, [events, threshold, silenceTimeout])

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
        const recordedMs = Date.now() - startedAtRef.current
        const hasEnoughAudio = audioBlob.size > 1200 && recordedMs > 350 && hasSpeechRef.current

        // Cleanup: Desliga o hardware do microfone
        recorder.stream.getTracks().forEach(track => track.stop())
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        audioContextRef.current?.close().catch(() => {})
        audioContextRef.current = null
        cleanupRecognition()
        setIsRecording(false)
        events.onStop?.()

        if (!hasEnoughAudio) {
          audioChunksRef.current = []
          resolve(undefined)
          return
        }

        const reader = new FileReader()
        
        reader.readAsDataURL(audioBlob)
        reader.onloadend = () => {
          // O resultado do FileReader inclui o prefixo "data:audio/webm;base64,"
          const base64String = reader.result as string
          resolve(base64String)
        }

      }

      recorder.stop()
    })
  }, [cleanupRecognition, events])

  return { isRecording, startRecording, stopRecording, recognitionSupported }
}
