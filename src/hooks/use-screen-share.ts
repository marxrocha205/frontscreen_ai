import { create } from 'zustand'

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
      return canvas.toDataURL('image/jpeg', 0.95)
    }
  } catch (err) {
    console.error('Erro ao capturar frame:', err)
  }
  return undefined
}

interface ScreenShareState {
  isSharing: boolean;
  stream: MediaStream | null;
  startSharing: (intervalMs?: number) => Promise<void>;
  stopSharing: () => void;
}

let intervalRef: NodeJS.Timeout | null = null;

export const useScreenShare = create<ScreenShareState>((set, get) => ({
  isSharing: false,
  stream: null,
  startSharing: async (intervalMs: number | any = 3000) => {
    // Impede que o objeto 'SyntheticEvent' do React entre como intervalo numérico
    const delay = typeof intervalMs === 'number' ? intervalMs : 3000;
    
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { displaySurface: "monitor" }
      })

      // Conecta o stream ao vídeo oculto global (para captura)
      const video = getCaptureVideo()
      if (video.srcObject !== mediaStream) {
        video.srcObject = mediaStream
        video.play().catch(e => {
          if (e.name !== 'AbortError') console.error('Erro ao iniciar vídeo de captura:', e)
        })
      }

      set({ stream: mediaStream, isSharing: true })
      
      intervalRef = setInterval(() => {
        // Reservado para snapshot interval se necessário no futuro
      }, delay)
      
      mediaStream.getVideoTracks()[0].onended = () => {
        get().stopSharing()
      }
    } catch (err) {
      console.error("Failed to share screen", err)
    }
  },
  stopSharing: () => {
    const { stream } = get()
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      set({ stream: null })
    }
    // Limpa o vídeo de captura global
    if (captureVideo) {
      captureVideo.srcObject = null
    }
    if (intervalRef) {
      clearInterval(intervalRef)
      intervalRef = null
    }
    set({ isSharing: false })
  }
}))
