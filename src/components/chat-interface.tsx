"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
// Updated imports for LLM icons
import { Gemini, Claude, DeepSeek, Meta } from '@lobehub/icons';
import Image from 'next/image'

const ModalModelIcon = ({ id }: { id: string }) => {
  const title = MODEL_DESCRIPTIONS['pt-BR'][id]?.title || '';
  const isGemini = id.includes('gemini') || title.includes('Gêmeo') || title.includes('Gemini');

  if (id === 'screen-ai-1.2') {
    return (
      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.25)] shrink-0">
        <Image src="/screenai-logo.png" alt="ScreenAI" width={18} height={18} className="w-5 h-5 object-contain" />
      </div>
    );
  }
  if (id.startsWith('openai/')) {
    return (
      <div className="w-9 h-9 rounded-xl bg-[#10a37f] flex items-center justify-center shadow-[0_0_12px_rgba(16,163,127,0.25)] shrink-0">
        <Image src="/chatgpt-logo.png" alt="GPT" width={18} height={18} className="w-5 h-5 object-contain" />
      </div>
    );
  }
  if (id.startsWith('anthropic/')) {
    return (
      <div className="w-9 h-9 rounded-xl bg-[#fbf0df] flex items-center justify-center shadow-[0_0_12px_rgba(247,230,205,0.15)] shrink-0">
        <Claude.Color size={24} />
      </div>
    );
  }
  // Grok / xAI logo
  if (id.startsWith('x-ai/') || id.includes('grok')) {
    return (
      <div className="w-9 h-9 rounded-xl bg-[#0f1724] flex items-center justify-center shadow-[0_0_12px_rgba(0,0,0,0.25)] shrink-0">
        <Image src="/grok-color.svg" alt="Grok" width={24} height={24} className="w-6 h-6 object-contain" />
      </div>
    );
  }
  if (isGemini) {
    return (
      <div className="w-9 h-9 rounded-xl bg-[#f0f4f9] flex items-center justify-center shadow-[0_0_12px_rgba(240,244,249,0.15)] shrink-0">
        <Gemini.Color size={24} />
      </div>
    );
  }
  if (id.includes('deepseek')) {
    return (
      <div className="w-9 h-9 rounded-xl bg-[#f4f6ff] flex items-center justify-center shadow-[0_0_12px_rgba(24,83,242,0.15)] shrink-0">
        <DeepSeek.Color size={24} />
      </div>
    );
  }
  if (id.includes('llama')) {
    return (
      <div className="w-9 h-9 rounded-xl bg-[#ecf3fe] flex items-center justify-center shadow-[0_0_12px_rgba(0,100,224,0.15)] shrink-0">
        <Meta.Color size={24} />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
      <Sparkles className="w-5 h-5 text-zinc-400" />
    </div>
  );
};
import { useI18n } from '@/context/i18n-context'
import { useWebsocket } from '@/hooks/use-websocket'
import { useGeminiVoice } from '@/hooks/use-gemini-voice'
import { useScreenShare, captureScreenFrame } from '@/hooks/use-screen-share'
import { useAuth } from '@/hooks/use-auth'
import { useConversations } from '@/hooks/use-conversations'
import { config } from '@/lib/config'
import { LoginPromptDialog } from '@/components/login-prompt-dialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Mic, Navigation, Plus, FileUp, X, AudioLines, Pencil, Square, ChevronRight, Check, Sparkles, Image as ImageIcon, Video, Copy, Download } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useGeminiLive } from '@/hooks/use-gemini-live'
import { UpgradePlanDialog } from '@/components/upgrade-plan-dialog'
import { UpsellChatCard } from '@/components/upsell-chat-card'
import { GeminiLiveOrb } from '@/components/gemini-live-orb'
import { useChatStore, AI_MODELS } from '@/hooks/use-chat-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const AgentIconSvg = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="7" r="4.5" />
    <path d="M3 21a8 8 0 0 1 8-8" />
    <path d="M14 16h7" />
    <path d="M17 13l-3 3 3 3" />
    <path d="M14 20h7" />
    <path d="M18 17l3 3-3 3" />
  </svg>
);

const CopyIconSvg = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 111.07 122.88" className={className} fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M97.67,20.81L97.67,20.81l0.01,0.02c3.7,0.01,7.04,1.51,9.46,3.93c2.4,2.41,3.9,5.74,3.9,9.42h0.02v0.02v75.28 v0.01h-0.02c-0.01,3.68-1.51,7.03-3.93,9.46c-2.41,2.4-5.74,3.9-9.42,3.9v0.02h-0.02H38.48h-0.01v-0.02 c-3.69-0.01-7.04-1.5-9.46-3.93c-2.4-2.41-3.9-5.74-3.91-9.42H25.1c0-25.96,0-49.34,0-75.3v-0.01h0.02 c0.01-3.69,1.52-7.04,3.94-9.46c2.41-2.4,5.73-3.9,9.42-3.91v-0.02h0.02C58.22,20.81,77.95,20.81,97.67,20.81L97.67,20.81z M0.02,75.38L0,13.39v-0.01h0.02c0.01-3.69,1.52-7.04,3.93-9.46c2.41-2.4,5.74-3.9,9.42-3.91V0h0.02h59.19 c7.69,0,8.9,9.96,0.01,10.16H13.4h-0.02v-0.02c-0.88,0-1.68,0.37-2.27,0.97c-0.59,0.58-0.96,1.4-0.96,2.27h0.02v0.01v3.17 c0,19.61,0,39.21,0,58.81C10.17,83.63,0.02,84.09,0.02,75.38L0.02,75.38z M100.91,109.49V34.2v-0.02h0.02 c0-0.87-0.37-1.68-0.97-2.27c-0.59-0.58-1.4-0.96-2.28-0.96v0.02h-0.01H38.48h-0.02v-0.02c-0.88,0-1.68,0.38-2.27,0.97 c-0.59,0.58-0.96,1.4-0.96,2.27h0.02v0.01v75.28v0.02h-0.02c0,0.88,0.38,1.68,0.97,2.27c0.59,0.59,1.4,0.96,2.27,0.96v-0.02h0.01 h59.19h0.02v0.02c0.87,0,1.68-0.38,2.27-0.97c0.59-0.58,0.96-1.4,0.96-2.27L100.91,109.49L100.91,109.49L100.91,109.49 L100.91,109.49z" />
  </svg>
);

import { Language } from '@/locales'

type AppLanguage = 'pt-BR' | 'en-US'
type LocalizedText = Record<AppLanguage, string>
type LocalizedAgent = { id: string; label: LocalizedText; description: LocalizedText }

const AGENT_DEFINITIONS: LocalizedAgent[] = [
  { id: '', label: { 'pt-BR': 'Assistente Geral', 'en-US': 'General Assistant' }, description: { 'pt-BR': 'Responde de forma geral e acessível sobre qualquer assunto.', 'en-US': 'Answers general questions clearly and accessibly.' } },
  { id: 'agent_programming', label: { 'pt-BR': 'Programador Sênior', 'en-US': 'Senior Programmer' }, description: { 'pt-BR': 'Escreve, depura e explica códigos em várias linguagens.', 'en-US': 'Writes, debugs, and explains code across multiple languages.' } },
  { id: 'agent_contract_analyst', label: { 'pt-BR': 'Analista de Contratos', 'en-US': 'Contract Analyst' }, description: { 'pt-BR': 'Analisa e resume contratos e termos jurídicos.', 'en-US': 'Analyzes and summarizes contracts and legal terms.' } },
  { id: 'agent_web_researcher', label: { 'pt-BR': 'Pesquisa Web', 'en-US': 'Web Researcher' }, description: { 'pt-BR': 'Investiga tópicos complexos e faz resumos estruturados.', 'en-US': 'Researches complex topics and creates structured summaries.' } },
  { id: 'agent_learning_tutor', label: { 'pt-BR': 'Tutor de Estudos', 'en-US': 'Study Tutor' }, description: { 'pt-BR': 'Explica conceitos difíceis de forma simples e didática.', 'en-US': 'Explains difficult concepts in a simple, practical way.' } },
  { id: 'agent_writing_consultant', label: { 'pt-BR': 'Consultor de Escrita', 'en-US': 'Writing Consultant' }, description: { 'pt-BR': 'Reescreve, corrige e refina textos e artigos.', 'en-US': 'Rewrites, edits, and refines texts and articles.' } },
  { id: 'agent_business_strategy_consultant', label: { 'pt-BR': 'Consultor Estratégico', 'en-US': 'Strategy Consultant' }, description: { 'pt-BR': 'Desenvolve ideias de negócio e estratégias corporativas.', 'en-US': 'Develops business ideas and corporate strategies.' } },
  { id: 'agent_critical_thinking_consultant', label: { 'pt-BR': 'Pensamento Crítico', 'en-US': 'Critical Thinking' }, description: { 'pt-BR': 'Avalia argumentos e identifica falácias ou melhorias.', 'en-US': 'Evaluates arguments and identifies fallacies or improvements.' } },
  { id: 'agent_decision_facilitator', label: { 'pt-BR': 'Facilitador de Decisão', 'en-US': 'Decision Facilitator' }, description: { 'pt-BR': 'Ajuda a estruturar escolhas complexas de forma racional.', 'en-US': 'Helps structure complex choices rationally.' } },
  { id: 'agent_feedback_analyst', label: { 'pt-BR': 'Analista de Feedback', 'en-US': 'Feedback Analyst' }, description: { 'pt-BR': 'Analisa retornos de usuários e clientes para insights acionáveis.', 'en-US': 'Analyzes user and customer feedback for actionable insights.' } },
  { id: 'agent_interview_coach', label: { 'pt-BR': 'Treinador de Entrevista', 'en-US': 'Interview Coach' }, description: { 'pt-BR': 'Simula entrevistas e prepara respostas de alto impacto.', 'en-US': 'Simulates interviews and prepares high-impact answers.' } },
  { id: 'agent_meeting_coordinator', label: { 'pt-BR': 'Organizador de Reunião', 'en-US': 'Meeting Coordinator' }, description: { 'pt-BR': 'Estrutura pautas, ata de reunião e planos de ação.', 'en-US': 'Structures agendas, meeting notes, and action plans.' } },
  { id: 'agent_metaphor_specialist', label: { 'pt-BR': 'Especialista em Metáforas', 'en-US': 'Metaphor Specialist' }, description: { 'pt-BR': 'Explica conceitos abstratos usando analogias criativas.', 'en-US': 'Explains abstract concepts with creative analogies.' } },
  { id: 'agent_process_designer', label: { 'pt-BR': 'Designer de Processos', 'en-US': 'Process Designer' }, description: { 'pt-BR': 'Modelagem de fluxos de trabalho e otimização operacional.', 'en-US': 'Models workflows and improves operations.' } },
  { id: 'agent_product_objection_analyst', label: { 'pt-BR': 'Analista de Objeções', 'en-US': 'Objection Analyst' }, description: { 'pt-BR': 'Mapeia e contorna resistências de clientes e vendas.', 'en-US': 'Maps and handles customer and sales objections.' } },
  { id: 'agent_technical_translator', label: { 'pt-BR': 'Tradutor Técnico', 'en-US': 'Technical Translator' }, description: { 'pt-BR': 'Traduz documentos preservando a terminologia técnica precisa.', 'en-US': 'Translates documents while preserving precise technical terminology.' } }
]

