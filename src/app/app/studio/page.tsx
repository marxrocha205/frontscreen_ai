"use client"

import { useState, useRef, useEffect } from 'react'
import { 
  LayoutGrid,
  Paintbrush,
  Image as LucideImage, 
  Smile, 
  Shirt, 
  Scissors, 
  Maximize2, 
  Video, 
  FileText, 
  BookOpen, 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  Check, 
  Copy, 
  AlertCircle, 
  FileUp,
  ChevronLeft
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/context/i18n-context'
import { config } from '@/lib/config'
import { LoginPromptDialog } from '@/components/login-prompt-dialog'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

// Definindo os tipos de ferramentas

type ToolCategory = 'imagens' | 'utilitarios' | 'video' | 'documentos'

interface Tool {
  id: string
  title: string
  description: string
  icon: any
  category: ToolCategory
  isFree?: boolean
  presetStyle?: string
}

function StudioContent() {
  const { language } = useI18n()
  const { isLoggedIn, syncFromStorage } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const currentCategory = searchParams.get('cat') as ToolCategory | null
  
  // Modais de auth
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // Ferramenta selecionada para abrir no Modal
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  
  // Estados de formulário gerais
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [topic, setTopic] = useState('')
  const [docType, setDocType] = useState('comunicado_imprensa')
  const [exportFormat, setExportFormat] = useState('docx')
  const [upscaleFactor, setUpscaleFactor] = useState('2x')
  
  // Upload de arquivos
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados de processamento e retorno
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Resultados das IAs
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [bgRemovedUrl, setBgRemovedUrl] = useState<string | null>(null)
  const [bgRemovedBlob, setBgRemovedBlob] = useState<Blob | null>(null)
  const [videoAnalysis, setVideoAnalysis] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [upscalePreview, setUpscalePreview] = useState<string | null>(null)
  const [upscaleDone, setUpscaleDone] = useState(false)

  // Sincroniza credenciais ao carregar a página
  useEffect(() => {
    syncFromStorage()
  }, [isLoggedIn, syncFromStorage])

  // Frases divertidas de carregamento para engajamento da UI
  const loadingPhrases = language === 'pt-BR' 
    ? [
        "Invocando os neurônios da IA...",
        "Orquestrando os modelos generativos...",
        "Aprimorando pixels e contrastes...",
        "Quase lá! Finalizando a obra-prima...",
        "Adicionando magia da ABNT aos recuos...",
        "Extraindo dados confidenciais do vídeo...",
        "Retocando bordas e transparências..."
      ]
    : [
        "Invoking AI neurons...",
        "Orchestrating generative models...",
        "Improving pixels and contrasts...",
        "Almost there! Polishing the masterpiece...",
        "Adding ABNT formatting magic...",
        "Extracting insights from the video...",
        "Polishing edges and transparencies..."
      ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % loadingPhrases.length)
      }, 3500)
    } else {
      setLoadingPhraseIndex(0)
    }
    return () => clearInterval(interval)
  }, [isLoading, loadingPhrases.length])

  // Lista de Ferramentas
  const tools: Tool[] = [
    // IMAGENS MÁGICAS
    {
      id: 'generate-image',
      title: language === 'pt-BR' ? 'Criar do Zero' : 'Create from Scratch',
      description: language === 'pt-BR' ? 'Crie ilustrações e fotos realistas a partir de um texto.' : 'Generate illustrations and realistic photos from text descriptions.',
      icon: Paintbrush,
      category: 'imagens'
    },
    {
      id: 'edit-image',
      title: language === 'pt-BR' ? 'Editar Imagem' : 'Edit Image',
      description: language === 'pt-BR' ? 'Altere elementos ou adicione objetos em uma imagem existente.' : 'Modify elements or insert objects into an existing photo.',
      icon: LucideImage,
      category: 'imagens'
    },
    {
      id: 'cartoon-style',
      title: language === 'pt-BR' ? 'Cartoon' : 'Cartoon Art',
      description: language === 'pt-BR' ? 'Transforme suas ideias em estilo desenho animado ou anime.' : 'Turn your prompts into cartoon and anime illustrations.',
      icon: Smile,
      category: 'imagens',
      presetStyle: 'cartoon character design, vibrant anime style, detailed digital art'
    },
    {
      id: 'fashion-style',
      title: language === 'pt-BR' ? 'Fotografia de Moda' : 'Fashion Shoot',
      description: language === 'pt-BR' ? 'Gere modelos virtuais e fotografia comercial de alta costura.' : 'Generate virtual models and commercial high-fashion photography.',
      icon: Shirt,
      category: 'imagens',
      presetStyle: 'editorial fashion photography, high couture, professional model, cinematic lighting'
    },
    // UTILITÁRIOS
    {
      id: 'remove-bg',
      title: language === 'pt-BR' ? 'Remover Fundo' : 'Remove Background',
      description: language === 'pt-BR' ? 'Remova o fundo de qualquer imagem em segundos com precisão.' : 'Extract the main subject from any image transparently.',
      icon: Scissors,
      category: 'utilitarios',
      isFree: true
    },
    {
      id: 'upscale-image',
      title: language === 'pt-BR' ? 'Aumentar Resolução' : 'Super Resolution',
      description: language === 'pt-BR' ? 'Aumente o tamanho e a nitidez de imagens em até 4x.' : 'Enhance details and upscale image quality up to 4x.',
      icon: Maximize2,
      category: 'utilitarios'
    },
    // VÍDEO
    {
      id: 'analyze-video',
      title: language === 'pt-BR' ? 'Transcrever & Analisar' : 'Video Insights',
      description: language === 'pt-BR' ? 'Extraia transcrição e faça resumos inteligentes de vídeos (< 20MB).' : 'Generate transcripts and summarize video meetings (< 20MB).',
      icon: Video,
      category: 'video'
    },
    // DOCUMENTOS ABNT
    {
      id: 'doc-press-release',
      title: language === 'pt-BR' ? 'Comunicado de Imprensa' : 'Press Release',
      description: language === 'pt-BR' ? 'Gere notas corporativas formatadas nas normas ABNT.' : 'Create press releases matching official formatting norms.',
      icon: FileText,
      category: 'documentos'
    },
    {
      id: 'doc-essay',
      title: language === 'pt-BR' ? 'Redação Escolar' : 'Academic Essay',
      description: language === 'pt-BR' ? 'Estruture artigos e redações acadêmicas impecáveis.' : 'Structure educational articles and academic papers.',
      icon: BookOpen,
      category: 'documentos'
    },
    {
      id: 'doc-report',
      title: language === 'pt-BR' ? 'Relatórios' : 'Executive Reports',
      description: language === 'pt-BR' ? 'Compile dados e ideias em relatórios executivos formatados.' : 'Compile executive and operational reports cleanly.',
      icon: FileSpreadsheet,
      category: 'documentos'
    }
  ]

  // Abertura do Modal de uma ferramenta
  const handleOpenTool = (tool: Tool) => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true)
      return
    }

    setSelectedTool(tool)
    resetOutputs()
  }

  const resetOutputs = () => {
    setPrompt('')
    setTopic('')
    setSelectedFile(null)
    setGeneratedImageUrl(null)
    setBgRemovedUrl(null)
    setBgRemovedBlob(null)
    setVideoAnalysis(null)
    setErrorMessage('')
    setUpscalePreview(null)
    setUpscaleDone(false)
  }

  // Upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  // Copiar texto para a área de transferência
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Chamadas para a API do backend
  const handleRunTool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTool) return

    setIsLoading(true)
    setErrorMessage('')

    const token = localStorage.getItem('access_token')
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`
    }

    try {
      // 1. GERADOR DE IMAGEM
      if (['generate-image', 'cartoon-style', 'fashion-style', 'edit-image'].includes(selectedTool.id)) {
        const formData = new FormData()
        
        let finalPrompt = prompt
        // Incorpora presets de estilo
        if (selectedTool.presetStyle) {
          finalPrompt = `${prompt}, ${selectedTool.presetStyle}`
        }
        
        formData.append('prompt', finalPrompt)
        formData.append('aspect_ratio', aspectRatio)
        
        if (selectedTool.id === 'edit-image' && selectedFile) {
          formData.append('file', selectedFile)
        }

        const response = await fetch(`${config.apiUrl}/api/tools/generate-image`, {
          method: 'POST',
          headers,
          body: formData
        })

        const data = await response.json()

        if (response.ok && data.status === 'success') {
          setGeneratedImageUrl(data.image_url)
        } else {
          setErrorMessage(data.message || (language === 'pt-BR' ? 'Erro ao gerar imagem.' : 'Error generating image.'))
        }
      }

      // 2. REMOVER FUNDO
      else if (selectedTool.id === 'remove-bg') {
        if (!selectedFile) {
          setErrorMessage(language === 'pt-BR' ? 'Por favor, envie um arquivo de imagem.' : 'Please upload an image file.')
          setIsLoading(false)
          return
        }

        const formData = new FormData()
        formData.append('file', selectedFile)

        const response = await fetch(`${config.apiUrl}/api/tools/remove-background`, {
          method: 'POST',
          headers,
          body: formData
        })

        if (response.ok) {
          const blob = await response.blob()
          setBgRemovedBlob(blob)
          const objectUrl = URL.createObjectURL(blob)
          setBgRemovedUrl(objectUrl)
        } else {
          const text = await response.text()
          setErrorMessage(text || (language === 'pt-BR' ? 'Erro ao remover fundo.' : 'Error removing background.'))
        }
      }

      // 3. UPSCALE (MOCKED)
      else if (selectedTool.id === 'upscale-image') {
        if (!selectedFile) {
          setErrorMessage(language === 'pt-BR' ? 'Por favor, selecione uma imagem.' : 'Please upload an image.')
          setIsLoading(false)
          return
        }
        
        // Simulação elegante do Upscale
        await new Promise((resolve) => setTimeout(resolve, 4000))
        const reader = new FileReader()
        reader.onloadend = () => {
          setUpscalePreview(reader.result as string)
          setUpscaleDone(true)
        }
        reader.readAsDataURL(selectedFile)
      }

      // 4. ANÁLISE DE VÍDEO
      else if (selectedTool.id === 'analyze-video') {
        if (!selectedFile) {
          setErrorMessage(language === 'pt-BR' ? 'Por favor, selecione um arquivo de vídeo.' : 'Please upload a video file.')
          setIsLoading(false)
          return
        }

        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('prompt', prompt || (language === 'pt-BR' ? 'Transcreva este vídeo e faça um resumo' : 'Transcribe this video and provide a summary'))

        const response = await fetch(`${config.apiUrl}/api/tools/analyze-video`, {
          method: 'POST',
          headers,
          body: formData
        })

        const data = await response.json()

        if (response.ok && data.status === 'success') {
          setVideoAnalysis(data.analysis)
        } else {
          setErrorMessage(data.message || (language === 'pt-BR' ? 'Erro ao processar o vídeo.' : 'Error processing video.'))
        }
      }

      // 5. DOCUMENTOS ABNT
      else if (['doc-press-release', 'doc-essay', 'doc-report'].includes(selectedTool.id)) {
        if (!topic) {
          setErrorMessage(language === 'pt-BR' ? 'Por favor, insira o assunto do documento.' : 'Please enter the document topic.')
          setIsLoading(false)
          return
        }

        let calculatedDocType = 'comunicado_imprensa'
        if (selectedTool.id === 'doc-essay') calculatedDocType = 'redacao'
        if (selectedTool.id === 'doc-report') calculatedDocType = 'relatorio'

        const formData = new FormData()
        formData.append('topic', topic)
        formData.append('doc_type', calculatedDocType)
        formData.append('export_format', exportFormat)

        const response = await fetch(`${config.apiUrl}/api/tools/generate-document`, {
          method: 'POST',
          headers,
          body: formData
        })

        if (response.ok) {
          const blob = await response.blob()
          const a = document.createElement('a')
          a.href = window.URL.createObjectURL(blob)
          a.download = `documento_abnt.${exportFormat}`
          a.click()

          // Fecha modal indicando sucesso
          setSelectedTool(null)
        } else {
          const data = await response.json()
          setErrorMessage(data.message || (language === 'pt-BR' ? 'Erro ao gerar documento.' : 'Error generating document.'))
        }
      }

    } catch (error) {
      console.error(error)
      setErrorMessage(
        language === 'pt-BR' 
          ? 'Erro de comunicação com o servidor. Verifique sua conexão.' 
          : 'Server communication error. Please check your connection.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Download manual da imagem de fundo removida
  const handleDownloadBgRemoved = () => {
    if (!bgRemovedBlob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(bgRemovedBlob)
    a.download = `${selectedFile?.name.split('.')[0] || 'imagem'}_no_bg.png`
    a.click()
  }

  // Renderizador de categorias
  const renderToolGrid = (category: ToolCategory, title: string) => {
    if (currentCategory && currentCategory !== category) return null

    const filteredTools = tools.filter(t => t.category === category)
    if (filteredTools.length === 0) return null

    return (
      <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase flex items-center gap-2 flex-1">
            <span>{title}</span>
            <span className="h-[1px] bg-zinc-800 flex-1 ml-2" />
          </h2>
          {currentCategory && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/app/studio')}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 h-7 px-2"
            >
              <ChevronLeft className="w-3 h-3" />
              {language === 'pt-BR' ? 'Ver todos' : 'View all'}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const Icon = tool.icon
            return (
              <Card 
                key={tool.id} 
                className="bg-[#0f0f0f] border border-zinc-800/80 hover:border-indigo-500/40 hover:bg-zinc-900/40 transition-all duration-300 rounded-xl cursor-pointer group overflow-hidden shadow-md"
                onClick={() => handleOpenTool(tool)}
              >
                <div className="p-5 flex flex-col gap-3 h-full">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/5 transition-all shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-100 group-hover:text-white text-sm font-semibold leading-snug">
                      {tool.title}
                    </p>
                    <p className="text-zinc-500 group-hover:text-zinc-400 text-xs mt-1.5 leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto overflow-x-hidden bg-zinc-950 text-zinc-100 px-4 md:px-8 py-6 md:py-8 custom-scrollbar">
      
      <div className="max-w-5xl mx-auto w-full mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
              <LayoutGrid className="w-6 h-6 md:w-8 md:h-8 text-indigo-400 shrink-0" />
              <span>
                {currentCategory === 'imagens' ? (language === 'pt-BR' ? 'Estúdio de Imagens' : 'Image Studio') :
                 currentCategory === 'video' ? (language === 'pt-BR' ? 'Estúdio de Vídeo' : 'Video Studio') :
                 currentCategory === 'documentos' ? (language === 'pt-BR' ? 'Estúdio de Documentos' : 'Document Studio') :
                 currentCategory === 'utilitarios' ? (language === 'pt-BR' ? 'Utilitários' : 'Utilities') :
                 'ScreenAI Studio'}
              </span>
            </h1>
          </div>
          <p className="text-sm text-zinc-500 mt-2 leading-relaxed max-w-xl">
            {currentCategory === 'imagens' ? (language === 'pt-BR' ? 'Crie, edite e transforme imagens com IA.' : 'Create, edit and transform images with AI.') :
             currentCategory === 'video' ? (language === 'pt-BR' ? 'Analise e transcreva vídeos em segundos.' : 'Analyze and transcribe videos in seconds.') :
             currentCategory === 'documentos' ? (language === 'pt-BR' ? 'Formate documentos nas normas ABNT automaticamente.' : 'Format documents to ABNT standards automatically.') :
             (language === 'pt-BR' 
              ? 'Potencialize seus projetos e otimize seu fluxo de trabalho com nosso conjunto exclusivo de ferramentas de inteligência artificial de última geração.'
              : 'Empower your projects and supercharge your flow with our exclusive suite of next-generation artificial intelligence tools.')}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full">
        {renderToolGrid('imagens', language === 'pt-BR' ? 'Imagens Mágicas' : 'Magical Images')}
        {renderToolGrid('utilitarios', language === 'pt-BR' ? 'Utilidades de Imagem' : 'Image Utilities')}
        {renderToolGrid('video', language === 'pt-BR' ? 'Vídeo Inteligente' : 'Smart Video')}
        {renderToolGrid('documentos', language === 'pt-BR' ? 'Documentos (Magia ABNT)' : 'ABNT Documents Magic')}
      </div>

      <Dialog open={selectedTool !== null} onOpenChange={(open) => { if (!open) setSelectedTool(null) }}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col bg-[#0f0f0f] border border-zinc-800 text-zinc-100 p-6 rounded-2xl shadow-2xl focus:outline-none pointer-events-auto">
          {selectedTool && (
            <>
              <DialogHeader className="relative flex flex-col gap-2 border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    {(() => {
                      const Icon = selectedTool.icon
                      return <Icon className="w-4 h-4" />
                    })()}
                  </div>
                  <div>
                    <DialogTitle className="text-zinc-100 text-base font-semibold leading-none">{selectedTool.title}</DialogTitle>
                    <DialogDescription className="text-zinc-500 text-xs mt-1.5 leading-normal">{selectedTool.description}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto py-4 pr-1 custom-scrollbar overflow-x-hidden">
                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 mb-4 flex items-start gap-2.5 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {selectedTool.id === 'analyze-video' && isLoading && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-3.5 mb-4 flex items-start gap-2.5 text-xs animate-pulse">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{language === 'pt-BR' ? 'Aviso Importante' : 'Important Notice'}</span>
                      <span className="leading-relaxed">
                        {language === 'pt-BR' 
                          ? 'O vídeo pode demorar até 1 minuto para ser totalmente processado e analisado. Por favor, aguarde.' 
                          : 'The video processing may take up to 1 minute. Please remain patient and keep the page open.'}
                      </span>
                    </div>
                  </div>
                )}

                {!isLoading && !generatedImageUrl && !bgRemovedUrl && !videoAnalysis && !upscaleDone && (
                  <form onSubmit={handleRunTool} className="flex flex-col gap-5">
                    {['generate-image', 'cartoon-style', 'fashion-style', 'edit-image', 'analyze-video'].includes(selectedTool.id) && (
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="prompt" className="text-zinc-300 font-medium text-xs">
                          {selectedTool.id === 'analyze-video' 
                            ? (language === 'pt-BR' ? 'Instruções para análise do vídeo' : 'Instructions for video analysis')
                            : (language === 'pt-BR' ? 'O que você quer gerar?' : 'What do you want to generate?')}
                        </Label>
                        <textarea
                          id="prompt"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder={
                            selectedTool.id === 'analyze-video' 
                              ? (language === 'pt-BR' ? 'Ex: Transcreva este vídeo e faça um resumo da reunião' : 'e.g. Transcribe this video and outline the core topics')
                              : (language === 'pt-BR' ? 'Ex: Um gato cibernético vestindo armadura neon estilo cyberpunk...' : 'e.g. A futuristic cybernetic cat wearing glowing neon armor, detailed art...')
                          }
                          required={selectedTool.id !== 'analyze-video'}
                          rows={3}
                          className="w-full bg-[#141414] border border-zinc-800 rounded-xl p-3 text-zinc-100 text-sm focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all resize-none placeholder:text-zinc-650"
                        />
                      </div>
                    )}

                    {['generate-image', 'cartoon-style', 'fashion-style', 'edit-image'].includes(selectedTool.id) && (
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="aspect-ratio" className="text-zinc-300 font-medium text-xs">Proporção (Aspect Ratio)</Label>
                        <Select value={aspectRatio} onValueChange={(val) => setAspectRatio(val || '1:1')}>
                          <SelectTrigger className="w-full bg-[#141414] border-zinc-800 text-zinc-200">
                            <SelectValue placeholder="Proporção" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#141414] border-zinc-800 text-zinc-200">
                            <SelectItem value="1:1" className="focus:bg-zinc-800 focus:text-white">1:1 (Quadrado)</SelectItem>
                            <SelectItem value="16:9" className="focus:bg-zinc-800 focus:text-white">16:9 (Paisagem)</SelectItem>
                            <SelectItem value="9:16" className="focus:bg-zinc-800 focus:text-white">9:16 (Retrato/Stories)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {['edit-image', 'remove-bg', 'upscale-image', 'analyze-video'].includes(selectedTool.id) && (
                      <div className="flex flex-col gap-2">
                        <Label className="text-zinc-300 font-medium text-xs">
                          {selectedTool.id === 'analyze-video' 
                            ? (language === 'pt-BR' ? 'Vídeo (Max 20MB)' : 'Video (Max 20MB)')
                            : (language === 'pt-BR' ? 'Imagem de Origem' : 'Source Image')}
                        </Label>
                        <div
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer select-none ${
                            dragActive 
                              ? 'border-indigo-500 bg-indigo-500/5' 
                              : 'border-zinc-800 bg-[#141414] hover:bg-zinc-900/30 hover:border-zinc-700'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileChange}
                            accept={selectedTool.id === 'analyze-video' ? 'video/*' : 'image/*'}
                            className="hidden"
                          />
                          <div className="w-10 h-10 rounded-full bg-zinc-800/40 border border-zinc-700/20 flex items-center justify-center text-zinc-400">
                            <FileUp className="w-5 h-5" />
                          </div>
                          {selectedFile ? (
                            <div className="text-center">
                              <p className="text-sm font-semibold text-zinc-200 truncate max-w-[240px]">{selectedFile.name}</p>
                              <p className="text-[11px] text-zinc-500 mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className="text-sm font-medium text-zinc-300">
                                {language === 'pt-BR' ? 'Arraste seu arquivo ou clique para selecionar' : 'Drag & drop your file or browse'}
                              </p>
                              <p className="text-[10px] text-zinc-500 mt-1">
                                {selectedTool.id === 'analyze-video' 
                                  ? 'Formatos aceitos: MP4, MOV, AVI, WEBM' 
                                  : 'Formatos aceitos: PNG, JPG, JPEG, WEBP'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedTool.id === 'upscale-image' && (
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="upscale-factor" className="text-zinc-300 font-medium text-xs">Escala do Upscale</Label>
                        <Select value={upscaleFactor} onValueChange={(val) => setUpscaleFactor(val || '2x')}>
                          <SelectTrigger className="w-full bg-[#141414] border-zinc-800 text-zinc-200">
                            <SelectValue placeholder="Escala" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#141414] border-zinc-800 text-zinc-200">
                            <SelectItem value="2x" className="focus:bg-zinc-800 focus:text-white">2x (Duplicar nitidez)</SelectItem>
                            <SelectItem value="4x" className="focus:bg-zinc-800 focus:text-white">4x (Super nitidez comercial)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {['doc-press-release', 'doc-essay', 'doc-report'].includes(selectedTool.id) && (
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="topic" className="text-zinc-300 font-medium text-xs">
                            {language === 'pt-BR' ? 'Assunto / Tópico do Documento' : 'Document Topic / Subject'}
                          </Label>
                          <textarea
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder={
                              selectedTool.id === 'doc-essay' 
                                ? (language === 'pt-BR' ? 'Ex: O impacto do avanço da IA generativa no mercado de trabalho...' : 'e.g. The impact of generative AI on jobs and the global labor market...')
                                : (language === 'pt-BR' ? 'Ex: Lançamento do novo produto ScreenAI Studio com IA integrada...' : 'e.g. Launching the new ScreenAI Studio with fully integrated AI...')
                            }
                            required
                            rows={3}
                            className="w-full bg-[#141414] border border-zinc-800 rounded-xl p-3 text-zinc-100 text-sm focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all resize-none placeholder:text-zinc-650"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="export-format" className="text-zinc-300 font-medium text-xs">Formato de Exportação</Label>
                            <Select value={exportFormat} onValueChange={(val) => setExportFormat(val || 'docx')}>
                              <SelectTrigger className="w-full bg-[#141414] border-zinc-800 text-zinc-200">
                                <SelectValue placeholder="Formato" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#141414] border-zinc-800 text-zinc-200">
                                <SelectItem value="docx" className="focus:bg-zinc-800 focus:text-white">Word (.docx)</SelectItem>
                                <SelectItem value="pdf" className="focus:bg-zinc-800 focus:text-white">PDF Document (.pdf)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label className="text-zinc-300 font-medium text-xs">Normas Aplicadas</Label>
                            <div className="h-9 w-full bg-zinc-900/50 border border-zinc-800/80 rounded-lg flex items-center px-3 text-zinc-400 text-xs gap-2 select-none">
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span>ABNT NBR 14724</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <DialogFooter className="mt-2">
                      <Button
                        type="submit"
                        className="w-full bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl h-11 font-medium transition-all shadow-none border-none ring-0 focus-visible:ring-0 gap-2"
                      >
                        <span>{language === 'pt-BR' ? 'Confirmar e Usar' : 'Confirm & Use'}</span>
                      </Button>
                    </DialogFooter>
                  </form>
                )}

                {isLoading && (
                  <div className="py-12 flex flex-col items-center justify-center gap-5">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-[3px] border-zinc-800"></div>
                      <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-500 animate-spin"></div>
                      <LayoutGrid className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </div>
                    <div className="text-center max-w-sm">
                      <p className="font-semibold text-sm text-zinc-200">{language === 'pt-BR' ? 'Aguardando Resposta...' : 'Waiting for AI...'}</p>
                      <p className="text-xs text-zinc-500 mt-2 min-h-[16px] animate-pulse">
                        {loadingPhrases[loadingPhraseIndex]}
                      </p>
                    </div>
                  </div>
                )}

                {generatedImageUrl && (
                  <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-350">
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black/40 border border-zinc-800 shadow-inner flex items-center justify-center group/image">
                      <img 
                        src={generatedImageUrl} 
                        alt="AI Generated" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => resetOutputs()}
                        variant="outline"
                        className="flex-1 bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-xl h-11"
                      >
                        {language === 'pt-BR' ? 'Gerar Outra' : 'Generate Another'}
                      </Button>
                      <a
                        href={generatedImageUrl}
                        download="screenai_generated_image.png"
                        className="flex-1"
                      >
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 gap-2 shadow-none border-none ring-0">
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </Button>
                      </a>
                    </div>
                  </div>
                )}

                {bgRemovedUrl && (
                  <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-350">
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] bg-zinc-950 border border-zinc-800 shadow-inner flex items-center justify-center">
                      <img 
                        src={bgRemovedUrl} 
                        alt="Transparent" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => resetOutputs()}
                        variant="outline"
                        className="flex-1 bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-xl h-11"
                      >
                        {language === 'pt-BR' ? 'Voltar' : 'Go Back'}
                      </Button>
                      <Button 
                        onClick={handleDownloadBgRemoved}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 gap-2 shadow-none border-none ring-0"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PNG</span>
                      </Button>
                    </div>
                  </div>
                )}

                {upscaleDone && upscalePreview && (
                  <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-350">
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black/40 border border-zinc-800 shadow-inner flex items-center justify-center group">
                      <img 
                        src={upscalePreview} 
                        alt="Upscaled" 
                        className="w-full h-full object-cover scale-[1.05]"
                      />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
                        <Maximize2 className="w-8 h-8 text-indigo-400 mb-2 animate-bounce" />
                        <span className="font-semibold text-sm text-zinc-200">
                          {language === 'pt-BR' ? 'Resolução Aumentada' : 'Resolution Upscaled'} ({upscaleFactor})
                        </span>
                        <span className="text-xs text-zinc-500 mt-1">
                          {language === 'pt-BR' ? 'Texturas e nitidez reconstruídas com IA' : 'Textures and clarity rebuilt with AI'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => resetOutputs()}
                        variant="outline"
                        className="flex-1 bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-xl h-11"
                      >
                        {language === 'pt-BR' ? 'Voltar' : 'Go Back'}
                      </Button>
                      <a
                        href={upscalePreview}
                        download={`super_resolution_${upscaleFactor}.png`}
                        className="flex-1"
                      >
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 gap-2 shadow-none border-none ring-0">
                          <Download className="w-4 h-4" />
                          <span>Download JPG</span>
                        </Button>
                      </a>
                    </div>
                  </div>
                )}

                {videoAnalysis && (
                  <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-350">
                    <div className="bg-[#141414] border border-zinc-850 rounded-2xl p-5 overflow-y-auto max-h-[350px] custom-scrollbar">
                      <div className="prose prose-invert prose-sm text-xs leading-relaxed max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {videoAnalysis}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => resetOutputs()}
                        variant="outline"
                        className="flex-1 bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-xl h-11"
                      >
                        {language === 'pt-BR' ? 'Voltar' : 'Go Back'}
                      </Button>
                      <Button 
                        onClick={() => copyToClipboard(videoAnalysis)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 gap-2 shadow-none border-none ring-0"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{isCopied ? (language === 'pt-BR' ? 'Copiado!' : 'Copied!') : (language === 'pt-BR' ? 'Copiar Relatório' : 'Copy Report')}</span>
                      </Button>
                    </div>
                  </div>
                )}

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />

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
