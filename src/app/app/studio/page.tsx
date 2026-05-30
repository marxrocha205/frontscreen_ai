"use client"

import { useState, useRef, useEffect, Suspense } from 'react'
import {
  Image as LucideImage,
  Video,
  Settings2,
  FileUp,
  Download,
  Loader2,
  Maximize2,
  Scissors,
  Sparkles,
  LayoutGrid,
  Check,
  ChevronLeft,
  FileText
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/context/i18n-context'
import { config } from '@/lib/config'
import { FloatingDock } from '@/components/ui/floating-dock'

type StudioMode = 'image' | 'video' | 'utilities'
type ResultType = 'image' | 'video' | 'text' | null

function StudioContent() {
  const { language } = useI18n()
  const { isLoggedIn, syncFromStorage } = useAuth()
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  // Estados da UI
  const [mode, setMode] = useState<StudioMode>('image')
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showRatioSubmenu, setShowRatioSubmenu] = useState(false)
  const videoFeatureInDevelopment = mode === 'video'

  // Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Resultados
  const [isLoading, setIsLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false) // Para a geração de vídeo
  const [errorMessage, setErrorMessage] = useState('')
  const [resultData, setResultData] = useState<string | null>(null)
  const [resultType, setResultType] = useState<ResultType>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const promptContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    syncFromStorage()
  }, [isLoggedIn, syncFromStorage])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (promptContainerRef.current && !promptContainerRef.current.contains(event.target as Node)) {
        if (!prompt && !selectedFile) {
          setIsExpanded(false)
        }
        setShowRatioSubmenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [prompt, selectedFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setIsExpanded(true)
    }
  }

  // Lógica de Polling para Geração de Vídeo
  const pollVideoStatus = (jobId: string, token: string) => {
    setIsPolling(true)
    setCurrentJobId(jobId)

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${config.apiUrl}/api/tools/video-status/${jobId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()

        if (data.status === 'completed') {
          clearInterval(interval)
          setIsPolling(false)
          setIsLoading(false)
          setResultData(data.video_url || `${config.apiUrl}/api/tools/proxy-video-public/${jobId}`)
          setResultType('video')
          setTimeout(() => {
            videoRef.current?.load()
            videoRef.current?.play().catch(() => {})
          }, 0)
        } else if (data.status === 'failed') {
          clearInterval(interval)
          setIsPolling(false)
          setIsLoading(false)
          setErrorMessage(data.error || data?.message || "Ocorreu um erro ao renderizar o vídeo.")
        }
        // Se for "pending", apenas continua rodando a cada 10s
      } catch (err) {
        clearInterval(interval)
        setIsPolling(false)
        setIsLoading(false)
        setErrorMessage("Erro de conexão ao verificar o status do vídeo.")
      }
    }, 10000) // Verifica a cada 10 segundos
  }

  // INTEGRAÇÃO COM O BACKEND (Baseada na nova Doc FormData)
  const handleGenerate = async () => {
    if (!prompt && !selectedFile && mode !== 'utilities') return

    setIsLoading(true)
    setErrorMessage('')
    setResultData(null)
    setResultType(null)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error("Usuário não autenticado")

      let endpoint = ''
      const formData = new FormData()
      let expectsBlob = false

      // 1. MODO IMAGEM
      if (mode === 'image') {
        endpoint = `${config.apiUrl}/api/tools/generate-image`
        formData.append('prompt', prompt)
        formData.append('aspect_ratio', aspectRatio)
      }
      // 2. MODO VÍDEO
      else if (mode === 'video') {
        throw new Error("A função de vídeo ainda está em desenvolvimento e não está disponível no momento.")
      }
      // 3. MODO UTILITÁRIOS (Remoção de Fundo)
      else if (mode === 'utilities') {
        if (!selectedFile) throw new Error("Anexe uma imagem para remover o fundo.")
        endpoint = `${config.apiUrl}/api/tools/remove-background`
        formData.append('file', selectedFile)
        expectsBlob = true // A API retorna o arquivo direto, não JSON
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // ATENÇÃO: NÃO definir 'Content-Type' aqui. O fetch com FormData faz isso automaticamente!
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || errorData?.message || 'Erro ao processar a requisição na API.')
      }

      // Tratamento de Resposta BLOB (Imagem sem fundo)
      if (expectsBlob) {
        const blob = await response.blob()
        const imageUrl = URL.createObjectURL(blob)
        setResultData(imageUrl)
        setResultType('image')
        setIsLoading(false)
        return
      }

      // Tratamento de Respostas JSON
      const data = await response.json()

      if (mode === 'image') {
        setResultData(data.image_url)
        setResultType('image')
        setIsLoading(false)
      }

    } catch (error: any) {
      console.error(error)
      setErrorMessage(error.message || "Erro ao conectar com o servidor.")
      setIsLoading(false)
    }
  }

  const dockItems = [
    {
      title: language === "pt-BR" ? "Estúdio de Criação" : "Creation Studio",
      icon: <Sparkles className="h-full w-full text-zinc-300" />,
      href: "#",
      onClick: () => { setMode('image'); setIsExpanded(true); }
    },
    {
      title: language === "pt-BR" ? "Remover Fundo" : "Remove BG",
      icon: <Scissors className="h-full w-full text-zinc-300" />,
      href: "#",
      onClick: () => { setMode('utilities'); setIsExpanded(true); }
    },
    {
      title: "Voltar para o Chat",
      icon: <LayoutGrid className="h-full w-full text-zinc-300" />,
      href: "/app",
    },
  ];

  return (
    <div className="flex flex-col flex-1 h-full bg-zinc-950 text-zinc-100 overflow-hidden relative">

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 flex flex-col justify-center items-center min-h-full pb-28 pt-8">
        <div className="max-w-3xl w-full flex flex-col gap-6 my-auto" ref={promptContainerRef}>

            <div className="w-full bg-[#0d0d0d] border border-zinc-850 rounded-2xl p-4 shadow-2xl transition-all duration-300 focus-within:border-zinc-800">

              {videoFeatureInDevelopment && (
                  <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm flex items-start gap-3">
                    <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <p>
                    A função de vídeo ainda está em desenvolvimento. A criação e a análise de vídeo foram temporariamente desativadas.
                    </p>
                  </div>
                )}

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder={
                mode === 'video' ? "Descreva o vídeo que quer criar ou anexe um para análise..." :
                  mode === 'utilities' ? "Anexe uma imagem para usar os utilitários..." :
                    "O que você quer criar hoje? Descreva em detalhes..."
              }
              rows={isExpanded ? 4 : 2}
              className="w-full bg-transparent text-zinc-100 text-base md:text-lg focus:outline-none resize-none placeholder:text-zinc-700 transition-all custom-scrollbar"
            />

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-3 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-3 relative min-h-[44px]">

                    <div className="flex items-center gap-2 overflow-hidden">
                      <AnimatePresence mode="wait">
                        {!showRatioSubmenu ? (
                          <motion.div
                            key="modes"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="flex items-center gap-1.5 p-1 bg-zinc-900/60 border border-zinc-850 rounded-xl"
                          >
                            <button
                              onClick={() => setMode('image')}
                              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === 'image' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                              <LucideImage className="w-3.5 h-3.5" />
                              <span>Imagem</span>
                            </button>
                            <button
                              onClick={() => setMode('video')}
                              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === 'video' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Vídeo</span>
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="ratios"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl"
                          >
                            <button
                              onClick={() => setShowRatioSubmenu(false)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            {[
                              { label: '1:1 (Quadrado)', value: '1:1' },
                              { label: '16:9 (Paisagem)', value: '16:9' },
                              { label: '9:16 (Stories)', value: '9:16' }
                            ].map(item => (
                              <button
                                key={item.value}
                                onClick={() => {
                                  setAspectRatio(item.value)
                                  setShowRatioSubmenu(false)
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${aspectRatio === item.value ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                              >
                                <span>{item.value}</span>
                                {aspectRatio === item.value && <Check className="w-3 h-3" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">

                      {mode === 'image' && !showRatioSubmenu && (
                        <button
                          onClick={() => setShowRatioSubmenu(true)}
                          className="h-9 px-3.5 bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                        >
                          <Settings2 className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Proporção: <strong className="text-indigo-400">{aspectRatio}</strong></span>
                        </button>
                      )}

                      {(mode === 'video' || mode === 'utilities') && (
                        <>
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept={mode === 'video' ? 'video/*' : 'image/*'} />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={mode === 'video'}
                            className="h-9 px-3.5 bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-zinc-400 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all max-w-[145px] truncate disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <FileUp className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="truncate">{selectedFile ? selectedFile.name : 'Anexar'}</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={handleGenerate}
                        disabled={isLoading || mode === 'video' || (!prompt && !selectedFile)}
                        className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/10"
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>{mode === 'video' ? 'Indisponível' : isPolling ? 'Renderizando...' : 'Gerar'}</span>
                      </button>

                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-full flex justify-center py-2 z-20 animate-in fade-in duration-500">
            <FloatingDock items={dockItems} />
          </div>

          {/* ÁREA DE RESULTADOS */}
          {resultData && (
            <div className="mt-2 animate-in zoom-in-95 duration-500 w-full">

              {/* Resultado: IMAGEM */}
              {resultType === 'image' && (
                <div className="relative w-full md:w-3/4 mx-auto rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-850 shadow-2xl group">
                  <img src={resultData} alt="Result Studio" className="w-full h-auto object-contain" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6 justify-center">
                    <a
                      href={resultData}
                      download="screenai_studio_image.png"
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium text-sm transition-all border border-white/10"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                </div>
              )}

              {/* Resultado: VÍDEO */}
              {resultType === 'video' && currentJobId && (
                <div className="relative w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-850 shadow-2xl">
                  <video
                    ref={videoRef}
                    key={resultData || currentJobId}
                    src={resultData || `${config.apiUrl}/api/tools/proxy-video-public/${currentJobId}?t=${Date.now()}`}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-auto outline-none"
                    autoPlay
                    muted
                    loop
                  />
                  <a
                    href={resultData || `${config.apiUrl}/api/tools/proxy-video-public/${currentJobId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md hover:bg-black/80 transition-colors"
                  >
                    Abrir vídeo
                  </a>
                </div>
              )}

              {/* Resultado: TEXTO (Markdown de Análise) */}
              {resultType === 'text' && (
                <div className="w-full bg-zinc-900 border border-zinc-850 rounded-2xl p-6 shadow-2xl text-zinc-300 whitespace-pre-wrap leading-relaxed text-sm">
                  {resultData}
                </div>
              )}

            </div>
          )}

          {/* Loading de Polling do Vídeo (Aparece embaixo avisando) */}
          {isPolling && (
            <div className="text-indigo-400 text-sm text-center py-3 flex items-center justify-center gap-2 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>A nossa IA está a renderizar o seu vídeo. Isto pode demorar alguns minutos...</span>
            </div>
          )}

          {errorMessage && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20 w-full">
              {errorMessage}
            </div>
          )}

        </div>
      </div>

    </div>
  )
}

export default function StudioPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    }>
      <StudioContent />
    </Suspense>
  )
}
