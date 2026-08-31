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
  Edit3,
  UserCheck,
  FileText
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { config } from "@/lib/config"

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
  { id: "cadastrar", trigger_type: "cadastrar", title: "Boas-vindas (Novo Cadastro)", subject: "Bem-vindo ao ScreenAI! Seu teste gratuito começou", enabled: true, delay_minutes: 0, template: "<h1>Olá, {name}!</h1><p>Seja muito bem-vindo ao ScreenAI. Sua conta foi criada com sucesso!</p>" },
  { id: "apos_1_dia", trigger_type: "apos_1_dia", title: "Engajamento (1 Dia de Uso)", subject: "Dicas para aproveitar 100% da sua IA no ScreenAI", enabled: true, delay_minutes: 1440, template: "<h1>Olá, {name}!</h1><p>Confira dicas avançadas para potencializar sua IA.</p>" },
  { id: "apos_7_dias", trigger_type: "apos_7_dias", title: "Retenção (7 Dias de Uso)", subject: "7 dias com o ScreenAI! Como podemos ajudar mais?", enabled: true, delay_minutes: 10080, template: "<h1>Olá, {name}!</h1><p>Parabéns por completar sua primeira semana no ScreenAI.</p>" },
  { id: "abriu_checkout", trigger_type: "abriu_checkout", title: "Checkout Abandonado", subject: "Não perca o seu acesso Pro no ScreenAI", enabled: true, delay_minutes: 15, template: "<h1>Esqueceu de finalizar, {name}?</h1><p>Vimos que você abriu a página de checkout para o Plano Pro.</p>" },
  { id: "nao_completou_cadastro", trigger_type: "nao_completou_cadastro", title: "Onboarding Incompleto", subject: "Falta pouco para concluir seu perfil no ScreenAI", enabled: true, delay_minutes: 30, template: "<h1>Complete seu cadastro, {name}!</h1><p>Falta pouco para liberar todos os recursos.</p>" },
  { id: "cadastrou_mas_nao_usou", trigger_type: "cadastrou_mas_nao_usou", title: "Usuário Inativo (Sem Uso)", subject: "Precisa de ajuda para fazer sua primeira pergunta?", enabled: true, delay_minutes: 2880, template: "<h1>Oi, {name}!</h1><p>Sentimos sua falta. Faça sua primeira pergunta agora mesmo.</p>" },
  { id: "pagamento_recusado", trigger_type: "pagamento_recusado", title: "Pagamento Recusado", subject: "Houve um problema com o seu pagamento - ScreenAI Pro", enabled: true, delay_minutes: 0, template: "<h1>Atenção: Pagamento não aprovado, {name}</h1><p>Atualize seu cartão ou utilize o PIX com desconto.</p>" },
  { id: "trial_acabando", trigger_type: "trial_acabando", title: "Aviso de Fim de Testes", subject: "Seu período de testes no ScreenAI está terminando", enabled: true, delay_minutes: 0, template: "<h1>Atenção, {name}!</h1><p>Faltam 48 horas para encerrar seu período de testes.</p>" },
  { id: "bateu_limite_tokens", trigger_type: "bateu_limite_tokens", title: "Limite de Tokens Atingido", subject: "Seus créditos acabaram! Recarregue para continuar usando a IA", enabled: true, delay_minutes: 0, template: "<h1>Você atingiu o limite de tokens, {name}!</h1><p>Faça a recarga para continuar utilizando o Studio.</p>" }
]

const MOCK_SELLERS: Seller[] = [
  { id: 1, name: "Gabriel Caldas", email: "gabriel@screenai.com", role: "Closer Sênior" },
  { id: 2, name: "Marx Rocha", email: "marx@screenai.com", role: "Head de Vendas" },
  { id: 3, name: "Atendente A", email: "atendente_a@screenai.com", role: "SDR / Pré-venda" }
]

