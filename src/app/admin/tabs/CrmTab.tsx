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
  UserPlus
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
  patient_name: string
  patient_phone: string
  date: string
  status: string
  doctor_name?: string
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

const MOCK_CONTACTS: Contact[] = [
  {
    phone_number: "+5511998765432",
    name: "Carlos Eduardo",
    instance: "clinica_odonto",
    status: "ai",
    last_message: "Gostaria de agendar uma avaliação ortodôntica.",
    updated_at: new Date().toISOString()
  },
  {
    phone_number: "+5511981234567",
    name: "Ana Paula Souza",
    instance: "clinica_odonto",
    status: "waiting_human",
    last_message: "Quero falar com um atendente humano, por favor!",
    updated_at: new Date().toISOString()
  },
  {
    phone_number: "+5511977778888",
    name: "Dra. Juliana Mendes",
    instance: "clinica_vida",
    status: "human",
    last_message: "Atendimento iniciado pela equipe médica.",
    updated_at: new Date().toISOString()
  },
  {
    phone_number: "+5511965432109",
    name: "Mariana Lima",
    instance: "clinica_vida",
    status: "ai",
    last_message: "Qual é o valor do clareamento dental?",
    updated_at: new Date().toISOString()
  }
]

const MOCK_MESSAGES: Record<string, Message[]> = {
  "+5511998765432": [
    { id: "1", role: "user", content: "Olá! Vocês fazem tratamento ortodôntico?", created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: "2", role: "assistant", content: "Olá Carlos! Sim, realizamos tratamentos ortodônticos completos. Gostaria de agendar uma avaliação?", created_at: new Date(Date.now() - 3500000).toISOString() },
    { id: "3", role: "user", content: "Gostaria de agendar uma avaliação ortodôntica.", created_at: new Date(Date.now() - 600000).toISOString() }
  ],
  "+5511981234567": [
    { id: "1", role: "user", content: "Preciso tirar uma dúvida sobre minha consulta.", created_at: new Date(Date.now() - 1800000).toISOString() },
    { id: "2", role: "assistant", content: "Entendido! Posso chamar um atendente para responder você agora.", created_at: new Date(Date.now() - 1700000).toISOString() },
    { id: "3", role: "user", content: "Quero falar com um atendente humano, por favor!", created_at: new Date(Date.now() - 300000).toISOString() }
  ],
  "+5511977778888": [
    { id: "1", role: "user", content: "Boa tarde, meu exame de sangramento já saiu?", created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: "2", role: "assistant", content: "Vou verificar com o laboratório e já retorno.", created_at: new Date(Date.now() - 7100000).toISOString() }
  ],
  "+5511965432109": [
    { id: "1", role: "user", content: "Qual é o valor do clareamento dental?", created_at: new Date(Date.now() - 900000).toISOString() },
    { id: "2", role: "assistant", content: "O clareamento dental custa a partir de R$ 350,00. Deseja agendar um horário?", created_at: new Date(Date.now() - 850000).toISOString() }
  ]
}

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 1, patient_name: "Carlos Eduardo", patient_phone: "+5511998765432", date: "2026-08-20T14:00:00.000Z", status: "Confirmado", doctor_name: "Dra. Beatriz", instance_name: "clinica_odonto" },
  { id: 2, patient_name: "Mariana Lima", patient_phone: "+5511965432109", date: "2026-08-21T16:30:00.000Z", status: "Pendente", doctor_name: "Dr. Roberto", instance_name: "clinica_vida" }
]

const MOCK_TENANTS: Tenant[] = [
  { id: 1, name: "Clínica Odonto SP", instance_name: "clinica_odonto", system_prompt: "Você é a assistente virtual amigável da Clínica Odonto SP. Responda com cordialidade e ajude os pacientes a agendar consultas." },
  { id: 2, name: "Clínica Médica Vida", instance_name: "clinica_vida", system_prompt: "Você é a assistente de triagem da Clínica Médica Vida. Forneça orientações gerais e tire dúvidas dos pacientes." }
]

const MOCK_USERS: UserAccount[] = [
  { id: 1, username: "maria_atendente", name: "Maria Silva", role: "attendant", whatsapp_number: "+5511911112222", specialty: "Recepção" },
  { id: 2, username: "joao_supervisor", name: "João Pedro", role: "admin", whatsapp_number: "+5511933334444", specialty: "Supervisão" }
]

