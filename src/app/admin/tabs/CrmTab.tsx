"use client"

import React, { useState, useEffect, useRef } from 'react'
import { 
  MessageSquare, 
  Bot, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  History, 
  Settings, 
  ShieldAlert, 
  Send, 
  Clock, 
  Search, 
  RefreshCw, 
  Loader2, 
  Plus, 
  Phone,
  Building,
  UserPlus,
  Zap,
  PhoneCall,
  Mail,
  TrendingUp,
  BarChart3,
  CheckCircle,
  XCircle,
  DollarSign,
  Filter,
  Eye,
  Edit3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Contact {
  phone_number: string
  name?: string
  instance: string
  status: 'ai' | 'human' | 'waiting_human'
  last_message?: string
  updated_at?: string
}

interface Message {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

interface Appointment {
  id: number
  client_name: string
  client_phone: string
  date: string
  status: string
  attendant_name?: string
  instance_name?: string
}

interface Tenant {
  id: number
  name: string
  instance_name: string
  system_prompt?: string
}

interface UserAccount {
  id: number
  username: string
  name: string
  role: string
  tenant_id?: number
  whatsapp_number?: string
  specialty?: string
}

interface TriggerRule {
  id: string
  trigger_type: string
  title: string
  subject: string
  enabled: boolean
  delay_minutes: number
  template: string
}

interface DispatchRecord {
  id: number
  user_id: number
  recipient_email: string
  user_name: string
  trigger_type: string
  trigger_title: string
  subject: string
  channel: string
  status: string
  dispatched_at: string
}

interface Seller {
  id: number
  name: string
  email: string
  role: string
}

interface SalesCall {
  id: number
  client_name: string
  client_phone: string
  client_email?: string
  seller_id: number
  seller_name: string
  scheduled_at: string
  status: string // Agendado, Realizado, No-show, Vendido, Cancelado
  deal_amount?: number
  notes?: string
  dispatch_history?: { date: string; type: string; channel: string; summary: string }[]
}

interface CrmMetrics {
  summary: {
    total_calls: number
    attended_calls: number
    closed_deals: number
    conversion_rate: number
    attendance_rate: number
    total_revenue: number
  }
  sellers_metrics: {
    seller_id: number
    seller_name: string
    role: string
    total_calls: number
    closed_deals: number
    conversion_rate: number
    revenue: number
  }[]
}

const MOCK_CONTACTS: Contact[] = [
  {
    phone_number: "+5511998765432",
    name: "Carlos Eduardo",
    instance: "empresa_sp",
    status: "ai",
    last_message: "Gostaria de agendar uma demonstração do sistema.",
    updated_at: new Date().toISOString()
  },
  {
    phone_number: "+5511981234567",
    name: "Ana Paula Souza",
    instance: "empresa_sp",
    status: "waiting_human",
    last_message: "Quero falar com um atendente humano, por favor!",
    updated_at: new Date().toISOString()
  },
  {
    phone_number: "+5511977778888",
    name: "Juliana Mendes",
    instance: "empresa_tech",
    status: "human",
    last_message: "Atendimento iniciado pela equipe comercial.",
    updated_at: new Date().toISOString()
  }
]

const MOCK_MESSAGES: Record<string, Message[]> = {
  "+5511998765432": [
    { id: "1", role: "user", content: "Olá! Vocês têm integração da IA com WhatsApp?", created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: "2", role: "assistant", content: "Olá Carlos! Sim, possuímos integração completa via API com WhatsApp. Gostaria de agendar uma demonstração?", created_at: new Date(Date.now() - 3500000).toISOString() }
  ]
}

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 1, client_name: "Carlos Eduardo", client_phone: "+5511998765432", date: "2026-08-20T14:00:00.000Z", status: "Confirmado", attendant_name: "Atendente Beatriz", instance_name: "empresa_sp" }
]

const MOCK_TENANTS: Tenant[] = [
  { id: 1, name: "Empresa SP Workspace", instance_name: "empresa_sp", system_prompt: "Você é a assistente virtual da Empresa SP Workspace." }
]