const getAgents = (language: AppLanguage) =>
  AGENT_DEFINITIONS.map(agent => ({
    id: agent.id,
    label: agent.label[language],
    description: agent.description[language]
  }))

interface DialogModeSwitchProps {
  active: 'models' | 'agents'
  language: Language
  onOpenModels: () => void
  onOpenAgents: () => void
}

const DialogModeSwitch = ({ active, language, onOpenModels, onOpenAgents }: DialogModeSwitchProps) => (
  <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-zinc-800/80 bg-zinc-900/60 p-1 text-xs font-bold text-zinc-400 shadow-md">
    <button
      type="button"
      onClick={onOpenModels}
      aria-pressed={active === 'models'}
      className={`flex h-7 items-center gap-2 rounded-full px-3 transition-colors sm:px-4 ${active === 'models'
        ? 'bg-zinc-100 text-zinc-950 shadow-sm'
        : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100'
        }`}
    >
      <Image src="/chatgpt-logo.png" alt="" width={13} height={13} className={`shrink-0 ${active === 'models' ? 'opacity-80 invert' : 'opacity-70'}`} />
      <span>{language === 'pt-BR' ? 'MODELOS' : 'MODELS'}</span>
    </button>
    <button
      type="button"
      onClick={onOpenAgents}
      aria-pressed={active === 'agents'}
      className={`flex h-7 items-center gap-2 rounded-full px-3 transition-colors sm:px-4 ${active === 'agents'
        ? 'bg-zinc-100 text-zinc-950 shadow-sm'
        : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100'
        }`}
    >
      <AgentIconSvg className="h-3.5 w-3.5 shrink-0" />
      <span>{language === 'pt-BR' ? 'AGENTES' : 'AGENTS'}</span>
    </button>
  </div>
)

// Premium descriptions lookup table to match mockups exactly
const MODEL_DESCRIPTIONS: Record<AppLanguage, Record<string, { title: string; desc: string }>> = {
  'pt-BR': {
    'screen-ai-1.2': { title: 'ScreenAI 1.2', desc: 'Velocidade cotidiana e ótimo para tarefas do dia a dia.' },
    'openrouter/deepseek/deepseek-chat': { title: 'DeepSeek V3', desc: 'Desempenho ágil com excelente custo-benefício.' },
    'openrouter/deepseek/deepseek-r1': { title: 'DeepSeek R1 (Raciocínio)', desc: 'Raciocínio lógico, matemática e programação.' },
    'openrouter/deepseek/deepseek-4.0-flash': { title: 'DeepSeek 4.0 Flash', desc: 'Resposta rápida para cargas de trabalho maiores.' },
    'openrouter/deepseek/deepseek-4.0-pro': { title: 'DeepSeek 4.0 Pro', desc: 'Performance alta para tarefas que exigem precisão.' },
    'openai/gpt-4o': { title: 'GPT-4 Omni', desc: 'Versatilidade e alta complexidade em tarefas complexas.' },
    'openai/gpt-4o-mini': { title: 'GPT-4o Mini', desc: 'Respostas rápidas, leve e super inteligente.' },
    'openai/gpt-oss': { title: 'GPT OSS', desc: 'Modelo Open Source da OpenAI para uso geral.' },
    'openai/gpt-5-mini': { title: 'GPT-5 Mini', desc: 'Excelente para tarefas rápidas com resultados avançados.' },
    'openai/gpt-5.1': { title: 'GPT-5.1', desc: 'Alta performance em geração de texto e raciocínio.' },
    'openai/gpt-5.2-thinking': { title: 'GPT-5.2 Thinking', desc: 'Modelo focado em raciocínio profundo e criatividade.' },
    'openai/gpt-5.3-codex': { title: 'GPT-5.3 Codex', desc: 'Especializado em geração de código e tarefas técnicas.' },
    'openai/o4-mini': { title: 'o4 Mini', desc: 'Modelo leve para tarefas práticas e rápidas.' },
    'gemini/gemini-2.5-pro': { title: 'Gemini 2.5 Pro', desc: 'Processamento inteligente para prompts multimodais.' },
    'gemini/gemini-2.5-flash': { title: 'Gemini 2.5 Flash', desc: 'Rápido e eficiente para uso diário.' },
    'google/gemini-3.1-flash': { title: 'Gemini 3.1 Flash', desc: 'Resposta rápida com suporte avançado de contexto.' },
    'google/gemini-3.1-pro': { title: 'Gemini 3.1 Pro', desc: 'Alta qualidade e compreensão ampliada.' },
    'x-ai/grok-3': { title: 'Grok 3', desc: 'Modelo generalista rápido para alta produtividade.' },
    'x-ai/grok-4': { title: 'Grok 4', desc: 'Mais preciso e com melhores respostas contextuais.' },
    'x-ai/grok-4-fast': { title: 'Grok 4 Fast', desc: 'Versão otimizada para latência baixa.' },
    'openrouter/meta-llama/llama-3.3-70b-instruct': { title: 'Llama-3 70B R', desc: 'Análise complexa, robusta e open-source.' }
  },
  'en-US': {
    'screen-ai-1.2': { title: 'ScreenAI 1.2', desc: 'Everyday speed, great for daily tasks.' },
    'openrouter/deepseek/deepseek-chat': { title: 'DeepSeek V3', desc: 'Fast performance with excellent cost efficiency.' },
    'openrouter/deepseek/deepseek-r1': { title: 'DeepSeek R1 (Reasoning)', desc: 'Logical reasoning, math, and programming.' },
    'openrouter/deepseek/deepseek-4.0-flash': { title: 'DeepSeek 4.0 Flash', desc: 'Fast responses for larger workloads.' },
    'openrouter/deepseek/deepseek-4.0-pro': { title: 'DeepSeek 4.0 Pro', desc: 'High performance for precision-heavy tasks.' },
    'openai/gpt-4o': { title: 'GPT-4 Omni', desc: 'Versatile model for complex tasks.' },
    'openai/gpt-4o-mini': { title: 'GPT-4o Mini', desc: 'Fast, lightweight, and highly capable responses.' },
    'openai/gpt-oss': { title: 'GPT OSS', desc: 'OpenAI open-source model for general use.' },
    'openai/gpt-5-mini': { title: 'GPT-5 Mini', desc: 'Excellent for fast tasks with advanced results.' },
    'openai/gpt-5.1': { title: 'GPT-5.1', desc: 'High performance for text generation and reasoning.' },
    'openai/gpt-5.2-thinking': { title: 'GPT-5.2 Thinking', desc: 'Focused on deep reasoning and creativity.' },
    'openai/gpt-5.3-codex': { title: 'GPT-5.3 Codex', desc: 'Specialized in code generation and technical tasks.' },
    'openai/o4-mini': { title: 'o4 Mini', desc: 'Lightweight model for practical, fast tasks.' },
    'gemini/gemini-2.5-pro': { title: 'Gemini 2.5 Pro', desc: 'Smart processing for multimodal prompts.' },
    'gemini/gemini-2.5-flash': { title: 'Gemini 2.5 Flash', desc: 'Fast and efficient for daily use.' },
    'google/gemini-3.1-flash': { title: 'Gemini 3.1 Flash', desc: 'Fast responses with advanced context support.' },
    'google/gemini-3.1-pro': { title: 'Gemini 3.1 Pro', desc: 'High quality with expanded understanding.' },
    'x-ai/grok-3': { title: 'Grok 3', desc: 'Fast generalist model for high productivity.' },
    'x-ai/grok-4': { title: 'Grok 4', desc: 'More precise, with stronger contextual answers.' },
    'x-ai/grok-4-fast': { title: 'Grok 4 Fast', desc: 'Optimized for low latency.' },
    'openrouter/meta-llama/llama-3.3-70b-instruct': { title: 'Llama-3 70B R', desc: 'Complex, robust, open-source analysis.' }
  }
}

