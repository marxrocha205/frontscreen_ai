import { useState, useCallback, useRef } from 'react'

export function useScreenShare(intervalMs: number = 3000) {
  const [isSharing, setIsSharing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startSharing = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { displaySurface: "monitor" }
      })
      setStream(mediaStream)
      setIsSharing(true)
      
      intervalRef.current = setInterval(() => {
        // Frame capture implementation mock
        console.log("Captured frame at interval")
      }, intervalMs)
      
      mediaStream.getVideoTracks()[0].onended = () => {
        stopSharing()
      }
    } catch (err) {
      console.error("Failed to share screen", err)
    }
  }, [intervalMs])

  const stopSharing = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsSharing(false)
  }, [stream])

  return { isSharing, startSharing, stopSharing, stream }
}