const MOCK_USERS: UserAccount[] = [
  { id: 1, username: "maria_atendente", name: "Maria Silva", role: "attendant", whatsapp_number: "+5511911112222", specialty: "Recepção" }
]

const MOCK_TRIGGERS: TriggerRule[] = [
  { id: "cadastrar", trigger_type: "cadastrar", title: "Boas-vindas (Novo Cadastro)", subject: "🎉 Bem-vindo ao ScreenAI! Seu teste gratuito começou", enabled: true, delay_minutes: 0, template: "<h1>Olá, {name}!</h1><p>Bem-vindo ao ScreenAI.</p>" },
  { id: "apos_1_dia", trigger_type: "apos_1_dia", title: "Engajamento (1 Dia de Uso)", subject: "💡 Dicas para aproveitar 100% da sua IA no ScreenAI", enabled: true, delay_minutes: 1440, template: "<h1>Olá, {name}!</h1><p>Confira novas dicas.</p>" },
  { id: "apos_7_dias", trigger_type: "apos_7_dias", title: "Retenção (7 Dias de Uso)", subject: "🌟 7 dias com o ScreenAI! Como podemos ajudar mais?", enabled: true, delay_minutes: 10080, template: "<h1>Olá, {name}!</h1><p>7 dias juntos!</p>" },
  { id: "abriu_checkout", trigger_type: "abriu_checkout", title: "Checkout Abandonado", subject: "⚡ Não perca o seu acesso Pro no ScreenAI!", enabled: true, delay_minutes: 15, template: "<h1>Olá, {name}!</h1><p>Finalize seu Plano Pro.</p>" },
  { id: "nao_completou_cadastro", trigger_type: "nao_completou_cadastro", title: "Onboarding Incompleto", subject: "📝 Falta pouco para concluir seu perfil no ScreenAI", enabled: true, delay_minutes: 30, template: "<h1>Olá, {name}!</h1><p>Complete seu perfil.</p>" },
  { id: "cadastrou_mas_nao_usou", trigger_type: "cadastrou_mas_nao_usou", title: "Usuário Inativo (Sem Uso)", subject: "❓ Precisa de ajuda para fazer sua primeira pergunta?", enabled: true, delay_minutes: 2880, template: "<h1>Olá, {name}!</h1><p>Faça seu primeiro teste.</p>" },
  { id: "pagamento_recusado", trigger_type: "pagamento_recusado", title: "Pagamento Recusado", subject: "⚠️ Houve um problema com o seu pagamento - ScreenAI Pro", enabled: true, delay_minutes: 0, template: "<h1>Ops, {name}!</h1><p>Pagamento recusado. Tente o PIX.</p>" },
  { id: "trial_acabando", trigger_type: "trial_acabando", title: "Aviso de Fim de Testes", subject: "⏳ Seu período de testes no ScreenAI está terminando", enabled: true, delay_minutes: 0, template: "<h1>Atenção, {name}!</h1><p>Falta 48h para terminar.</p>" },
  { id: "bateu_limite_tokens", trigger_type: "bateu_limite_tokens", title: "Limite de Tokens Atingido", subject: "⚡ Seus créditos acabaram! Recarregue para continuar usando a IA", enabled: true, delay_minutes: 0, template: "<h1>Créditos acabaram, {name}!</h1><p>Faça o upgrade.</p>" }
]

const MOCK_SELLERS: Seller[] = [
  { id: 1, name: "Gabriel Caldas", email: "gabriel@screenai.com", role: "Closer Sênior" },
  { id: 2, name: "Marx Rocha", email: "marx@screenai.com", role: "Head de Vendas" },
  { id: 3, name: "Atendente A", email: "atendente_a@screenai.com", role: "SDR / Pré-venda" }
]

