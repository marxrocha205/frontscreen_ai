"use client"

import { MonitorPlay } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#111] text-zinc-100 flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800/50">
        <Link href="/app" className="flex items-center gap-2.5 text-zinc-100 hover:text-white transition-colors">
          <MonitorPlay className="w-5 h-5 text-zinc-400" />
          <span className="font-semibold text-base">ScreenAI</span>
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto py-20 px-6">
        <h1 className="text-4xl font-bold mb-8">Política de Privacidade</h1>
        
        <div className="space-y-6 text-zinc-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">1. Coleta de Dados</h2>
            <p>
              O ScreenAI coleta dados de captura de tela apenas durante as sessões ativas de assistência, conforme solicitado pelo usuário. Esses dados são processados em tempo real para fornecer insights de IA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">2. Uso das Informações</h2>
            <p>
              As informações capturadas não são utilizadas para treinamento de modelos de terceiros sem seu consentimento explícito. O histórico de conversas é armazenado de forma criptografada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">3. Seus Direitos</h2>
            <p>
              Você pode solicitar a exclusão de sua conta e de todo o histórico de dados a qualquer momento através das configurações do aplicativo.
            </p>
          </section>

          <section className="pt-8 border-t border-zinc-900">
            <p className="text-sm">
              Última atualização: 23 de Março de 2026.
            </p>
            <Link href="/app" className="inline-block mt-4 text-zinc-300 hover:text-white underline underline-offset-4">
              Voltar ao Início
            </Link>
          </section>
        </div>
      </main>
    </div>
  )
}
