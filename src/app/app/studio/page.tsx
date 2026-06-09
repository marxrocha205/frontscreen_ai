"use client"

import { useState, useEffect, Suspense, useRef } from 'react'
import {
  Image as LucideImage,
  Video,
  Loader2,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Plus,
  Flower2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/context/i18n-context'
import { config } from '@/lib/config'

type AspectRatio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16'
type TabType = 'image' | 'video' | 'frames' | 'ingredients'

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Erro ao conectar com o servidor."

// Arrays de Modelos Ilustrativos
const IMAGE_MODELS = ['Omni Flash', 'Nano Banana 2']
const VIDEO_MODELS = ['Veo 3.1 - Lite', 'Veo 3.1 - Fast', 'Veo 3.1 - Quality']

function StudioContent() {
  const { language } = useI18n()
  const { isLoggedIn, syncFromStorage } = useAuth()
  
  // Settings State
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [activeTab, setActiveTab] = useState<TabType>('image')
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0])
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  
  // Generation State
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [history, setHistory] = useState<GeneratedImage[]>([])

  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    syncFromStorage()
  }, [isLoggedIn, syncFromStorage])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false)
        setIsModelDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    if (tab === 'image') setSelectedModel(IMAGE_MODELS[0])
    if (tab === 'video') setSelectedModel(VIDEO_MODELS[0])
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    setErrorMessage('')
    setIsSettingsOpen(false)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error("Usuário não autenticado")

      const endpoint = `${config.apiUrl}/api/tools/generate-image`
      const formData = new FormData()
      
      formData.append('prompt', prompt)
      formData.append('aspect_ratio', aspectRatio)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || errorData?.message || 'Erro ao processar a requisição na API.')
      }

      const data = await response.json()
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: data.image_url,
        prompt: prompt
      }

      setHistory(prev => [newImage, ...prev])
      setPrompt('') // clear prompt after success

    } catch (error: unknown) {
      console.error(error)
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  // Helpers para ícones de proporção
  const getRatioIcon = (ratio: AspectRatio) => {
    switch (ratio) {
      case '16:9': return <div className="w-5 h-3 border-2 border-current rounded-[2px]" />;
      case '4:3': return <div className="w-[18px] h-[14px] border-2 border-current rounded-[2px]" />;
      case '1:1': return <div className="w-4 h-4 border-2 border-current rounded-[2px]" />;
      case '3:4': return <div className="w-[14px] h-[18px] border-2 border-current rounded-[2px]" />;
      case '9:16': return <div className="w-3 h-5 border-2 border-current rounded-[2px]" />;
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && prompt.trim()) {
      handleGenerate()
    }
  }

  const activeModelsList = activeTab === 'image' ? IMAGE_MODELS : VIDEO_MODELS
  const creditCost = activeTab === 'image' ? 10 : 20

  return (
    <div className="flex flex-col h-full w-full bg-[#050505] text-zinc-100 overflow-hidden relative font-sans">
      
      {/* BACKGROUND AREA (Masonry Grid or Empty State) */}
      <div className="flex-1 overflow-y-auto w-full custom-scrollbar pt-6 pb-40 px-6">
        
        {history.length === 0 ? (
          // Empty State
          <div className="h-full flex flex-col items-center justify-center opacity-60">
            <div className="flex flex-col items-center gap-4 text-zinc-500">
              <Flower2 className="w-12 h-12" strokeWidth={1} />
              <p className="text-sm font-medium tracking-wide">
                {language === 'pt-BR' ? 'Comece a criar' : 'Start creating'}
              </p>
            </div>
          </div>
        ) : (
          // Masonry Grid
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 max-w-[1600px] mx-auto">
            {history.map((img) => (
              <div key={img.id} className="break-inside-avoid relative rounded-xl overflow-hidden group bg-zinc-900 border border-zinc-800/50">
                <img src={img.url} alt={img.prompt} className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end">
                  <p className="text-xs text-white line-clamp-3">{img.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FLOATING INPUT BAR */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-50 flex flex-col items-center">
        
        {errorMessage && (
          <div className="mb-4 bg-red-500/20 border border-red-500/30 text-red-300 text-xs px-4 py-2 rounded-full backdrop-blur">
            {errorMessage}
          </div>
        )}

        <div className="w-full bg-[#1A1A1A] rounded-[24px] border border-zinc-800 shadow-2xl flex items-center p-2 gap-2 relative">
          
          {/* Left spacer / Padding instead of Agent button */}
          <div className="w-2" />

          {/* Central Input */}
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'pt-BR' ? "O que você deseja criar?" : "What do you want to create?"}
            className="flex-1 bg-transparent border-none text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-0 px-2 min-w-0"
          />

          {/* Right Configuration Button */}
          <div className="relative" ref={settingsRef}>
            
            {/* The Settings Button inside Input */}
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="h-10 px-3 rounded-full bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2 text-sm font-medium transition-colors shrink-0"
            >
              <span className="max-w-[120px] truncate">{selectedModel}</span>
              <div className="flex items-center text-zinc-500 gap-1 ml-1">
                {getRatioIcon(aspectRatio)}
              </div>
            </button>

            {/* POPOVER MENU (Opens Upwards) */}
            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-14 right-0 w-[320px] bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-2 shadow-2xl flex flex-col gap-2 origin-bottom-right"
                >
                  
                  {/* Top Tabs */}
                  <div className="flex bg-[#252525] p-1 rounded-xl">
                    <button onClick={() => handleTabChange('image')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[#f4f4f4] text-black shadow-sm`}>
                      <LucideImage className="w-4 h-4" /> {language === 'pt-BR' ? 'Imagem' : 'Image'}
                    </button>
                  </div>

                  {/* Aspect Ratios Row */}
                  <div className="flex bg-[#252525] p-1 rounded-xl justify-between mt-1">
                    {(['16:9', '4:3', '1:1', '3:4', '9:16'] as AspectRatio[]).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`flex flex-col items-center justify-center gap-1 w-12 py-2 rounded-lg transition-colors ${aspectRatio === ratio ? 'bg-[#404040] text-zinc-100' : 'text-zinc-400 hover:bg-[#303030] hover:text-zinc-200'}`}
                      >
                        {getRatioIcon(ratio)}
                        <span className="text-[10px] font-semibold">{ratio}</span>
                      </button>
                    ))}
                  </div>

                  {/* Model Selector Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[#252525] hover:bg-[#303030] rounded-xl text-sm font-medium transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{selectedModel}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    </button>

                    {/* Illustrative Dropdown for Models */}
                    <AnimatePresence>
                      {isModelDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute bottom-full left-0 w-full mb-2 bg-[#252525] border border-zinc-700 rounded-xl overflow-hidden shadow-xl z-50 flex flex-col p-1"
                        >
                          {activeModelsList.map((modelName) => (
                            <button
                              key={modelName}
                              onClick={() => { setSelectedModel(modelName); setIsModelDropdownOpen(false); }}
                              className="flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm hover:bg-[#353535] rounded-lg transition-colors"
                            >
                              <span>{modelName}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer Credits info */}
                  <div className="pt-2 pb-1 text-center border-t border-zinc-800/50 mt-1">
                    <p className="text-[11px] text-zinc-400">
                      {language === 'pt-BR' 
                        ? <>A geração custará <span className="text-zinc-200 underline underline-offset-2">{creditCost} créditos</span></>
                        : <>Generating will use <span className="text-zinc-200 underline underline-offset-2">{creditCost} credits</span></>
                      }
                    </p>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Submit Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </button>

        </div>
      </div>

    </div>
  )
}

export default function StudioPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    }>
      <StudioContent />
    </Suspense>
  )
}