export function CrmTab() {
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:8000/api/v1")
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'queue' | 'agenda' | 'settings' | 'admin'>('chat')
  
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

  const [editingPrompt, setEditingPrompt] = useState<Record<string, string>>({})
  const [savingPrompt, setSavingPrompt] = useState(false)

  const [newTenant, setNewTenant] = useState({ instance_name: '', name: '' })
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'attendant',
    tenant_id: '',
    whatsapp_number: '',
    specialty: ''
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
      console.warn("CRM Backend API offline, carregando dados Mock de teste:", e)
    } finally {
      setLoadingContacts(false)
    }
    setIsMockMode(true)
    setContacts(prev => prev.length > 0 ? prev : MOCK_CONTACTS)
  }

  const fetchMessages = async (contact: Contact) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`${apiBaseUrl}/contacts/${contact.instance}/${contact.phone_number}/messages`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setMessages(data)
          scrollToBottom()
          return
        }
      }
    } catch (e) {
      console.warn("CRM Backend API offline para mensagens, usando Mock:", e)
    } finally {
      setLoadingMessages(false)
    }
    const mockList = MOCK_MESSAGES[contact.phone_number] || [
      { id: 'm1', role: 'user', content: contact.last_message || 'Olá!', created_at: new Date().toISOString() },
      { id: 'm2', role: 'assistant', content: 'Olá! Como posso ajudar você hoje?', created_at: new Date().toISOString() }
    ]
    setMessages(mockList)
    scrollToBottom()
  }

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/appointments`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setAppointments(data)
          return
        }
      }
    } catch (e) {
      console.warn("API offline, usando agendamentos Mock")
    }
    setAppointments(prev => prev.length > 0 ? prev : MOCK_APPOINTMENTS)
  }

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/tenants`)
      if (res.ok) {
        const data: Tenant[] = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setTenants(data)
          const promptMap: Record<string, string> = {}
          data.forEach(t => {
            promptMap[t.instance_name] = t.system_prompt || ''
          })
          setEditingPrompt(promptMap)
          return
        }
      }
    } catch (e) {
      console.warn("API offline, usando instâncias Mock")
    }
    setTenants(prev => prev.length > 0 ? prev : MOCK_TENANTS)
    const promptMap: Record<string, string> = {}
    MOCK_TENANTS.forEach(t => {
      promptMap[t.instance_name] = t.system_prompt || ''
    })
    setEditingPrompt(prev => Object.keys(prev).length > 0 ? prev : promptMap)
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/users`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data)
          return
        }
      }
    } catch (e) {
      console.warn("API offline, usando usuários Mock")
    }
    setUsers(prev => prev.length > 0 ? prev : MOCK_USERS)
  }

  useEffect(() => {
    fetchContacts()
    const interval = setInterval(fetchContacts, 12000)
    return () => clearInterval(interval)
  }, [apiBaseUrl])

  useEffect(() => {
    if (activeContact) {
      fetchMessages(activeContact)
    }
  }, [activeContact])

  useEffect(() => {
    if (activeSubTab === 'agenda') fetchAppointments()
    if (activeSubTab === 'settings' || activeSubTab === 'admin') fetchTenants()
    if (activeSubTab === 'admin') fetchUsers()
  }, [activeSubTab])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !activeContact) return

    const msgContent = inputText
    setInputText("")

    setMessages(prev => [...prev, { role: 'assistant', content: msgContent, created_at: new Date().toISOString() }])
    scrollToBottom()

    try {
      await fetch(`${apiBaseUrl}/contacts/${activeContact.instance}/${activeContact.phone_number}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msgContent })
      })
    } catch (e) {
      console.warn("Mensagem enviada no modo Mock frontend")
    }
    setActiveContact(prev => prev ? { ...prev, status: 'human' } : null)
    setContacts(prev => prev.map(c => c.phone_number === activeContact.phone_number ? { ...c, status: 'human' } : c))
  }

  const handleReactivateAI = async () => {
    if (!activeContact) return
    try {
      await fetch(`${apiBaseUrl}/contacts/${activeContact.instance}/${activeContact.phone_number}/reactivate`, { method: 'POST' })
    } catch (e) {
      console.warn("IA Reativada no modo Mock frontend")
    }
    setActiveContact(prev => prev ? { ...prev, status: 'ai' } : null)
    setContacts(prev => prev.map(c => c.phone_number === activeContact.phone_number ? { ...c, status: 'ai' } : c))
  }

  const handleAcceptCall = async (contact: Contact) => {
    try {
      await fetch(`${apiBaseUrl}/contacts/${contact.instance}/${contact.phone_number}/accept`, { method: 'POST' })
    } catch (e) {
      console.warn("Chamado aceito no modo Mock frontend")
    }
    setActiveContact({ ...contact, status: 'human' })
    setContacts(prev => prev.map(c => c.phone_number === contact.phone_number ? { ...c, status: 'human' } : c))
    setActiveSubTab('chat')
  }

  const handleSavePrompt = async (instanceName: string) => {
    setSavingPrompt(true)
    try {
      await fetch(`${apiBaseUrl}/tenants/${instanceName}/prompt`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_prompt: editingPrompt[instanceName] })
      })
      alert("Prompt salvo com sucesso!")
    } catch (e) {
      alert("Prompt salvo com sucesso! (Modo Mock de Testes Frontend)")
    } finally {
      setSavingPrompt(false)
    }
  }

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${apiBaseUrl}/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTenant)
      })
      if (res.ok) {
        setNewTenant({ instance_name: '', name: '' })
        fetchTenants()
        alert("Instância/Clínica criada!")
        return
      }
    } catch (e) {
      console.warn("Criando tenant no modo Mock frontend")
    }
    const created: Tenant = { id: Date.now(), name: newTenant.name, instance_name: newTenant.instance_name }
    setTenants(prev => [...prev, created])
    setNewTenant({ instance_name: '', name: '' })
    alert("Instância/Clínica criada! (Modo Mock de Testes Frontend)")
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...newUser, tenant_id: newUser.tenant_id ? parseInt(newUser.tenant_id) : null }
      const res = await fetch(`${apiBaseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setNewUser({ username: '', password: '', name: '', role: 'attendant', tenant_id: '', whatsapp_number: '', specialty: '' })
        fetchUsers()
        alert("Usuário atendente criado!")
        return
      }
    } catch (e) {
      console.warn("Criando usuário no modo Mock frontend")
    }
    const created: UserAccount = {
      id: Date.now(),
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      whatsapp_number: newUser.whatsapp_number,
      specialty: newUser.specialty
    }
    setUsers(prev => [...prev, created])
    setNewUser({ username: '', password: '', name: '', role: 'attendant', tenant_id: '', whatsapp_number: '', specialty: '' })
    alert("Usuário atendente criado! (Modo Mock de Testes Frontend)")
  }

  const filteredContacts = contacts.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone_number.includes(searchTerm)
  )

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
              <h3 className="text-lg font-semibold text-zinc-100">Módulo WhatsApp CRM & Agentes</h3>
              {isMockMode && (
                <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md">
                  Modo Teste (Mock Frontend)
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">Atendimento multitenant, fila de espera e IA desacoplada</p>
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
            onClick={() => setActiveSubTab('agenda')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'agenda' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Agendamentos
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Prompts IA
          </button>
          <button
            onClick={() => setActiveSubTab('admin')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'admin' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Instâncias
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'chat' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[650px]">
          {/* Contacts Sidebar */}
          <div className="md:col-span-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
            <div className="p-3 border-b border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Contatos ({filteredContacts.length})</span>
                <button 
                  onClick={fetchContacts}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
                  title="Atualizar contatos"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingContacts ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-zinc-500" />
                <Input 
                  placeholder="Buscar contato ou número..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  {loadingContacts ? "Carregando contatos..." : "Nenhum contato encontrado no backend CRM."}
                </div>
              ) : (
                filteredContacts.map(contact => {
                  const isSelected = activeContact?.phone_number === contact.phone_number
                  return (
                    <div
                      key={contact.phone_number}
                      onClick={() => setActiveContact(contact)}
                      className={`p-3 cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                        isSelected ? 'bg-zinc-800/80 border-l-2 border-indigo-500' : 'hover:bg-zinc-800/40'
                      }`}
                    >
                      <div className="space-y-0.5 overflow-hidden">
                        <p className="text-sm font-medium text-zinc-200 truncate">{contact.name || 'Sem nome'}</p>
                        <p className="text-xs text-zinc-500 font-mono">{contact.phone_number}</p>
                        <p className="text-[10px] text-zinc-600">Instância: {contact.instance}</p>
                      </div>
                      <div>
                        {contact.status === 'ai' ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full flex items-center gap-1">
                            <Bot className="w-3 h-3" /> IA
                          </span>
                        ) : contact.status === 'human' ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800 rounded-full flex items-center gap-1">
                            <UserIcon className="w-3 h-3" /> Humano
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-800 rounded-full flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-3 h-3" /> Fila
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Active Chat Windows */}
          <div className="md:col-span-8 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
            {activeContact ? (
              <>
                {/* Chat Header */}
                <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-sm">
                      {(activeContact.name || activeContact.phone_number)[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-100">{activeContact.name || 'Contato'}</h4>
                      <p className="text-xs text-zinc-400 font-mono">{activeContact.phone_number} • {activeContact.instance}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeContact.status === 'human' ? (
                      <Button
                        size="sm"
                        onClick={handleReactivateAI}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Reativar IA
                      </Button>
                    ) : activeContact.status === 'waiting_human' ? (
                      <Button
                        size="sm"
                        onClick={() => handleAcceptCall(activeContact)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 h-8 animate-bounce"
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> Assumir Atendimento
                      </Button>
                    ) : (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800">
                        <Bot className="w-3.5 h-3.5" /> IA Ativa Respondendo
                      </span>
                    )}
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-950/40">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full text-zinc-500 gap-2 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin" /> Carregando mensagens...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
                      Nenhuma mensagem trocada com este contato ainda.
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isUser = msg.role === 'user'
                      return (
                        <div
                          key={msg.id || i}
                          className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                        >
                          <div
                            className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                              isUser
                                ? 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-700/50'
                                : 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-zinc-500 mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send Input */}
                <form onSubmit={handleSendMessage} className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2">
                  <Input
                    placeholder="Digite a mensagem..."
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    className="flex-1 bg-zinc-950 border-zinc-800 text-xs text-zinc-100 focus-visible:ring-indigo-500"
                  />
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2">
                <MessageSquare className="w-10 h-10 stroke-1 text-zinc-600" />
                <p className="text-sm">Selecione um contato ao lado para iniciar a conversa.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Queue Subtab */}
      {activeSubTab === 'queue' && (
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> Fila de Atendimento Humano Pendente
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Contatos que solicitaram transição de conversa do bot para um atendente humano.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingContacts.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                Nenhum chamado pendente na fila no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingContacts.map(contact => (
                  <div key={contact.phone_number} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-zinc-200">{contact.name || 'Desconhecido'}</h4>
                      <p className="text-xs text-zinc-400 font-mono">{contact.phone_number}</p>
                      <p className="text-[11px] text-zinc-500">Instância: {contact.instance}</p>
                    </div>
                    <Button
                      onClick={() => handleAcceptCall(contact)}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
                    >
                      Assumir Chamado
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agenda Subtab */}
      {activeSubTab === 'agenda' && (
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" /> Agendamentos Marcados
              </CardTitle>
              <CardDescription className="text-zinc-400">Consultas e horários agendados pela IA ou atendente.</CardDescription>
            </div>
            <Button size="sm" onClick={fetchAppointments} variant="outline" className="border-zinc-800 text-zinc-300">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                Nenhum agendamento encontrado.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {appointments.map(app => (
                  <div key={app.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{app.patient_name}</p>
                      <p className="text-xs text-zinc-400 font-mono">{app.patient_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-indigo-400">{new Date(app.date).toLocaleString()}</p>
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded">
                        {app.status || 'Confirmado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prompts Settings Subtab */}
      {activeSubTab === 'settings' && (
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" /> Prompts do Sistema por Instância
            </CardTitle>
            <CardDescription className="text-zinc-400">Defina o comportamento e diretrizes dos agentes de IA em cada clínica.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {tenants.map(t => (
              <div key={t.instance_name} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-400" /> {t.name} ({t.instance_name})
                  </h4>
                </div>
                <textarea
                  rows={5}
                  value={editingPrompt[t.instance_name] || ''}
                  onChange={e => setEditingPrompt(prev => ({ ...prev, [t.instance_name]: e.target.value }))}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded-lg font-mono"
                  placeholder="Instruções para o modelo de IA..."
                />
                <Button
                  onClick={() => handleSavePrompt(t.instance_name)}
                  disabled={savingPrompt}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  {savingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Prompt da Instância"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Admin Instances & Users Subtab */}
      {activeSubTab === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Tenant Card */}
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2 text-base">
                <Building className="w-4 h-4 text-indigo-500" /> Criar Nova Instância (Tenant)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTenant} className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-400">Nome da Instância / Clínica</label>
                  <Input
                    placeholder="Ex: Clínica Odonto Sp"
                    value={newTenant.name}
                    onChange={e => setNewTenant(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">ID da Instância (Evolution API)</label>
                  <Input
                    placeholder="Ex: clinica_odonto"
                    value={newTenant.instance_name}
                    onChange={e => setNewTenant(prev => ({ ...prev, instance_name: e.target.value }))}
                    className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 mt-1"
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Cadastrar Instância
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Create User Card */}
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2 text-base">
                <UserPlus className="w-4 h-4 text-indigo-500" /> Criar Novo Atendente / Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-zinc-400">Username</label>
                    <Input
                      placeholder="atendente01"
                      value={newUser.username}
                      onChange={e => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                      className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">Senha</label>
                    <Input
                      type="password"
                      placeholder="******"
                      value={newUser.password}
                      onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Nome Completo</label>
                  <Input
                    placeholder="Maria Silva"
                    value={newUser.name}
                    onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 mt-1"
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs mt-2">
                  <UserPlus className="w-4 h-4 mr-1" /> Cadastrar Atendente
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