// Gorgeous mini logos mapping for the input bar selector
const InputModelIcon = ({ id }: { id: string }) => {
  const title = MODEL_DESCRIPTIONS['pt-BR'][id]?.title || '';
  const isGemini = id.includes('gemini') || title.includes('Gêmeo') || title.includes('Gemini');

  if (id === 'screen-ai-1.2') {
    return (
      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shrink-0">
        <Image src="/screenai-logo.png" alt="ScreenAI" width={10} height={10} className="w-2.5 h-2.5 object-contain" />
      </div>
    )
  }
  if (id.startsWith('openai/')) {
    return (
      <div className="w-5 h-5 rounded-full bg-[#10a37f] flex items-center justify-center shrink-0">
        <Image src="/chatgpt-logo.png" alt="GPT" width={10} height={10} className="w-2.5 h-2.5 object-contain" />
      </div>
    )
  }
  if (id.startsWith('anthropic/')) {
    return (
      <div className="w-5 h-5 rounded-full bg-[#fbf0df] flex items-center justify-center shrink-0">
        <Claude.Color size={14} />
      </div>
    )
  }
  // Grok / xAI small icon
  if (id.startsWith('x-ai/') || id.includes('grok')) {
    return (
      <div className="w-5 h-5 rounded-full bg-[#0f1724] flex items-center justify-center shrink-0">
        <Image src="/grok-color.svg" alt="Grok" width={14} height={14} className="w-3.5 h-3.5 object-contain" />
      </div>
    )
  }
  if (isGemini) {
    return (
      <div className="w-5 h-5 rounded-full bg-[#f0f4f9] flex items-center justify-center shrink-0 overflow-hidden">
        <Gemini.Color size={14} />
      </div>
    )
  }
  if (id.includes('deepseek')) {
    return (
      <div className="w-5 h-5 rounded-full bg-[#f4f6ff] flex items-center justify-center shrink-0 overflow-hidden">
        <DeepSeek.Color size={14} />
      </div>
    )
  }
  if (id.includes('llama')) {
    return (
      <div className="w-5 h-5 rounded-full bg-[#ecf3fe] flex items-center justify-center shrink-0 overflow-hidden">
        <Meta.Color size={14} />
      </div>
    )
  }
  return (
    <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
      <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
    </div>
  )
}