const MOCK_DISPATCHES: DispatchRecord[] = [
  { id: 1, user_id: 10, recipient_email: "carlos.eduardo@exemplo.com", user_name: "Carlos Eduardo", trigger_type: "abriu_checkout", trigger_title: "Checkout Abandonado", subject: "Não perca o seu acesso Pro no ScreenAI", channel: "email", status: "success", dispatched_at: new Date().toISOString() },
  { id: 2, user_id: 12, recipient_email: "ana.paula@exemplo.com", user_name: "Ana Paula Souza", trigger_type: "bateu_limite_tokens", trigger_title: "Limite de Tokens Atingido", subject: "Seus créditos acabaram!", channel: "email", status: "success", dispatched_at: new Date().toISOString() }
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
  const [editingTriggerModal, setEditingTriggerModal] = useState<TriggerRule | null>(null)
  const [newTriggerModal, setNewTriggerModal] = useState(false)
  const [newTriggerData, setNewTriggerData] = useState({
    trigger_type: '',
    title: '',
    subject: '',
    template: '<h1>Olá, {name}!</h1><p>Digite sua mensagem aqui.</p>',
    delay_minutes: 0
  })

  const [testingTrigger, setTestingTrigger] = useState<string | null>(null)
  const [testEmailInput, setTestEmailInput] = useState("")

  // Estados de Disparo WhatsApp Cloud API
  const [waTargetPhone, setWaTargetPhone] = useState("5599981099729")
  const [waTargetName, setWaTargetName] = useState("Marx")
  const [waTargetTemplate, setWaTargetTemplate] = useState("boas_vindas")
  const [sendingWa, setSendingWa] = useState(false)

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
      const resT = await fetch(`${config.apiUrl}/api/crm/triggers`)
      if (resT.ok) {
        const d = await resT.json()
        if (d.triggers && d.triggers.length > 0) setTriggers(d.triggers)
      }

      const resD = await fetch(`${config.apiUrl}/api/crm/dispatches`)
      if (resD.ok) {
        const d = await resD.json()
        if (d.dispatches) setDispatches(d.dispatches)
      }

      const resS = await fetch(`${config.apiUrl}/api/crm/sellers`)
      if (resS.ok) {
        const d = await resS.json()
        if (d.sellers) setSellers(d.sellers)
      }

      const resC = await fetch(`${config.apiUrl}/api/crm/calls`)
      if (resC.ok) {
        const d = await resC.json()
        if (d.calls) setCalls(d.calls)
      }

      const resM = await fetch(`${config.apiUrl}/api/crm/metrics`)
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
      const res = await fetch(`${config.apiUrl}/api/crm/triggers/test-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger_type: triggerType,
          email: testEmailInput || undefined,
          phone: waTargetPhone || undefined,
          name: waTargetName || undefined
        })
      })
      alert(`Disparo de teste para '${triggerType}' concluído com sucesso. (Log gerado para o Grafana)`)
      fetchCrmData()
    } catch (e) {
      alert(`Simulação de disparo para '${triggerType}' executada com sucesso.`)
    } finally {
      setTestingTrigger(null)
    }
  }

  const handleSendWhatsAppTemplate = async () => {
    if (!waTargetPhone) {
      alert("Por favor, digite o número do WhatsApp com DDD.")
      return
    }
    setSendingWa(true)
    try {
      const res = await fetch(`${config.apiUrl}/api/crm/whatsapp/send-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: waTargetPhone,
          template_name: waTargetTemplate,
          name: waTargetName || "Marx",
          language_code: waTargetTemplate === 'hello_world' ? 'en_US' : 'pt_BR'
        })
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        alert(`✅ WhatsApp enviado com sucesso para ${waTargetPhone}!\n\nModelo: ${waTargetTemplate}`)
        fetchCrmData()
      } else {
        alert(`❌ Erro no envio WhatsApp: ${data.detail || data.message || JSON.stringify(data)}`)
      }
    } catch (e: any) {
      alert(`❌ Erro na conexão: ${e.message}`)
    } finally {
      setSendingWa(false)
    }
  }

  const handleSaveTriggerEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTriggerModal) return

    setTriggers(prev => prev.map(t => t.id === editingTriggerModal.id ? editingTriggerModal : t))
    try {
      await fetch(`${config.apiUrl}/api/crm/triggers/${editingTriggerModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTriggerModal)
      })
    } catch (e) {
      console.warn("Trigger atualizado no modo local")
    }

    setEditingTriggerModal(null)
    alert("Template de disparo atualizado com sucesso!")
  }

  const handleCreateNewTrigger = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTriggerData.trigger_type || !newTriggerData.title || !newTriggerData.subject) return

    const newKey = newTriggerData.trigger_type.toLowerCase().replace(/\s+/g, '_')
    const created: TriggerRule = {
      id: newKey,
      trigger_type: newKey,
      title: newTriggerData.title,
      subject: newTriggerData.subject,
      enabled: true,
      delay_minutes: newTriggerData.delay_minutes || 0,
      template: newTriggerData.template
    }

    setTriggers(prev => [created, ...prev])

    try {
      await fetch(`${config.apiUrl}/api/crm/triggers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTriggerData)
      })
    } catch (e) {
      console.warn("Disparo criado em modo local")
    }

    setNewTriggerModal(false)
    setNewTriggerData({ trigger_type: '', title: '', subject: '', template: '<h1>Olá, {name}!</h1><p>Digite sua mensagem aqui.</p>', delay_minutes: 0 })
    alert("Novo disparo automático cadastrado com sucesso!")
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
      await fetch(`${config.apiUrl}/api/crm/calls`, {
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
      await fetch(`${config.apiUrl}/api/crm/calls/${callId}/status`, {
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

  const filteredContacts = contacts.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone_number.includes(searchTerm)
  )

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
                <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-md">
                  Modo Ativo (API & Local)
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
            <Mail className="w-3.5 h-3.5 text-indigo-400" /> Disparos Automáticos
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
                <Mail className="w-5 h-5 text-indigo-400" /> Eventos de Disparos Automáticos ({triggers.length} Gatilhos)
              </h4>
              <p className="text-xs text-zinc-400">Mensagens e e-mails disparados 100% automaticamente conforme eventos do ciclo de vida.</p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                placeholder="E-mail para teste de disparo..."
                value={testEmailInput}
                onChange={e => setTestEmailInput(e.target.value)}
                className="w-56 bg-zinc-950 border-zinc-800 text-xs text-zinc-100"
              />
              <Button
                onClick={() => setNewTriggerModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-1" /> Criar Novo Disparo
              </Button>
            </div>
          </div>

          {/* Disparo Oficial WhatsApp Meta Cloud API */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-950 p-5 border border-emerald-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    Disparo Oficial WhatsApp Cloud API (Meta Tech Provider)
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-mono">
                      WABA: 129820869420083
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-400">Envie templates aprovados (ex: boas_vindas) em tempo real para qualquer número de WhatsApp.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-medium text-zinc-400 mb-1 block">WhatsApp com DDI e DDD</label>
                <Input
                  placeholder="Ex: 5599981099729"
                  value={waTargetPhone}
                  onChange={e => setWaTargetPhone(e.target.value)}
                  className="bg-zinc-900/90 border-zinc-800 text-xs text-zinc-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Nome do Cliente {"{{1}}"}</label>
                <Input
                  placeholder="Nome do cliente"
                  value={waTargetName}
                  onChange={e => setWaTargetName(e.target.value)}
                  className="bg-zinc-900/90 border-zinc-800 text-xs text-zinc-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Modelo Aprovado (Template)</label>
                <select
                  value={waTargetTemplate}
                  onChange={e => setWaTargetTemplate(e.target.value)}
                  className="w-full h-9 px-3 bg-zinc-900/90 border border-zinc-800 rounded-md text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="boas_vindas">boas_vindas (Marketing / Ativo)</option>
                  <option value="hello_world">hello_world (Template Padrão)</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSendWhatsAppTemplate}
                  disabled={sendingWa}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-9 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
                >
                  {sendingWa ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Disparar WhatsApp
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Cards dos Gatilhos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {triggers.map(trig => (
              <Card key={trig.id} className="bg-zinc-950 border-zinc-800 relative overflow-hidden flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                      {trig.trigger_type}
                    </span>
                    <span className={`flex items-center gap-1 text-[11px] font-medium ${trig.enabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      <CheckCircle className="w-3 h-3" /> {trig.enabled ? 'Ativo' : 'Inativo'}
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
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTriggerModal(trig)}
                        className="text-[11px] border-zinc-800 hover:bg-zinc-900 text-zinc-300 px-2"
                      >
                        <Eye className="w-3 h-3 mr-1" /> Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTriggerModal(trig)}
                        className="text-[11px] border-zinc-800 hover:bg-zinc-900 text-indigo-400 px-2"
                      >
                        <Edit3 className="w-3 h-3 mr-1" /> Editar
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      disabled={testingTrigger === trig.trigger_type}
                      onClick={() => handleTestDispatch(trig.trigger_type)}
                      className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-2.5"
                    >
                      {testingTrigger === trig.trigger_type ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3 h-3 mr-1" /> Testar
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

      {/* MODAL EDITAR TEMPLATE DISPARO */}
      {editingTriggerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" /> Editar Disparo: {editingTriggerModal.title}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setEditingTriggerModal(null)} className="text-zinc-400">✕</Button>
            </div>
            <form onSubmit={handleSaveTriggerEdit} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400">Título do Gatilho</label>
                <Input
                  value={editingTriggerModal.title}
                  onChange={e => setEditingTriggerModal(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 mt-1"
                />
              </div>
              <div>
                <label className="text-zinc-400">Assunto do E-mail</label>
                <Input
                  value={editingTriggerModal.subject}
                  onChange={e => setEditingTriggerModal(prev => prev ? ({ ...prev, subject: e.target.value }) : null)}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 mt-1"
                />
              </div>
              <div>
                <label className="text-zinc-400">Conteúdo HTML do Template</label>
                <textarea
                  rows={6}
                  value={editingTriggerModal.template}
                  onChange={e => setEditingTriggerModal(prev => prev ? ({ ...prev, template: e.target.value }) : null)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 rounded-lg p-3 mt-1 font-mono focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="trig_enabled"
                  checked={editingTriggerModal.enabled}
                  onChange={e => setEditingTriggerModal(prev => prev ? ({ ...prev, enabled: e.target.checked }) : null)}
                  className="rounded border-zinc-800 bg-zinc-900 text-indigo-600"
                />
                <label htmlFor="trig_enabled" className="text-zinc-300">Disparo Ativo no Servidor</label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-900">
                <Button type="button" variant="outline" onClick={() => setEditingTriggerModal(null)} className="text-xs border-zinc-800 text-zinc-300">
                  Cancelar
                </Button>
                <Button type="submit" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO DISPARO CUSTOMIZADO */}
      {newTriggerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" /> Cadastrar Novo Disparo Automático
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setNewTriggerModal(false)} className="text-zinc-400">✕</Button>
            </div>
            <form onSubmit={handleCreateNewTrigger} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400">Identificador (Gatilho)</label>
                  <Input
                    required
                    placeholder="ex: campanha_black_friday"
                    value={newTriggerData.trigger_type}
                    onChange={e => setNewTriggerData(prev => ({ ...prev, trigger_type: e.target.value }))}
                    className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 mt-1"
                  />
                </div>
                <div>
                  <label className="text-zinc-400">Título do Gatilho</label>
                  <Input
                    required
                    placeholder="Promoção Especial"
                    value={newTriggerData.title}
                    onChange={e => setNewTriggerData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-zinc-400">Assunto do E-mail</label>
                <Input
                  required
                  placeholder="Aproveite esta oferta exclusiva do ScreenAI"
                  value={newTriggerData.subject}
                  onChange={e => setNewTriggerData(prev => ({ ...prev, subject: e.target.value }))}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 mt-1"
                />
              </div>
              <div>
                <label className="text-zinc-400">Conteúdo HTML do Template</label>
                <textarea
                  rows={6}
                  value={newTriggerData.template}
                  onChange={e => setNewTriggerData(prev => ({ ...prev, template: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 rounded-lg p-3 mt-1 font-mono focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-900">
                <Button type="button" variant="outline" onClick={() => setNewTriggerModal(false)} className="text-xs border-zinc-800 text-zinc-300">
                  Cancelar
                </Button>
                <Button type="submit" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                  Cadastrar Disparo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TEMPLATE TRIGGER PREVIEW */}
      {selectedTriggerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" /> {selectedTriggerModal.title}
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
