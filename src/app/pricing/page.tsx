"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Check, Zap, Star, Crown, MonitorPlay, ArrowUpRight, Loader2, Copy } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { config } from '@/lib/config'

// Importando componentes de UI que você já possui
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const plans = [
  {
    id: 1,
    name: 'Free',
    tagline: 'Para quem quer experimentar o poder da IA na tela',
    price: 'R$0/mês',
    cta: 'Começar Grátis',
    features: [
      'Análise de tela em tempo real (Limitada).',
      '100 Tokens diários (Ideal para tarefas rápidas).',
      'Assistente de voz em tempo real',
      'Suporte a texto e imagem',
      'Acesso ao modelo ScreenAI',
    ],
  },
  {
    id: 2,
    name: 'PRO',
    tagline: 'Sua rotina de trabalho nunca mais será a mesma.',
    price: 'R$47/mês',
    cta: 'Assinar PRO',
    badge: 'Popular',
    features: [
      'Tokens ilimitados: Trabalhe o dia todo sem interrupções.',
      'Acesso Ilimitado a ScreenIA, Gemini e GPT-5.',
      'Análise avançada de código, planilhas e design',
      'Histórico completo entre sessões',
      'Voz humanizada, diálogos fluidos',
      'Inteligência que destrava qualquer tarefa, da programação ao cotidiano',
    ],
  },
  {
    id: 3,
    name: 'PREMUM',
    tagline: 'Poder Absoluto By Claude',
    price: 'R$97/mês',
    cta: 'Assinar PLUS',
    features: [
      'Tudo do plano PRO e mais',
      'As IA mais avançadas do mercado, agora dentro da sua tela',
      'Janela de Contexto Gigante: Analise documentos e telas extremamente longas sem perder detalhes.',
      'Multi-IA Simultânea a combinação dos melhores modelos do mundo Claude, GPT-5 e Gemini Pro.',
      'Suporte 24h com canal direto com nosso time técnico',
    ],
  },
]

