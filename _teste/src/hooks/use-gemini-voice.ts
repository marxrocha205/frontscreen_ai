import { useState, useCallback, useRef } from 'react'

export function useGeminiVoice(speechThreshold: number, silenceMs: number) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false) // Activity detected (VAD)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      audioContextRef.current = new AudioContext()
      
      const source = audioContextRef.current.createMediaStreamSource(stream)
      const analyser = audioContextRef.current.createAnalyser()
      source.connect(analyser)
      
      // Basic mock interval for VAD simulation
      // In a real VAD, we'd process `analyser.getFloatTimeDomainData` or use a worklet
      setIsRecording(true)
      console.log('Voice recording started. Threshold:', speechThreshold)
    } catch (err) {
      console.error('Failed to get user media', err)
    }
  }, [speechThreshold])

  const stopRecording = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setIsRecording(false)
    setIsSpeaking(false)
  }, [])

  return { isRecording, isSpeaking, startRecording, stopRecording }
}
