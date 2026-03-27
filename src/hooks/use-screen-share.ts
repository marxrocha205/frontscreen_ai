import { useState, useCallback, useRef } from 'react'

// =====================================================================
// VÍDEO DE CAPTURA - Vive SEMPRE no documento principal (fora do React).
// Isso garante que a função captureScreenFrame() funcione
// independente de onde o ChatInterface esteja (tela principal ou PiP).
// =====================================================================
let captureVideo: HTMLVideoElement | null = null

function getCaptureVideo(): HTMLVideoElement {
  if (!captureVideo) {
    captureVideo = document.createElement('video')
    captureVideo.autoplay = true
    captureVideo.playsInline = true
    captureVideo.muted = true
    // Totalmente invisível, mas presente no DOM principal para renderizar frames
    captureVideo.style.position = 'fixed'
    captureVideo.style.top = '-9999px'
    captureVideo.style.left = '-9999px'
    captureVideo.style.width = '1px'
    captureVideo.style.height = '1px'
    captureVideo.style.opacity = '0'
    captureVideo.style.pointerEvents = 'none'
    document.body.appendChild(captureVideo)
  }
  return captureVideo
}

/**
 * Captura um frame da tela compartilhada a partir do vídeo oculto global.
 * Funciona idêntico tanto na tela principal quanto no PiP.
 */
export function captureScreenFrame(): string | undefined {
  const video = captureVideo
  if (!video || !video.srcObject) return undefined
  try {
    if (video.videoWidth === 0 || video.videoHeight === 0) return undefined
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/jpeg', 0.7)
    }
  } catch (err) {
    console.error('Erro ao capturar frame:', err)
  }
  return undefined
}

export function useScreenShare(intervalMs: number = 3000) {
  const [isSharing, setIsSharing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startSharing = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { displaySurface: "monitor" }
      })

      // Conecta o stream ao vídeo oculto global (para captura)
      const video = getCaptureVideo()
      video.srcObject = mediaStream
      video.play().catch(e => console.error('Erro ao iniciar vídeo de captura:', e))

      setStream(mediaStream)
      setIsSharing(true)
      
      intervalRef.current = setInterval(() => {
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
    // Limpa o vídeo de captura global
    if (captureVideo) {
      captureVideo.srcObject = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsSharing(false)
  }, [stream])

  return { isSharing, startSharing, stopSharing, stream }
}