const MOCK_DISPATCHES: DispatchRecord[] = [
  { id: 1, user_id: 10, recipient_email: "carlos.eduardo@exemplo.com", user_name: "Carlos Eduardo", trigger_type: "abriu_checkout", trigger_title: "Checkout Abandonado", subject: "⚡ Não perca o seu acesso Pro no ScreenAI!", channel: "email", status: "success", dispatched_at: new Date().toISOString() },
  { id: 2, user_id: 12, recipient_email: "ana.paula@exemplo.com", user_name: "Ana Paula Souza", trigger_type: "bateu_limite_tokens", trigger_title: "Limite de Tokens Atingido", subject: "⚡ Seus créditos acabaram!", channel: "email", status: "success", dispatched_at: new Date().toISOString() }
]

const MOCK_CALLS: SalesCall[] = [
  {
    id: 1,
    client_name: "Carlos Eduardo",
    client_phone: "+5511998765432",
    client_email: "carlos.eduardo@exemplo.com",
    seller_id: 1,
    seller_name: "Gabriel Caldas",
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    status: "Vendido",
    deal_amount: 797.90,
    notes: "Interessado no Plano Pro Anual.",
    dispatch_history: [
      { date: new Date(Date.now() - 3600000).toISOString(), type: "cadastrar", channel: "email", summary: "E-mail de Boas-vindas enviado" },
      { date: new Date(Date.now() - 1800000).toISOString(), type: "abriu_checkout", channel: "email", summary: "E-mail Lembrete Checkout enviado" }
    ]
  },
  {
    id: 2,
    client_name: "Ana Paula Souza",
    client_phone: "+5511981234567",
    client_email: "ana.paula@exemplo.com",
    seller_id: 2,
    seller_name: "Marx Rocha",
    scheduled_at: new Date(Date.now() + 172800000).toISOString(),
    status: "Agendado",
    deal_amount: 0.0,
    notes: "Dúvidas sobre pacote corporativo de tokens.",
    dispatch_history: [
      { date: new Date(Date.now() - 7200000).toISOString(), type: "bateu_limite_tokens", channel: "email", summary: "E-mail Limite de Tokens enviado" }
    ]
  }
]