export default function PricingPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()

  // Estados do Checkout
  const [selectedPlan, setSelectedPlan] = useState<{ id: number, name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', document: '', phone: '' })
  const [pixData, setPixData] = useState<{ qrcode: string, copyPaste: string } | null>(null)

  // Função disparada ao clicar no botão de "Assinar"
  const handlePlanClick = (plan: typeof plans[0]) => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    if (plan.id === 1) {
      router.push('/app')
    } else {
      setSelectedPlan({ id: plan.id, name: plan.name })
      setPixData(null) // Reseta o PIX anterior, se houver
    }
  }

  // Função que chama a nossa API FastAPI para gerar o PIX
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan) return

    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${config.apiUrl}/api/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // INJEÇÃO DO TOKEN AQUI
        },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          full_name: formData.name,
          document: formData.document.replace(/\D/g, ''), // Limpa máscara do CPF
          phone: formData.phone.replace(/\D/g, '') // Limpa máscara do Telefone
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Sucesso! Atualiza a tela com os dados do PIX
        setPixData({
          qrcode: data.pix_qrcode_url,
          copyPaste: data.pix_copy_paste
        })
      } else {
        alert(data.detail || 'Erro ao gerar pagamento.')
      }
    } catch (error) {
      console.error(error)
      alert('Erro de conexão com o servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  // Função para copiar o código PIX para a área de transferência
  const copyToClipboard = () => {
    if (pixData?.copyPaste) {
      navigator.clipboard.writeText(pixData.copyPaste)
      alert("Código PIX copiado!")
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      {/* Header (Mantido do seu código original) */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800/50">
        <Link href="/app" className="block hover:opacity-80 transition-opacity">
          <Image src="/logobranco-semfundo.png" alt="ScreenAI Logo" width={70} height={32} className="object-contain" />
        </Link>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link href="/app" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Voltar ao App
            </Link>
          ) : (
            <>
              <button onClick={() => router.push('/login')} className="text-sm text-zinc-400 hover:text-white transition-colors">
                Entrar
              </button>
              <button onClick={() => router.push('/login')} className="text-sm bg-white text-zinc-900 hover:bg-zinc-200 px-4 py-1.5 rounded-lg font-medium transition-colors">
                Cadastrar
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center pt-24 pb-12 px-4">
        <h1 className="text-4xl md:text-[42px] leading-[1.1] font-semibold mb-4 text-white">
          A IA que enxerga sua tela,<br />no plano certo pra você
        </h1>
        <p className="text-zinc-400 text-[15px] mt-6 tracking-wide">
          Garantia de 14 dias ou seu dinheiro de volta.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="flex-1 px-4 sm:px-6 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-[1px] flex flex-col overflow-hidden max-w-[360px] mx-auto w-full ${plan.id === 2
                ? 'border-zinc-800 bg-gradient-to-b from-white/[0.08] to-transparent'
                : 'border-zinc-800 bg-zinc-900/40'
                }`}
            >
              <div className="h-full w-full bg-black rounded-[11px] flex flex-col items-start p-7 relative overflow-hidden">

                {plan.badge && (
                  <div className="absolute top-6 right-6 z-10">
                    <span className="bg-[#1e1e1e] border border-[#333] text-zinc-300 text-[10px] px-2 py-1 rounded">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="flex flex-col gap-3 relative z-10 w-full mb-6">
                  <span className="text-[17px] text-zinc-300">{plan.name}</span>
                  <span className="text-[36px] font-medium tracking-tight text-white">{plan.price}</span>
                  <p className="text-[13px] text-zinc-400 leading-relaxed min-h-[40px] mt-1 pr-4">{plan.tagline}</p>
                </div>

                {/* CTA BUTTON */}
                <button
                  onClick={() => handlePlanClick(plan)}
                  className="w-full mb-8 h-10 rounded-[6px] font-medium text-[13px] flex items-center justify-center transition-all bg-[#4b4b4b] hover:bg-[#5b5b5b] text-zinc-200 relative z-10"
                >
                  {plan.cta}
                </button>

                {/* Feature List */}
                <div className="w-full relative z-10 flex-1">
                  <p className="text-[13px] text-white mb-4">O que está incluído:</p>
                  <ul className="space-y-4">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-[18px] h-[18px] shrink-0 text-white" />
                        <span className="text-[13px] leading-[1.4] text-zinc-300">
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual glow - Top left */}
                {plan.id === 2 && (
                  <div className="absolute -top-[150px] -left-[150px] w-[300px] h-[300px] bg-white/[0.08] rounded-full blur-[80px] pointer-events-none z-0" />
                )}

                {/* Visual bottom glow */}
                <div className={`absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t pointer-events-none z-0 ${plan.id === 2 ? 'from-white/[0.05] to-transparent' : 'from-white/[0.015] to-transparent'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================
        MODAL DE CHECKOUT PIX (NOVIDADE)
        ================================================================
      */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-md bg-[#1f1f1f] border-zinc-800 text-zinc-100 p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Assinar {selectedPlan?.name}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {pixData
                ? "Escaneie o QR Code abaixo para ativar seu plano instantaneamente."
                : "Preencha seus dados para gerar o pagamento via PIX."}
            </DialogDescription>
          </DialogHeader>

          {!pixData ? (
            // PASSO 1: FORMULÁRIO DE DADOS
            <form onSubmit={handleCheckoutSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300">Nome Completo</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#111] border-zinc-800 text-white placeholder:text-zinc-600"
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document" className="text-zinc-300">CPF</Label>
                <Input
                  id="document"
                  required
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  className="bg-[#111] border-zinc-800 text-white placeholder:text-zinc-600"
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-zinc-300">Telefone / WhatsApp</Label>
                <Input
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-[#111] border-zinc-800 text-white placeholder:text-zinc-600"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                {isLoading ? "Gerando PIX..." : "Gerar PIX"}
              </Button>
            </form>
          ) : (
            // PASSO 2: TELA DO PIX GERADO
            <div className="flex flex-col items-center justify-center space-y-6 mt-4">
              <div className="bg-white p-4 rounded-xl">
                {/* QR Code gerado pela AlphaPay */}
                <img
                  src={pixData.qrcode}
                  alt="QR Code PIX"
                  width={200}
                  height={200}
                  className="rounded-lg object-contain bg-white"
                />
              </div>

              <div className="w-full space-y-2">
                <Label className="text-zinc-300">Código Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={pixData.copyPaste}
                    className="bg-[#111] border-zinc-800 text-zinc-400 font-mono text-xs"
                  />
                  <Button onClick={copyToClipboard} variant="outline" size="icon" className="shrink-0 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-white">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="w-full p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-sm text-indigo-200 text-center">
                  Após o pagamento, seu plano será ativado automaticamente. Feche esta janela e aguarde alguns segundos.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