const normalizeModelId = (id: string | undefined): string => {
  if (!id) return 'screen-ai-1.2';

  // Find exact match first
  if (AI_MODELS.some(m => m.id === id)) return id;

  // The backend uses OpenRouter, which prefixes models with 'openrouter/'
  const strippedId = id.replace(/^openrouter\//, '');
  if (AI_MODELS.some(m => m.id === strippedId)) return strippedId;

  // Try to find a model ID that ends with the given id (e.g. 'o4-mini' -> 'openai/o4-mini')
  const exactSuffixMatch = AI_MODELS.find(m => m.id.endsWith('/' + id) || m.id.endsWith('/' + strippedId));
  if (exactSuffixMatch) return exactSuffixMatch.id;

  // Try to find if the given id ends with a known model ID
  const idEndsWithMatch = AI_MODELS.find(m => id.endsWith(m.id) || strippedId.endsWith(m.id));
  if (idEndsWithMatch) return idEndsWithMatch.id;

  if (id.includes('gpt-4o-mini')) return 'openai/gpt-4o-mini';
  if (id.includes('gpt-4o')) return 'openai/gpt-4o';
  if (id.includes('claude-3.5-sonnet') || id.includes('claude-3-5-sonnet')) return 'anthropic/claude-3-5-sonnet-20241022';
  if (id.includes('gemini-2.5-pro')) return 'gemini/gemini-2.5-pro';
  if (id.includes('gemini-2.5-flash')) return 'gemini/gemini-2.5-flash';
  if (id.includes('deepseek-chat') || id.includes('deepseek/deepseek-chat')) return 'openrouter/deepseek/deepseek-chat';
  if (id.includes('deepseek-r1') || id.includes('deepseek/deepseek-r1')) return 'openrouter/deepseek/deepseek-r1';
  if (id.includes('llama-3.3-70b-instruct') || id.includes('llama-3.3-70b')) return 'openrouter/meta-llama/llama-3.3-70b-instruct';

  // Fallback if partial include works
  const partialMatch = AI_MODELS.find(m => m.id.includes(id) || id.includes(m.id));
  if (partialMatch) return partialMatch.id;

  return id;
};

export function ChatInterface() {
  const { t, language } = useI18n()
  const appLang: AppLanguage = (language === 'pt-BR' || language === 'en-US') ? language : 'en-US'
  const agents = getAgents(appLang)
  const modelDescriptions = MODEL_DESCRIPTIONS[appLang]
  const [inputValue, setInputValue] = useState('')
  const [mediaMode, setMediaMode] = useState<'text' | 'image' | 'video'>('text')
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isModelsDialogOpen, setIsModelsDialogOpen] = useState(false)

  // Nota: inlineUpsell e setInlineUpsell vêm do useChatStore (abaixo)
  // para que o WebSocket também possa disparar o upsell inline

  const [isAgentsDialogOpen, setIsAgentsDialogOpen] = useState(false)
  const [showCreditsTooltip, setShowCreditsTooltip] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null) // Referência para a caixa de texto expansível
  const creditsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (creditsRef.current && !creditsRef.current.contains(event.target as Node)) {
        setShowCreditsTooltip(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Estados para Edição de Mensagem
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  // Estado para o Lightbox da Imagem Gerada
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [isGeneratingMedia, setIsGeneratingMedia] = useState<'image' | 'video' | null>(null)

  // Frases de Loading dinâmicas
  const loadingPhrases = language === 'pt-BR' ? [
    "A entender o prompt...",
    "A analisar o contexto...",
    "A processar informações...",
    "A gerar resposta...",
    "Quase pronto..."
  ] : [
    "Understanding the prompt...",
    "Analyzing context...",
    "Processing information...",
    "Generating response...",
    "Almost ready..."
  ]
  const [phraseIndex, setPhraseIndex] = useState(0)

  const { messages, sendMessage, isStreaming, sendCancel } = useWebsocket()
  const { credits, addMessage, setIsStreaming, setCredits, floatingState, pipWindow, fetchCredits, isUpgradeDialogOpen, setIsUpgradeDialogOpen, upgradeDialogMessage, setUpgradeDialogMessage, userPlan, selectedModel, setSelectedModel, selectedAgentId, setSelectedAgentId, inlineUpsell, setInlineUpsell } = useChatStore()
  const { hasHydrated, isLoggedIn, syncFromStorage } = useAuth()

  const handleModelSelect = (modelId: string) => {
    const model = AI_MODELS.find(m => m.id === modelId)
    if (!model) return
    const isFreeUser = !userPlan || userPlan.toLowerCase() === 'free'
    if (model.requiresPro && isFreeUser) {
      setUpgradeDialogMessage(t('app.model_upgrade_message').replace('{model}', model.label))
      setIsUpgradeDialogOpen(true)
      return
    }
    console.log('%c[MODEL SELECT] ✅ Usuário selecionou modelo:', 'color: #a78bfa; font-weight: bold', modelId)
    console.log('%c[MODEL SELECT] Label:', 'color: #a78bfa', model.label, '| Provider:', model.provider)
    setSelectedModel(modelId)
    console.log('%c[MODEL SELECT] store.selectedModel após setSelectedModel:', 'color: #a78bfa', modelId)
  }

  useEffect(() => {
    syncFromStorage()
  }, [syncFromStorage])

  useEffect(() => {
    if (isLoggedIn) {
      fetchCredits()
    }
  }, [isLoggedIn])

  // Efeito para ciclar as frases de loading a cada 2.5s enquanto carrega
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length)
      }, 2500)
      return () => clearInterval(interval)
    }

    const timer = setTimeout(() => {
      setPhraseIndex(0) // Reseta quando terminar
    }, 0)
    return () => clearTimeout(timer)
  }, [isStreaming])

  const { isRecording: isVoiceActive, startRecording, stopRecording, recognitionSupported } = useGeminiVoice(5, 1500, {
    onTranscript: (text) => {
      setInputValue(text)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
      }
    },
    onStop: () => {
      // mantém o fluxo de envio manual; o texto continua no prompt até o usuário enviar
    }
  })

  const {
    isActive: isGeminiLiveActive,
    isConnected: isGeminiLiveConnected,
    phase: geminiLivePhase,
    audioLevel: geminiLiveAudioLevel,
    startSession: startGeminiLive,
    stopSession: stopGeminiLive
  } = useGeminiLive()

  const toggleGeminiLive = useCallback(() => {
    if (isGeminiLiveActive) {
      stopGeminiLive()
    } else {
      startGeminiLive()
    }
  }, [isGeminiLiveActive, startGeminiLive, stopGeminiLive])

  const { isSharing: isScreenShared, stopSharing, stream } = useScreenShare()

  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && stream && node.srcObject !== stream) {
      node.srcObject = stream
      node.play().catch(e => {
        if (e.name !== 'AbortError') console.error("Error playing video:", e)
      })
    }
  }, [stream])

  const scrollRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const isAtBottomRef = useRef(true)

  // Função para verificar se o usuário está próximo ao final do chat
  const checkIsAtBottom = useCallback(() => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    // Consideramos que está no final se o scroll está a menos de 150px do fundo
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 150
    isAtBottomRef.current = isAtBottom
  }, [])

  // Função para rolar até o final da conversa
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const scrollMax = container.scrollHeight + 2000

    container.scrollTo({
      top: scrollMax,
      behavior
    })

    // Executa uma segunda rolagem no próximo frame para garantir atualizações dinâmicas do DOM
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight + 2000,
          behavior
        })
      }
    })
  }, [])

  // Scroll automático durante streaming de mensagens (apenas se o usuário já estiver no final do chat)
  useEffect(() => {
    if (!scrollRef.current || messages.length === 0) return

    if (isStreaming && isAtBottomRef.current) {
      scrollToBottom('auto')
    }
  }, [messages, isStreaming, scrollToBottom])

  // Scroll automático para novas mensagens enviadas pelo próprio usuário
  useEffect(() => {
    if (messages.length === 0) return
    const lastMessage = messages[messages.length - 1]

    if (lastMessage?.role === 'user') {
      isAtBottomRef.current = true
      scrollToBottom('smooth')
    }
  }, [messages.length, scrollToBottom])

  const setMessageRef = useCallback((key: string, node: HTMLDivElement | null) => {
    if (node) {
      messageRefs.current.set(key, node)
    } else {
      messageRefs.current.delete(key)
    }
  }, [])

  const requireAuth = (action: () => void) => {
    if (!hasHydrated) {
      syncFromStorage()
    }

    if (useAuth.getState().isLoggedIn) {
      action()
    } else {
      setShowLoginPrompt(true)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSend = async (overrideText?: string) => {
    requireAuth(async () => {

      let audioBase64 = undefined
      if (isVoiceActive) {
        audioBase64 = await stopRecording()
      }

      const textToSend = typeof overrideText === 'string' ? overrideText : inputValue.trim()

      if (!textToSend && !isScreenShared && !audioBase64 && !selectedFile) return

      // Limpa a caixa de texto e reseta a altura para o tamanho original
      setInputValue('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      // Descarta o card de upsell ao enviar nova mensagem
      setInlineUpsell(null)

      if (mediaMode !== 'text') {
        const token = localStorage.getItem('access_token') || ''

        addMessage({
          id: Date.now().toString(),
          role: 'user',
          content: textToSend || (mediaMode === 'image' ? 'Gere uma imagem' : 'Gere um vídeo')
        })

        setIsGeneratingMedia(mediaMode)

        setIsStreaming(true)

        const { activeId, setActiveId, fetchConversations } = useConversations.getState()

        const formData = new FormData()
        formData.append('token', token)
        formData.append('prompt', textToSend || '')
        formData.append('media_type', mediaMode)
        if (activeId) formData.append('session_id', activeId)

        try {
          const res = await fetch(`${config.apiUrl}/api/studio/media/generate`, {
            method: 'POST',
            body: formData
          })
          const data = await res.json()

          setIsGeneratingMedia(null)
          setIsStreaming(false)

          if (data.status === 'success') {
            if (!activeId && data.session_id) {
              setActiveId(data.session_id)
              await fetchConversations()
            }
            addMessage({
              id: Date.now().toString(),
              role: 'assistant',
              content: `![Mídia Gerada](${data.url})`,
              model: 'screen-ai-1.2'
            })
          } else {
            if (data.detail && data.detail.includes('Saldo insuficiente')) {
              setUpgradeDialogMessage(data.detail)
              setIsUpgradeDialogOpen(true)
            } else {
              addMessage({
                id: Date.now().toString(),
                role: 'assistant',
                content: `Erro: ${data.detail || 'Falha na comunicação com o AI Studio.'}`
              })
            }
          }
        } catch (error) {
          setIsGeneratingMedia(null)
          setIsStreaming(false)
          console.error("Erro na geração de mídia:", error)
        }
      } else if (selectedFile) {
        const { activeId, setActiveId, fetchConversations } = useConversations.getState()
        const token = localStorage.getItem('access_token') || ''

        // Mensagem exibida no chat para o usuário
        const fileLabel = language === 'pt-BR'
          ? `📎 Arquivo anexado: **${selectedFile.name}**`
          : `📎 Attached file: **${selectedFile.name}**`
        const userDisplayMessage = textToSend
          ? `${textToSend}\n\n${fileLabel}`
          : fileLabel

        addMessage({
          id: Date.now().toString(),
          role: 'user',
          content: userDisplayMessage
        })

        setIsStreaming(true)
        const fileToSend = selectedFile
        setSelectedFile(null)

        // Texto enviado à IA: se o usuário não digitou nada, envia instrução padrão
        // para que o backend saiba que deve analisar o arquivo
        const textForApi = textToSend || (language === 'pt-BR'
          ? `Analise o arquivo "${fileToSend.name}" que estou enviando.`
          : `Please analyze the file "${fileToSend.name}" I'm sending.`)

        const formData = new FormData()
        formData.append('token', token)
        formData.append('text', textForApi)
        formData.append('file', fileToSend)
        if (activeId) formData.append('session_id', activeId)
        if (selectedModel) formData.append('model', selectedModel)
        if (selectedAgentId && selectedAgentId !== '') formData.append('agent_id', selectedAgentId)

        console.log('%c[CHAT][FILE UPLOAD] Enviando arquivo com modelo:', 'color: #f59e0b; font-weight: bold', selectedModel || '(não definido)')

        try {
          const res = await fetch(`${config.apiUrl}/api/chat/message`, {
            method: 'POST',
            body: formData
          })
          const data = await res.json()

          setIsStreaming(false)

          if (data.status === 'success') {
            if (!activeId && data.session_id) {
              setActiveId(data.session_id)
              await fetchConversations()
            }
            addMessage({
              id: Date.now().toString(),
              role: 'assistant',
              content: data.response,
              model: selectedModel === 'screen-ai-1.2' ? 'screen-ai-1.2' : data.model || selectedModel,
              agent_id: selectedAgentId
            })
            console.log('%c[CHAT][FILE UPLOAD] Resposta recebida do backend. Modelo usado pelo frontend:', 'color: #22c55e; font-weight: bold', selectedModel)
          } else if (data.status === 'error' && data.message && data.message.includes('Créditos insuficientes')) {
            setUpgradeDialogMessage(data.message)
            setIsUpgradeDialogOpen(true)
          }

          if (data.remaining_credits !== undefined) {
            setCredits(data.remaining_credits)
          }
          // Upsell inline: aparece como card no chat, não como popup
          if (data.upsell?.message) {
            setInlineUpsell({
              message: data.upsell.message,
              remainingCredits: data.upsell.remaining_credits ?? data.remaining_credits,
              threshold: data.upsell.threshold,
            })
          }
        } catch (error) {
          console.error('Erro ao enviar arquivo via REST:', error)
          setIsStreaming(false)
        }
      } else {
        const payload = {
          text: textToSend || undefined,
          image_base64: captureScreenFrame(),
          audio_base64: audioBase64
        }
        sendMessage(payload)
      }
    })
  }

  // ==========================================
  // LÓGICA BLINDADA DE LOADING (Evita "piscar" e sumir por causa do Markdown)
  // ==========================================
  const lastMessage = messages[messages.length - 1]

  const hasVisibleContent = (content: string) => {
    if (!content) return false;
    const clean = content.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '');
    return /[a-zA-Z0-9\u00C0-\u024F]/.test(clean);
  };

  const isWaitingForFirstChunk = isStreaming && (
    !lastMessage ||
    lastMessage.role === 'user' ||
    (lastMessage.role === 'assistant' && !hasVisibleContent(lastMessage.content))
  );
  const isEmptyChat = messages.length === 0 && !isStreaming;
  const emptyChatPrompt = language === 'pt-BR'
    ? 'O que está na sua mente hoje?'
    : "What's on your mind today?";

  const activeModelName = modelDescriptions[selectedModel]?.title || AI_MODELS.find(m => m.id === selectedModel)?.label || 'ScreenAI'
  const currentAgent = agents.find(a => a.id === selectedAgentId) || agents[0]
  const placeholderText = mediaMode === 'image'
    ? (language === 'pt-BR' ? 'Descreva a imagem que deseja gerar...' : 'Describe the image you want to generate...')
    : mediaMode === 'video'
      ? (language === 'pt-BR' ? 'Descreva o vídeo que deseja gerar...' : 'Describe the video you want to generate...')
      : (!isEmptyChat
        ? (language === 'pt-BR' ? `Mensagem para o ${activeModelName}` : `Message for ${activeModelName}`)
        : t('app.send_message'));
  const openModelsDialog = () => {
    setIsAgentsDialogOpen(false)
    setIsModelsDialogOpen(true)
  }
  const openAgentsDialog = () => {
    setIsModelsDialogOpen(false)
    setIsAgentsDialogOpen(true)
  }
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a]">
      <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />
      <UpgradePlanDialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen} message={upgradeDialogMessage} ctaLabel={language === 'pt-BR' ? 'Continuar com Pro' : 'Continue with Pro'} />

      <Dialog open={isModelsDialogOpen} onOpenChange={setIsModelsDialogOpen}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[960px] max-h-[90vh] overflow-hidden flex flex-col bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/80 text-zinc-100 p-4 md:p-6 rounded-2xl shadow-2xl focus:outline-none pointer-events-auto">
          <DialogHeader className="relative flex flex-col items-center justify-center pb-4 border-b border-zinc-900">
            <DialogModeSwitch active="models" language={language} onOpenModels={openModelsDialog} onOpenAgents={openAgentsDialog} />
          </DialogHeader>

          {/* Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 pt-4 md:pt-5 pb-2 overflow-y-auto md:overflow-visible pr-1 custom-scrollbar">
            {/* RÁPIDO Column */}
            <div className="flex flex-col min-w-0">
              <span className="text-zinc-500 tracking-wider text-[11px] font-bold uppercase mb-3 px-1">
                {language === 'pt-BR' ? 'RÁPIDO' : 'FAST'}
              </span>
              <div className="flex flex-col gap-2.5 max-h-none overflow-visible md:max-h-[360px] md:overflow-y-auto pr-0 md:pr-1 pointer-events-auto custom-scrollbar">
                {AI_MODELS.filter(m => ['screen-ai-1.2', 'openai/gpt-4o-mini', 'openai/o4-mini', 'openrouter/deepseek/deepseek-chat', 'x-ai/grok-4-fast'].includes(m.id)).map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      handleModelSelect(model.id)
                      setIsModelsDialogOpen(false)
                    }}
                    className={`w-full flex items-start gap-3.5 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer group pointer-events-auto ${selectedModel === model.id
                      ? 'border-zinc-700 bg-zinc-800/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_15px_rgba(99,102,241,0.08)]'
                      : 'border-transparent bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-800/60'
                      }`}
                  >
                    <ModalModelIcon id={model.id} />
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <span className="font-semibold text-[13px] text-zinc-100 group-hover:text-white leading-tight block truncate md:whitespace-normal">
                        {modelDescriptions[model.id]?.title || model.label}
                      </span>
                      <span className="text-[11px] text-zinc-500 group-hover:text-zinc-400 mt-1 leading-normal line-clamp-2">
                        {modelDescriptions[model.id]?.desc || model.description || ''}
                      </span>
                    </div>
                    {selectedModel === model.id && (
                      <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 self-center ml-auto shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                        <Check className="w-3 h-3 text-zinc-900 stroke-[3px]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* AVANÇADO Column */}
            <div className="flex flex-col min-w-0">
              <span className="text-zinc-500 tracking-wider text-[11px] font-bold uppercase mb-3 px-1">
                {language === 'pt-BR' ? 'AVANÇADO' : 'ADVANCED'}
              </span>
              <div className="flex flex-col gap-2.5 max-h-none overflow-visible md:max-h-[360px] md:overflow-y-auto pr-0 md:pr-1 pointer-events-auto custom-scrollbar">
                {AI_MODELS.filter(m => ['openai/gpt-4o', 'openai/gpt-5-mini', 'openai/gpt-5.1', 'openai/gpt-5.2-thinking', 'openai/gpt-5.3-codex', 'openai/gpt-oss', 'gemini/gemini-2.5-pro', 'gemini/gemini-2.5-flash', 'google/gemini-3.1-flash', 'google/gemini-3.1-pro', 'anthropic/claude-3-5-sonnet-20241022', 'anthropic/claude-4.5-haiku', 'anthropic/claude-4.6-sonnet', 'anthropic/claude-4.6-sonnet-thinking', 'x-ai/grok-3', 'x-ai/grok-4', 'x-ai/grok-4-fast'].includes(m.id)).map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      handleModelSelect(model.id)
                      setIsModelsDialogOpen(false)
                    }}
                    className={`w-full flex items-start gap-3.5 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer group pointer-events-auto ${selectedModel === model.id
                      ? 'border-zinc-700 bg-zinc-800/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_15px_rgba(99,102,241,0.08)]'
                      : 'border-transparent bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-800/60'
                      }`}
                  >
                    <ModalModelIcon id={model.id} />
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <span className="font-semibold text-[13px] text-zinc-100 group-hover:text-white leading-tight block truncate md:whitespace-normal">
                        {modelDescriptions[model.id]?.title || model.label}
                      </span>
                      <span className="text-[11px] text-zinc-500 group-hover:text-zinc-400 mt-1 leading-normal line-clamp-2">
                        {modelDescriptions[model.id]?.desc || model.description || ''}
                      </span>
                    </div>
                    {selectedModel === model.id && (
                      <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 self-center ml-auto shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                        <Check className="w-3 h-3 text-zinc-900 stroke-[3px]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* RACIOCÍNIO PROFUNDO Column */}
            <div className="flex flex-col min-w-0">
              <span className="text-zinc-500 tracking-wider text-[11px] font-bold uppercase mb-3 px-1">
                {language === 'pt-BR' ? 'RACIOCÍNIO PROFUNDO' : 'DEEP REASONING'}
              </span>
              <div className="flex flex-col gap-2.5 max-h-none overflow-visible md:max-h-[360px] md:overflow-y-auto pr-0 md:pr-1 pointer-events-auto custom-scrollbar">
                {AI_MODELS.filter(m => ['openrouter/deepseek/deepseek-r1', 'openrouter/deepseek/deepseek-4.0-flash', 'openrouter/deepseek/deepseek-4.0-pro', 'openrouter/meta-llama/llama-3.3-70b-instruct', 'openai/gpt-5.2-thinking', 'openai/gpt-5.3-codex', 'google/gemini-3.1-pro'].includes(m.id)).map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      handleModelSelect(model.id)
                      setIsModelsDialogOpen(false)
                    }}
                    className={`w-full flex items-start gap-3.5 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer group pointer-events-auto ${selectedModel === model.id
                      ? 'border-zinc-700 bg-zinc-800/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_15px_rgba(99,102,241,0.08)]'
                      : 'border-transparent bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-800/60'
                      }`}
                  >
                    <ModalModelIcon id={model.id} />
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <span className="font-semibold text-[13px] text-zinc-100 group-hover:text-white leading-tight block truncate md:whitespace-normal">
                        {modelDescriptions[model.id]?.title || model.label}
                      </span>
                      <span className="text-[11px] text-zinc-500 group-hover:text-zinc-400 mt-1 leading-normal line-clamp-2">
                        {modelDescriptions[model.id]?.desc || model.description || ''}
                      </span>
                    </div>
                    {selectedModel === model.id && (
                      <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 self-center ml-auto shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                        <Check className="w-3 h-3 text-zinc-900 stroke-[3px]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAgentsDialogOpen} onOpenChange={setIsAgentsDialogOpen}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[960px] max-h-[90vh] overflow-hidden flex flex-col bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/80 text-zinc-100 p-4 md:p-6 rounded-2xl shadow-2xl focus:outline-none pointer-events-auto">
          <DialogHeader className="relative flex flex-col items-center justify-center pb-4 border-b border-zinc-900">
            <DialogModeSwitch active="agents" language={language} onOpenModels={openModelsDialog} onOpenAgents={openAgentsDialog} />
          </DialogHeader>

          {/* Grid of Agents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4 md:pt-5 pb-2 overflow-y-auto pr-1 custom-scrollbar">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgentId(agent.id)
                  setIsAgentsDialogOpen(false)
                }}
                className={`w-full flex items-start gap-3.5 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer group pointer-events-auto ${selectedAgentId === agent.id
                  ? 'border-zinc-700 bg-zinc-800/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_15px_rgba(99,102,241,0.08)]'
                  : 'border-transparent bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-800/60'
                  }`}
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-900/80 border border-zinc-850 flex items-center justify-center shrink-0 text-base group-hover:border-zinc-800 overflow-hidden">
                  {agent.id === '' ? (
                    <AgentIconSvg className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <Image
                      src={`/agents/${agent.id}.png`}
                      alt={agent.label}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <span className="font-semibold text-[13px] text-zinc-100 group-hover:text-white leading-tight block truncate md:whitespace-normal">
                    {agent.label}
                  </span>
                  <span className="text-[11px] text-zinc-500 group-hover:text-zinc-400 mt-1 leading-normal line-clamp-2">
                    {agent.description}
                  </span>
                </div>
                {selectedAgentId === agent.id && (
                  <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 self-center ml-auto shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                    <Check className="w-3 h-3 text-zinc-900 stroke-[3px]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {hasHydrated && isLoggedIn && (
        <div
          ref={creditsRef}
          id="tour-credits"
          className="absolute top-4 right-4 z-50 group"
          onMouseEnter={() => setShowCreditsTooltip(true)}
          onMouseLeave={() => setShowCreditsTooltip(false)}
        >
          {/* Badge principal */}
          <div
            onClick={() => setShowCreditsTooltip(!showCreditsTooltip)}
            className={`flex items-center gap-2 bg-[#1e1e1e]/80 backdrop-blur-md border rounded-full px-3 md:px-4 h-10 shadow-lg cursor-pointer select-none transition-colors duration-200 ${(credits !== null && credits < 20)
              ? 'border-red-500/40 hover:border-red-500/60'
              : 'border-zinc-800 hover:border-zinc-700'
              }`}
          >
            <span className={`text-sm font-bold ${(credits !== null && credits < 20) ? 'text-red-400' : 'text-zinc-200'
              }`}>
              {credits !== null ? credits.toLocaleString(language) : '--'}
            </span>
            <span className="text-xs text-zinc-500 hidden sm:inline font-medium">{t('app.credits')}</span>
            {credits !== null && credits < 20 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>

          {/* Tooltip card */}
          <div className={`absolute top-full right-0 pt-2 transition-all duration-200 origin-top-right ${showCreditsTooltip
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
            }`}>
            <div className="w-64 bg-[#1a1a1a]/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{language === 'pt-BR' ? 'Seu Plano' : 'Your Plan'}</span>
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  {userPlan || 'Free'}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex items-end justify-between mb-1.5">
                  <span className="text-xs text-zinc-500">{t('app.available_credits')}</span>
                  <span className={`text-xl font-bold tabular-nums ${credits !== null && credits < 20 ? 'text-red-400' : 'text-zinc-100'
                    }`}>
                    {credits !== null ? credits.toLocaleString(language) : '--'}
                  </span>
                </div>
                {/* Barra de progresso */}
                {credits !== null && (
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${credits < 20 ? 'bg-red-500' : credits < 100 ? 'bg-yellow-500' : 'bg-indigo-500'
                        }`}
                      style={{ width: `${Math.min(100, (credits / 500) * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {credits !== null && credits < 20 && (
                <p className="text-[11px] text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 mb-3 leading-relaxed">
                  {t('app.credits_low')}
                </p>
              )}

              <a
                href="/pricing"
                className="block w-full text-center text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 rounded-xl py-2.5 transition-all duration-150"
              >
                {t('app.view_plans')}
              </a>
            </div>
          </div>
        </div>
      )}

      {isScreenShared && (
        <div className={`absolute top-4 left-4 z-40 transition-all duration-300 ${floatingState !== 'none' ? 'group' : ''}`}>
          {floatingState !== 'none' ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1.5 backdrop-blur-md shadow-lg cursor-default">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-red-500 tracking-wider uppercase">Screen Capturing</span>
                <button onClick={stopSharing} className="ml-1 p-0.5 hover:bg-red-500/20 rounded-full text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="w-48 h-28 bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 origin-top-left pointer-events-none">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
            </div>
          ) : (
            <div className="w-64 h-36 bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <span className="bg-red-500 text-[10px] px-2 py-0.5 rounded-full text-white animate-pulse font-bold">LIVE</span>
                <button onClick={stopSharing} className="bg-black/60 hover:bg-black/80 p-1.5 rounded-full text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      <GeminiLiveOrb
        active={isGeminiLiveActive}
        connected={isGeminiLiveConnected}
        phase={geminiLivePhase}
        level={geminiLiveAudioLevel}
        onClose={stopGeminiLive}
      />

      <div
        ref={scrollRef}
        onScroll={checkIsAtBottom}
        className={`absolute inset-0 overflow-y-auto pt-20 custom-scrollbar overscroll-contain transition-all duration-300 ${(isScreenShared || floatingState !== 'none') ? 'pb-64' : 'pb-48'
          } ${isGeminiLiveActive ? 'opacity-25 blur-[2px] scale-[0.995]' : 'opacity-100 blur-0 scale-100'}`}
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0px, black 120px, black calc(100% - 185px), transparent calc(100% - 165px))',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 120px, black calc(100% - 185px), transparent calc(100% - 165px))'
        }}
      >
        <div className="w-full max-w-5xl mx-auto px-4 flex flex-col gap-4">
          {messages.map((m, i) => {
            const messageKey = `${m.id}-${i}`

            if (m.role === 'assistant' && isStreaming && i === messages.length - 1) {
              if (!hasVisibleContent(m.content)) return null;
            }

            return (
              <div
                key={messageKey}
                ref={(node) => setMessageRef(messageKey, node)}
                className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >

                {m.role === 'user' && editingMessageId === m.id ? (
                  // UI MODO EDIÇÃO DA MENSAGEM DO USUÁRIO
                  <div className="bg-zinc-800 p-4 rounded-2xl w-full max-w-[85%] shadow-sm border border-zinc-700 animate-in fade-in">
                    <textarea
                      value={editContent}
                      onChange={(e) => {
                        setEditContent(e.target.value)
                        e.target.style.height = 'auto'
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 300)}px`
                      }}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-zinc-100 text-[15px] focus:outline-none focus:border-zinc-500 resize-none min-h-[100px] max-h-[300px] overflow-y-auto custom-scrollbar"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <Button variant="ghost" size="sm" onClick={() => setEditingMessageId(null)} className="text-zinc-400 hover:text-zinc-200">
                        {language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
                      </Button>
                      <Button size="sm" onClick={() => {
                        setEditingMessageId(null);
                        handleSend(editContent);
                      }} className="bg-zinc-200 text-zinc-900 hover:bg-white font-medium">
                        {language === 'pt-BR' ? 'Atualizar e Enviar' : 'Update and Send'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // UI NORMAL DA MENSAGEM
                  <div className={`group relative max-w-[85%] rounded-2xl px-5 py-4 shadow-sm flex items-start gap-2 ${m.role === 'user' ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm' : 'bg-transparent text-zinc-300'}`}>

                    {/* BOTÃO DE EDITAR (Aparece no Hover) */}
                    {m.role === 'user' && (
                      <button
                        onClick={() => {
                          setEditingMessageId(m.id);
                          setEditContent(m.content);
                        }}
                        className="absolute -left-12 top-3 p-2 bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-700 shadow-sm"
                        title={language === 'pt-BR' ? "Editar mensagem" : "Edit message"}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    <div className="flex flex-col w-full min-w-0">
                      <div className="text-[15px] max-w-none w-full break-words leading-relaxed">
                        {m.content && m.content.match(/!\[Mídia Gerada\]\((.+?)\)/) ? (
                          <span
                            className="mt-2 mb-4 relative rounded-xl overflow-hidden border border-zinc-700/50 shadow-sm max-w-sm cursor-pointer inline-block"
                            onClick={() => { const match = m.content.match(/!\[Mídia Gerada\]\((.+?)\)/); if (match) setLightboxImage(match[1]); }}
                          >
                            <img src={m.content.match(/!\[Mídia Gerada\]\((.+?)\)/)?.[1]} alt="Mídia Gerada" className="w-full h-auto object-cover" />
                          </span>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            urlTransform={(url) => url}
                            components={{
                              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                              a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-400/30 transition-colors font-medium">{children}</a>,
                              ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                              li: ({ children }) => <li className="pl-1 marker:text-zinc-500">{children}</li>,
                              img: ({ src, alt }) => (
                                <span
                                  className="mt-2 mb-4 relative rounded-xl overflow-hidden border border-zinc-700/50 shadow-sm max-w-sm cursor-pointer inline-block"
                                  onClick={() => typeof src === 'string' && setLightboxImage(src)}
                                >
                                  <img src={src} alt={alt} className="w-full h-auto object-cover" />
                                </span>
                              ),
                              h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-zinc-100 pb-2 border-b border-zinc-800">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 text-zinc-100">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-lg font-semibold mb-3 mt-4 text-zinc-200">{children}</h3>,
                              strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
                              em: ({ children }) => <em className="italic text-zinc-400">{children}</em>,
                              blockquote: ({ children }) => <blockquote className="border-l-4 border-indigo-500/50 bg-indigo-500/10 pl-4 py-2 my-4 rounded-r-lg italic text-zinc-300">{children}</blockquote>,
                              hr: () => <hr className="my-6 border-zinc-800/80" />,
                              table: ({ children }) => <div className="overflow-x-auto my-6 rounded-lg border border-zinc-800"><table className="w-full text-left border-collapse text-sm">{children}</table></div>,
                              th: ({ children }) => <th className="bg-zinc-800/50 px-4 py-3 font-semibold text-zinc-200 border-b border-zinc-800">{children}</th>,
                              td: ({ children }) => <td className="px-4 py-3 text-zinc-300 border-b border-zinc-800/50 last:border-0">{children}</td>,
                              code: ({ className, children, ...props }: ComponentPropsWithoutRef<'code'>) => {
                                const match = /language-(\w+)/.exec(className || '')
                                return match ? (
                                  <div className="relative my-5 rounded-xl overflow-hidden bg-[#161616] border border-zinc-800 shadow-md">
                                    <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-zinc-800">
                                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{match[1]}</span>
                                    </div>
                                    <div className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed">
                                      <code className={className} {...props}>{children}</code>
                                    </div>
                                  </div>
                                ) : (
                                  <code className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded-md font-mono text-[13px] border border-zinc-700/50" {...props}>{children}</code>
                                )
                              }
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        )}
                      </div>

                      {/* AI Identification Badge & Actions */}
                      {m.role === 'assistant' && (
                        <div className="flex items-center gap-2 w-full mt-3">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(m.content)
                              setCopiedMessageId(m.id)
                              setTimeout(() => setCopiedMessageId(null), 2000)
                            }}
                            className="flex items-center justify-center p-1.5 rounded-md hover:bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 transition-colors shadow-sm"
                            title={language === 'pt-BR' ? 'Copiar resposta' : 'Copy response'}
                          >
                            {copiedMessageId === m.id ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <CopyIconSvg className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {(() => {
                            const msgAgentId = m.agent_id !== undefined ? m.agent_id : currentAgent.id;
                            const msgModelId = m.model !== undefined ? m.model : selectedModel;

                            const badgeAgent = agents.find(a => a.id === msgAgentId) || agents[0];
                            const msgNormalizedModelId = normalizeModelId(msgModelId);
                            
                            const isGeneratedMedia = m.content && m.content.match(/!\[Mídia Gerada\]\((.+?)\)/);
                            const badgeModelLabel = isGeneratedMedia ? 'Nano Banana' : (modelDescriptions[msgNormalizedModelId]?.title || AI_MODELS.find(model => model.id === msgNormalizedModelId)?.label || 'ScreenAI 1.2');

                            return (
                              <div className="flex items-center gap-2 select-none">
                                {badgeAgent.id !== '' && (
                                  <div className="flex items-center gap-1.5 px-1.5 py-0.5">
                                    <div className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 relative flex items-center justify-center">
                                      <Image
                                        src={`/agents/${badgeAgent.id}.png`}
                                        alt={badgeAgent.label}
                                        width={14}
                                        height={14}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <span className="text-[10px] font-medium text-zinc-500 leading-none">{badgeAgent.label}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 px-2 py-1">
                                  {isGeneratedMedia ? (
                                    <Image src="/logo_nanobanana.png" alt="Nano Banana" width={14} height={14} className="w-3.5 h-3.5 object-contain" />
                                  ) : (
                                    <div className="scale-[0.7] -mx-1 origin-center">
                                      <InputModelIcon id={msgNormalizedModelId} />
                                    </div>
                                  )}
                                  <span className="text-[10px] font-medium text-zinc-500 leading-none">
                                    {badgeModelLabel}
                                  </span>
                                </div>
                              </div>

                            )
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* INDICADOR DE CARREGAMENTO */}
          {isStreaming && (
            <div className="flex items-start w-full pl-2 my-2">
              {isWaitingForFirstChunk && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 px-1 py-1 animate-in fade-in zoom-in-95 duration-300">
                    <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
                      <div className="absolute inset-0 rounded-full border-[2px] border-zinc-600/30"></div>
                      <div className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-zinc-200 animate-[spin_0.8s_linear_infinite]"></div>
                      <img
                        src="/icon.png"
                        alt="Loading"
                        className="w-3.5 h-3.5 object-contain opacity-80 animate-pulse"
                      />
                    </div>
                    <span className="text-sm font-medium text-zinc-300 min-w-[160px] animate-pulse">
                      {isGeneratingMedia 
                        ? (isGeneratingMedia === 'image' ? (language === 'pt-BR' ? 'Gerando imagem...' : 'Generating image...') : (language === 'pt-BR' ? 'Gerando vídeo...' : 'Generating video...'))
                        : loadingPhrases[phraseIndex]}
                    </span>
                    <button
                      type="button"
                      onClick={() => sendCancel()}
                      aria-label={language === 'pt-BR' ? 'Parar resposta' : 'Stop response'}
                      title={language === 'pt-BR' ? 'Parar resposta' : 'Stop response'}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-700/60 hover:text-zinc-200"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                  {isGeneratingMedia && (
                    <div className="ml-1 w-[300px] aspect-square bg-zinc-800/40 rounded-xl border border-zinc-700/30 animate-pulse shadow-sm"></div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── UPSELL INLINE ─────────────────────────────────────────────────
              Aparece como card no chat após a última resposta da IA.
              Só exibe quando não está em streaming e há uma oferta ativa.
          ──────────────────────────────────────────────────────────────────── */}
          {!isStreaming && inlineUpsell && (
            <UpsellChatCard
              message={inlineUpsell.message}
              remainingCredits={inlineUpsell.remainingCredits}
              threshold={inlineUpsell.threshold}
              language={language}
              onDismiss={() => setInlineUpsell(null)}
            />
          )}

          {/* Espaçador físico garantido no final do chat para afastar o texto da barra de input */}
          {!isEmptyChat && <div className="h-36 w-full shrink-0 pointer-events-none" />}
        </div>
      </div>

      {!isGeminiLiveActive && (
        <div
          className={`absolute left-0 right-0 w-full max-w-5xl mx-auto px-4 pointer-events-none transition-all duration-300 ${isEmptyChat
            ? 'top-1/2 -translate-y-1/2 pb-0'
            : 'bottom-0 translate-y-0 pb-5 sm:pb-8'
            } z-10`}
        >
          {isEmptyChat && (
            <>
              <h1 className="empty-chat-prompt pointer-events-none mb-5 text-center text-2xl font-semibold leading-tight text-zinc-100 sm:mb-6 sm:text-3xl">
                <span className="empty-chat-prompt__text">{emptyChatPrompt}</span>
              </h1>

              <div className="flex flex-wrap justify-center items-center gap-2.5 mb-6 pointer-events-auto max-w-full px-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                {/* Pill 1: ScreenAI 1.2 */}
                <button
                  onClick={() => handleModelSelect('screen-ai-1.2')}
                  className={`group flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-all duration-200 ${selectedModel === 'screen-ai-1.2'
                    ? 'border border-zinc-100 bg-[#1e2030]/80 text-zinc-100 shadow-[0_0_12px_rgba(99,102,241,0.15)] scale-[1.02]'
                    : 'border border-zinc-800/80 bg-[#141414]/30 text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f1f]/80'
                    }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-400 to-cyan-300 shadow-[0_0_8px_rgba(99,102,241,0.9)] animate-pulse shrink-0" />
                  <span>ScreenAI 1.2</span>
                </button>

                {/* Pill 2: GPT-5.1 */}
                <button
                  onClick={() => handleModelSelect('openai/gpt-4o')}
                  className={`group flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-all duration-200 ${selectedModel === 'openai/gpt-4o'
                    ? 'border border-zinc-100 bg-[#1e2030]/80 text-zinc-100 shadow-[0_0_12px_rgba(99,102,241,0.15)] scale-[1.02]'
                    : 'border border-zinc-800/80 bg-[#141414]/30 text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f1f]/80'
                    }`}
                >
                  <Image
                    src="/chatgpt-logo.png"
                    alt="GPT-5.1"
                    width={16}
                    height={16}
                    className={`w-4 h-4 object-contain shrink-0 ${selectedModel === 'openai/gpt-4o' ? 'opacity-100' : 'opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all'}`}
                  />
                  <span>GPT-5.1</span>
                </button>

                {/* Pill 3: Claude 4.6 Sonnet Thinking */}
                <button
                  onClick={() => handleModelSelect('anthropic/claude-3-5-sonnet-20241022')}
                  className={`group flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-all duration-200 ${selectedModel === 'anthropic/claude-3-5-sonnet-20241022'
                    ? 'border border-zinc-100 bg-[#1e2030]/80 text-zinc-100 shadow-[0_0_12px_rgba(99,102,241,0.15)] scale-[1.02]'
                    : 'border border-zinc-800/80 bg-[#141414]/30 text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f1f]/80'
                    }`}
                >
                  <Image
                    src="/claude-logo.png"
                    alt="Claude"
                    width={16}
                    height={16}
                    className={`w-4 h-4 object-contain shrink-0 ${selectedModel === 'anthropic/claude-3-5-sonnet-20241022' ? 'opacity-100' : 'opacity-60 group-hover:opacity-100 transition-all'}`}
                  />
                  <span>Claude 4.6 Sonnet Thinking</span>
                </button>

                {/* Pill 4: Ver todos os modelos */}
                <button
                  onClick={() => setIsModelsDialogOpen(true)}
                  className={`group flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-all duration-200 ${!['screen-ai-1.2', 'openai/gpt-4o', 'anthropic/claude-3-5-sonnet-20241022'].includes(selectedModel)
                    ? 'border border-zinc-100 bg-[#1e2030]/80 text-zinc-100 shadow-[0_0_12px_rgba(99,102,241,0.15)] scale-[1.02]'
                    : 'border border-zinc-800/80 bg-[#141414]/30 text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f1f]/80'
                    }`}
                >
                  <span>
                    {!['screen-ai-1.2', 'openai/gpt-4o', 'anthropic/claude-3-5-sonnet-20241022'].includes(selectedModel)
                      ? AI_MODELS.find(m => m.id === selectedModel)?.label || (language === 'pt-BR' ? 'Ver todos os modelos' : 'View all models')
                      : (language === 'pt-BR' ? 'Ver todos os modelos' : 'View all models')}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-zinc-400 group-hover:text-zinc-200 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </>
          )}
          <div id="tour-input-bar" className="pointer-events-auto bg-[#1e1e1e] border border-zinc-800/80 rounded-[28px] px-1.5 pt-1.5 pb-1 shadow-2xl relative flex flex-col gap-1">
            {selectedFile && (
              <div className="absolute -top-14 left-4 bg-[#2a2a2a] border border-zinc-700/80 rounded-xl px-3 py-2 flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-indigo-500/20 p-1.5 rounded-lg">
                  <FileUp className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm font-medium text-zinc-200 max-w-[180px] truncate">
                  {selectedFile.name}
                </span>
                <button onClick={() => setSelectedFile(null)} className="ml-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 p-1 rounded-md transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* CAIXA DE TEXTO MULTI-LINHA COM LAYOUT DO MOCKUP (TEXTAREA ACIMA, BOTÕES ABAIXO) */}
            <div className="flex flex-col gap-1.5 bg-[#121212] rounded-[22px] px-2.5 py-2">

              {/* Textarea Area */}
              <div className="w-full flex items-start">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={e => {
                    setInputValue(e.target.value);
                    e.target.style.height = 'auto'; // Reseta a altura
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`; // Cresce até ao limite de 200px
                  }}
                  onKeyDown={e => {
                    // Se pressionar Enter (SEM o Shift), envia a mensagem.
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={placeholderText}
                  rows={1}
                  className="placeholder-ellipsis w-full bg-transparent border-none focus:outline-none focus:ring-0 text-zinc-200 placeholder:text-zinc-500 text-[15px] resize-none py-0.5 leading-6 max-h-[200px] overflow-y-auto custom-scrollbar"
                  style={{ minHeight: '28px' }}
                />
              </div>

            </div>

            {/* Bottom Row: Pills (Left) and Action Buttons (Right) - POSICIONADOS NA PARTE CINZA */}
            <div className="flex items-center justify-between gap-2 w-full px-1.5 py-0">
              {/* Left Side: Pills */}
              <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                {/* Plus Attachment Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      id="tour-attachment-btn"
                      className="flex items-center justify-center bg-transparent hover:bg-zinc-800 rounded-full w-7 h-7 text-white transition-colors shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent container={floatingState !== 'none' && pipWindow ? pipWindow.document.body : undefined} align="start" sideOffset={12} className="w-64 bg-[#1a1a1a] border-zinc-800 text-zinc-200 p-1.5 rounded-xl shadow-2xl z-[100] transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 duration-150 ease-out">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="flex items-center justify-start gap-3 py-3 px-3 focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg transition-colors group">
                      <FileUp className="w-5 h-5 shrink-0 text-zinc-400 group-hover:text-zinc-300" />
                      <span className="font-medium text-[14px]">{t('app.send_file')}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setMediaMode('image')} className="flex items-center justify-start gap-3 py-3 px-3 focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg transition-colors group">
                      <ImageIcon className="w-5 h-5 shrink-0 text-zinc-400 group-hover:text-zinc-300" />
                      <span className="font-medium text-[14px]">{language === 'pt-BR' ? 'Gerar Imagem' : 'Generate Image'}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setMediaMode('video')} className="flex items-center justify-start gap-3 py-3 px-3 focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg transition-colors group">
                      <Video className="w-5 h-5 shrink-0 text-zinc-400 group-hover:text-zinc-300" />
                      <span className="font-medium text-[14px]">{language === 'pt-BR' ? 'Gerar Vídeo' : 'Generate Video'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {mediaMode !== 'text' && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border-[1.5px] ${mediaMode === 'image' ? 'border-indigo-500/80 bg-indigo-500/10' : 'border-blue-500/80 bg-blue-500/10'} shrink-0 select-none animate-in fade-in zoom-in-95 duration-200`}>
                    {mediaMode === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> : <Video className="w-3.5 h-3.5 text-blue-400" />}
                    <span className="text-[12px] font-semibold empty-chat-prompt__text leading-none pt-0.5 pb-0.5">
                      {mediaMode === 'image' ? (language === 'pt-BR' ? 'Imagem' : 'Image') : (language === 'pt-BR' ? 'Vídeo' : 'Video')}
                    </span>
                    <button onClick={() => setMediaMode('text')} className="ml-0.5 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center rounded-full">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Agent Selector Button */}
                <button
                  onClick={() => setIsAgentsDialogOpen(true)}
                  className="flex items-center gap-1.5 bg-[#121212] hover:bg-zinc-850 border border-zinc-800 rounded-full pl-2 pr-2.5 py-1 text-xs text-zinc-300 hover:text-zinc-200 transition-colors shadow-sm select-none cursor-pointer font-semibold text-[11px]"
                >
                  {currentAgent.id === '' ? (
                    <AgentIconSvg className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 relative flex items-center justify-center">
                      <Image
                        src={`/agents/${currentAgent.id}.png`}
                        alt={currentAgent.label}
                        width={14}
                        height={14}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <span className="leading-none">{currentAgent.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                </button>

                {/* AI Model Selector Button (Only visible if NOT empty chat) */}
                {!isEmptyChat && (
                  <button
                    onClick={() => setIsModelsDialogOpen(true)}
                    className="flex items-center gap-1.5 bg-[#121212] hover:bg-zinc-850 border border-zinc-800 rounded-full pl-1.5 pr-2.5 py-1 text-xs text-zinc-300 hover:text-zinc-200 transition-colors shadow-sm select-none cursor-pointer"
                  >
                    <InputModelIcon id={selectedModel} />
                    <span className="font-semibold text-[11px] leading-none">
                      {modelDescriptions[selectedModel]?.title || AI_MODELS.find(m => m.id === selectedModel)?.label || 'ScreenAI'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                )}
              </div>

              {/* Right Side: Action Buttons */}
              <div className="flex shrink-0 items-center justify-end gap-1 pr-0.5">
                <Button
                  id="tour-continuous-mic"
                  size="icon"
                  onClick={toggleGeminiLive}
                  title={language === 'pt-BR' ? "Iniciar Gemini Live (Voz + Visão)" : "Start Gemini Live (Voice + Vision)"}
                  className="rounded-full w-8 h-8 transition-all bg-transparent text-zinc-400 hover:bg-zinc-800/80"
                >
                  <AudioLines className="w-4.5 h-4.5" />
                </Button>
                <Button
                  id="tour-mic-btn"
                  size="icon"
                  onClick={async () => {
                    if (isVoiceActive) {
                      await stopRecording()
                    } else {
                      startRecording()
                    }
                  }}
                  disabled={!recognitionSupported}
                  title={!recognitionSupported ? (language === 'pt-BR' ? 'Reconhecimento de voz indisponível neste navegador' : 'Voice recognition is unavailable in this browser') : undefined}
                  className={`rounded-full w-9 h-9 transition-all ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-zinc-400 hover:bg-zinc-800/80'} ${!recognitionSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Mic className="w-4.5 h-4.5" />
                </Button>
                <Button size="icon" onClick={() => handleSend()} disabled={!inputValue.trim() && !isScreenShared && !isVoiceActive && !selectedFile} className="rounded-full bg-zinc-200 text-zinc-900 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 w-8 h-8 transition-colors">
                  <Navigation className="w-4.5 h-4.5" />
                </Button>
              </div>
            </div>

            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,application/pdf,audio/*,.xlsx,.xls,.zip,.txt,.csv" />
          </div>
        </div>
      )}

      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md transition-all duration-300 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-5 z-10" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { navigator.clipboard.writeText(lightboxImage); alert(language === 'pt-BR' ? 'URL copiada!' : 'URL copied!') }} className="text-white hover:text-zinc-300 transition-colors drop-shadow-md" title={language === 'pt-BR' ? 'Copiar URL' : 'Copy URL'}>
              <Copy className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <a href={lightboxImage} download="screenai-gerada.png" target="_blank" rel="noopener noreferrer" className="text-white hover:text-zinc-300 transition-colors drop-shadow-md" title={language === 'pt-BR' ? 'Baixar' : 'Download'}>
              <Download className="w-5 h-5" strokeWidth={2.5} />
            </a>
            <button onClick={() => setLightboxImage(null)} className="text-white hover:text-zinc-300 transition-colors drop-shadow-md" title={language === 'pt-BR' ? 'Fechar' : 'Close'}>
              <X className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>

          <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
             <img src={lightboxImage} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" alt="Mídia Gerada" />
          </div>
        </div>
      )}
    </div>
  )
}