export function CrmTab() {
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:8000/api/v1")
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'queue' | 'agenda' | 'disparos' | 'calls' | 'settings' | 'admin'>('chat')
  
  const [contacts, setContacts] = useState<Contact[]>([])
  const [activeContact, setActiveContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [isMockMode, setIsMockMode] = useState(false)

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [users, setUsers] = useState<UserAccount[]>([])

  // Estados dos Disparos Automáticos
  const [triggers, setTriggers] = useState<TriggerRule[]>(MOCK_TRIGGERS)
  const [dispatches, setDispatches] = useState<DispatchRecord[]>(MOCK_DISPATCHES)
  const [selectedTriggerModal, setSelectedTriggerModal] = useState<TriggerRule | null>(null)
  const [testingTrigger, setTestingTrigger] = useState<string | null>(null)
  const [testEmailInput, setTestEmailInput] = useState("")

  // Estados das Calls e Sellers
  const [sellers, setSellers] = useState<Seller[]>(MOCK_SELLERS)
  const [calls, setCalls] = useState<SalesCall[]>(MOCK_CALLS)
  const [selectedSellerFilter, setSelectedSellerFilter] = useState<number | 'all'>('all')
  const [selectedCallContext, setSelectedCallContext] = useState<SalesCall | null>(null)
  const [newCallModal, setNewCallModal] = useState(false)
  const [newCallData, setNewCallData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    seller_id: 1,
    scheduled_at: '',
    notes: ''
  })

  const [metrics, setMetrics] = useState<CrmMetrics["summary"]>({
    total_calls: 2,
    attended_calls: 1,
    closed_deals: 1,
    conversion_rate: 50.0,
    attendance_rate: 50.0,
    total_revenue: 797.90
  })

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const fetchContacts = async () => {
    setLoadingContacts(true)
    try {
      const res = await fetch(`${apiBaseUrl}/contacts`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setContacts(data)
          setIsMockMode(false)
          return
        }
      }
    } catch (e) {
      console.warn("CRM Backend API offline, usando Mock:", e)
    } finally {
      setLoadingContacts(false)
    }
    setIsMockMode(true)
    setContacts(prev => prev.length > 0 ? prev : MOCK_CONTACTS)
  }

  const fetchCrmData = async () => {
    try {
      const resT = await fetch('/api/crm/triggers')
      if (resT.ok) {
        const d = await resT.json()
        if (d.triggers) setTriggers(d.triggers)
      }

      const resD = await fetch('/api/crm/dispatches')
      if (resD.ok) {
        const d = await resD.json()
        if (d.dispatches) setDispatches(d.dispatches)
      }

      const resS = await fetch('/api/crm/sellers')
      if (resS.ok) {
        const d = await resS.json()
        if (d.sellers) setSellers(d.sellers)
      }

      const resC = await fetch('/api/crm/calls')
      if (resC.ok) {
        const d = await resC.json()
        if (d.calls) setCalls(d.calls)
      }

      const resM = await fetch('/api/crm/metrics')
      if (resM.ok) {
        const d = await resM.json()
        if (d.summary) setMetrics(d.summary)
      }
    } catch (e) {
      console.warn("CRM API em modo Mock local:", e)
    }
  }

  useEffect(() => {
    fetchContacts()
    fetchCrmData()
  }, [])

  const handleTestDispatch = async (triggerType: string) => {
    setTestingTrigger(triggerType)
    try {
      const res = await fetch('/api/crm/triggers/test-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger_type: triggerType, email: testEmailInput || undefined })
      })
      const data = await res.json()
      alert(`✅ Disparo de teste para '${triggerType}' concluído com sucesso! (Log gerado para o Grafana)`)
      fetchCrmData()
    } catch (e) {
      alert(`✅ Simulação de disparo para '${triggerType}' executada com sucesso!`)
    } finally {
      setTestingTrigger(null)
    }
  }

  const handleCreateCall = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCallData.client_name || !newCallData.client_phone) return

    const sellerObj = sellers.find(s => s.id === Number(newCallData.seller_id)) || sellers[0]
    const created: SalesCall = {
      id: Date.now(),
      client_name: newCallData.client_name,
      client_phone: newCallData.client_phone,
      client_email: newCallData.client_email,
      seller_id: sellerObj.id,
      seller_name: sellerObj.name,
      scheduled_at: newCallData.scheduled_at || new Date().toISOString(),
      status: 'Agendado',
      deal_amount: 0.0,
      notes: newCallData.notes || 'Agendado via CRM.',
      dispatch_history: [
        { date: new Date().toISOString(), type: 'cadastrar', channel: 'email', summary: 'E-mail de Boas-vindas enviado' }
      ]
    }

    try {
      await fetch('/api/crm/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCallData)
      })
    } catch (e) {
      console.warn("Call criada no modo local")
    }

    setCalls(prev => [created, ...prev])
    setNewCallModal(false)
    setNewCallData({ client_name: '', client_phone: '', client_email: '', seller_id: 1, scheduled_at: '', notes: '' })
    alert("Call agendada com sucesso!")
  }

  const handleUpdateCallStatus = async (callId: number, status: string, dealAmount?: number) => {
    setCalls(prev => prev.map(c => c.id === callId ? { ...c, status, deal_amount: dealAmount ?? c.deal_amount } : c))
    try {
      await fetch(`/api/crm/calls/${callId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, deal_amount: dealAmount })
      })
    } catch (e) {
      console.warn("Status atualizado no modo local")
    }
  }

  const filteredCalls = selectedSellerFilter === 'all'
    ? calls
    : calls.filter(c => c.seller_id === selectedSellerFilter)

  const pendingContacts = contacts.filter(c => c.status === 'waiting_human')

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-lg">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-zinc-100">Módulo WhatsApp CRM & Automações</h3>
              {isMockMode && (
                <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md">
                  Modo Ativo (Mock & API)
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">Atendimento multitenant, disparos automáticos e métricas de vendedores</p>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'chat' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Conversas
          </button>
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'queue' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" /> Fila Pendente
            {pendingContacts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-amber-500 text-black font-bold rounded-full animate-pulse">
                {pendingContacts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('disparos')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'disparos' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Disparos Automáticos
          </button>
          <button
            onClick={() => setActiveSubTab('calls')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'calls' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" /> Calls & Sellers
          </button>
          <button
            onClick={() => setActiveSubTab('agenda')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'agenda' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Agendamentos
          </button>
        </div>
      </div>

      {/* DISPAROS AUTOMÁTICOS TAB */}
      {activeSubTab === 'disparos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-zinc-900/40 p-4 border border-zinc-800 rounded-xl">
            <div>
              <h4 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Eventos de Disparos Automáticos (9 Gatilhos)
              </h4>
              <p className="text-xs text-zinc-400">Mensagens e e-mails disparados 100% automaticamente conforme eventos do ciclo de vida.</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="E-mail para teste de disparo..."
                value={testEmailInput}
                onChange={e => setTestEmailInput(e.target.value)}
                className="w-64 bg-zinc-950 border-zinc-800 text-xs text-zinc-100"
              />
            </div>
          </div>

          {/* Cards dos 9 Gatilhos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {triggers.map(trig => (
              <Card key={trig.id} className="bg-zinc-950 border-zinc-800 relative overflow-hidden flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                      {trig.trigger_type}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <CheckCircle className="w-3 h-3" /> Automático
                    </span>
                  </div>
                  <CardTitle className="text-sm font-semibold text-zinc-100 mt-2">
                    {trig.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400 truncate">
                    Assunto: "{trig.subject}"
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="p-2.5 bg-zinc-900/80 border border-zinc-800 rounded text-[11px] text-zinc-300 font-mono line-clamp-3">
                    {trig.template.replace(/<[^>]*>?/gm, '')}
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-900">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTriggerModal(trig)}
                      className="text-xs border-zinc-800 hover:bg-zinc-900 text-zinc-300"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> Ver Template
                    </Button>
                    <Button
                      size="sm"
                      disabled={testingTrigger === trig.trigger_type}
                      onClick={() => handleTestDispatch(trig.trigger_type)}
                      className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {testingTrigger === trig.trigger_type ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 mr-1" /> Testar Disparo
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Histórico de Disparos Automáticos */}
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400" /> Log de Disparos Enviados (Grafana Stream)
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">Histórico de e-mails disparados em tempo real pelo servidor.</CardDescription>
              </div>
              <span className="text-xs font-mono text-zinc-400">Total: {dispatches.length} enviados</span>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-zinc-300">
                  <thead className="text-[11px] text-zinc-400 uppercase bg-zinc-900/60 border-b border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3">Gatilho</th>
                      <th className="py-2.5 px-3">Destinatário</th>
                      <th className="py-2.5 px-3">Assunto</th>
                      <th className="py-2.5 px-3">Canal</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Data/Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {dispatches.map(d => (
                      <tr key={d.id} className="hover:bg-zinc-900/40">
                        <td className="py-2.5 px-3 font-semibold text-indigo-400">{d.trigger_title}</td>
                        <td className="py-2.5 px-3 font-mono">{d.recipient_email}</td>
                        <td className="py-2.5 px-3 text-zinc-300 truncate max-w-xs">{d.subject}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 text-[10px] bg-zinc-800 text-zinc-200 rounded uppercase">
                            {d.channel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-medium">
                            {d.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400 font-mono">
                          {new Date(d.dispatched_at).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CALLS & SELLERS TAB */}
      {activeSubTab === 'calls' && (
        <div className="space-y-6">
          {/* Dashboard de Métricas de Conversão */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400">Conversão Geral</p>
                  <h3 className="text-xl font-bold text-emerald-400 mt-1">{metrics.conversion_rate}%</h3>
                  <p className="text-[10px] text-zinc-500 mt-1">{metrics.closed_deals} de {metrics.total_calls} calls vendidas</p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400">Faturamento Vendas</p>
                  <h3 className="text-xl font-bold text-indigo-400 mt-1">R$ {metrics.total_revenue.toFixed(2)}</h3>
                  <p className="text-[10px] text-zinc-500 mt-1">Receita fechada via CRM</p>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400">Comparecimento</p>
                  <h3 className="text-xl font-bold text-amber-400 mt-1">{metrics.attendance_rate}%</h3>
                  <p className="text-[10px] text-zinc-500 mt-1">{metrics.attended_calls} reuniões realizadas</p>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                  <UserCheck className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400">Total de Calls</p>
                  <h3 className="text-xl font-bold text-zinc-100 mt-1">{metrics.total_calls}</h3>
                  <p className="text-[10px] text-zinc-500 mt-1">Agendadas por vendedores</p>
                </div>
                <div className="p-3 bg-zinc-800 text-zinc-300 rounded-xl">
                  <PhoneCall className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bar & Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/50 p-4 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-300 font-medium">Filtrar Calls por Seller:</span>
              <select
                value={selectedSellerFilter}
                onChange={e => setSelectedSellerFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="all">Todos os Vendedores ({sellers.length})</option>
                {sellers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => setNewCallModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
            >
              <Plus className="w-4 h-4 mr-1" /> Agendar Nova Call
            </Button>
          </div>

          {/* Tabela de Calls Segmentada por Seller */}
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400" /> Agendamentos & Vendas por Seller
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-zinc-300">
                  <thead className="text-[11px] text-zinc-400 uppercase bg-zinc-900/60 border-b border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3">Cliente</th>
                      <th className="py-2.5 px-3">Telefone / E-mail</th>
                      <th className="py-2.5 px-3">Seller Responsável</th>
                      <th className="py-2.5 px-3">Data / Hora</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Valor Fechado</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {filteredCalls.map(c => (
                      <tr key={c.id} className="hover:bg-zinc-900/40">
                        <td className="py-2.5 px-3 font-semibold text-zinc-100">{c.client_name}</td>
                        <td className="py-2.5 px-3 font-mono text-zinc-400">
                          {c.client_phone} {c.client_email && `<${c.client_email}>`}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-medium">
                            {c.seller_name}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-400">
                          {new Date(c.scheduled_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={c.status}
                            onChange={e => handleUpdateCallStatus(c.id, e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-200 rounded px-2 py-1 focus:outline-none"
                          >
                            <option value="Agendado">Agendado</option>
                            <option value="Realizado">Realizado</option>
                            <option value="No-show">No-show</option>
                            <option value="Vendido">Vendido</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-400">
                          R$ {(c.deal_amount || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCallContext(c)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Histórico & Contexto
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CONVERSAS CHAT TAB */}
      {activeSubTab === 'chat' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[650px]">
          {/* Contacts Sidebar */}
          <div className="md:col-span-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
            <div className="p-3 border-b border-zinc-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                <Input
                  placeholder="Buscar contato ou telefone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 bg-zinc-950 border-zinc-800 text-xs text-zinc-100"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
              {filteredContacts.map(c => (
                <div
                  key={c.phone_number}
                  onClick={() => setActiveContact(c)}
                  className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                    activeContact?.phone_number === c.phone_number ? 'bg-indigo-600/10 border-l-2 border-indigo-500' : 'hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-semibold text-xs">
                      {(c.name || c.phone_number).substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">{c.name || c.phone_number}</h4>
                      <p className="text-[11px] text-zinc-400 truncate max-w-[160px]">{c.last_message}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] rounded font-medium ${
                    c.status === 'ai' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {c.status === 'ai' ? 'IA Ativa' : 'Humano'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Chat Box */}
          <div className="md:col-span-8 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
            {activeContact ? (
              <>
                <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100">{activeContact.name || activeContact.phone_number}</h4>
                    <p className="text-[10px] text-zinc-400 font-mono">{activeContact.phone_number}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs border-zinc-800 text-zinc-300">
                    <Bot className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Reativar IA
                  </Button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-950/40">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] p-3 rounded-xl text-xs ${
                        m.role === 'user' ? 'bg-zinc-800 text-zinc-200' : 'bg-indigo-600 text-white'
                      }`}>
                        <p>{m.content}</p>
                        <span className="text-[9px] opacity-60 mt-1 block text-right font-mono">
                          {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={e => { e.preventDefault(); if (inputText.trim()) { setMessages(prev => [...prev, { role: 'assistant', content: inputText, created_at: new Date().toISOString() }]); setInputText(''); } }} className="p-3 border-t border-zinc-800 flex items-center gap-2 bg-zinc-950">
                  <Input
                    placeholder="Digite sua mensagem de atendimento..."
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100"
                  />
                  <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
                <MessageSquare className="w-12 h-12 mb-3 text-zinc-700" />
                <p className="text-xs">Selecione um contato na lista para iniciar o atendimento humano.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL TEMPLATE TRIGGER PREVIEW */}
      {selectedTriggerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> {selectedTriggerModal.title}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setSelectedTriggerModal(null)} className="text-zinc-400">✕</Button>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Assunto do E-mail:</p>
              <div className="p-2 bg-zinc-900 text-xs font-semibold text-zinc-100 rounded border border-zinc-800">
                {selectedTriggerModal.subject}
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Prévia do Template HTML:</p>
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-zinc-200 max-h-60 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: selectedTriggerModal.template }} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setSelectedTriggerModal(null)} className="bg-zinc-800 text-xs text-zinc-200">Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTEXTO DA CALL E HISTÓRICO */}
      {selectedCallContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" /> Histórico & Contexto: {selectedCallContext.client_name}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setSelectedCallContext(null)} className="text-zinc-400">✕</Button>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong className="text-zinc-400">Seller Responsável:</strong> {selectedCallContext.seller_name}</p>
              <p><strong className="text-zinc-400">Telefone:</strong> {selectedCallContext.client_phone}</p>
              <p><strong className="text-zinc-400">Notas do Agendamento:</strong> {selectedCallContext.notes}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-200 mb-2">Disparos Automáticos Enviados ao Cliente:</h4>
              <div className="space-y-2">
                {selectedCallContext.dispatch_history?.map((dh, idx) => (
                  <div key={idx} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded text-xs flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-indigo-400 uppercase text-[10px] block">{dh.type}</span>
                      <span className="text-zinc-300">{dh.summary}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{new Date(dh.date).toLocaleTimeString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setSelectedCallContext(null)} className="bg-zinc-800 text-xs text-zinc-200">Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRIAR CALL */}
      {newCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-400" /> Agendar Nova Call de Vendas
            </h3>
            <form onSubmit={handleCreateCall} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400">Nome do Cliente</label>
                <Input
                  required
                  placeholder="Carlos Eduardo"
                  value={newCallData.client_name}
                  onChange={e => setNewCallData(prev => ({ ...prev, client_name: e.target.value }))}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 mt-1"
                />
              </div>
              <div>
                <label className="text-zinc-400">Telefone / WhatsApp</label>
                <Input
                  required
                  placeholder="+5511998765432"
                  value={newCallData.client_phone}
                  onChange={e => setNewCallData(prev => ({ ...prev, client_phone: e.target.value }))}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 mt-1"
                />
              </div>
              <div>
                <label className="text-zinc-400">E-mail (Opcional)</label>
                <Input
                  placeholder="cliente@exemplo.com"
                  value={newCallData.client_email}
                  onChange={e => setNewCallData(prev => ({ ...prev, client_email: e.target.value }))}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 mt-1"
                />
              </div>
              <div>
                <label className="text-zinc-400">Seller Responsável</label>
                <select
                  value={newCallData.seller_id}
                  onChange={e => setNewCallData(prev => ({ ...prev, seller_id: Number(e.target.value) }))}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 rounded-lg p-2 mt-1"
                >
                  {sellers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-zinc-400">Data e Hora da Reunião</label>
                <Input
                  type="datetime-local"
                  value={newCallData.scheduled_at}
                  onChange={e => setNewCallData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 mt-1"
                />
              </div>
              <div>
                <label className="text-zinc-400">Observações / Contexto</label>
                <Input
                  placeholder="Interessado no Plano Pro..."
                  value={newCallData.notes}
                  onChange={e => setNewCallData(prev => ({ ...prev, notes: e.target.value }))}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setNewCallModal(false)} className="text-xs border-zinc-800 text-zinc-300">
                  Cancelar
                </Button>
                <Button type="submit" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                  Agendar Call
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
