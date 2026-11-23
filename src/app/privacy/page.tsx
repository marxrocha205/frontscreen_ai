"use client"

import { MonitorPlay } from 'lucide-react'
import Link from 'next/link'

// Defina o e-mail de contato/privacidade (obrigatório nas lojas de aplicativos).
const CONTACT_EMAIL = 'marxrochascr@gmail.com'

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. Dados que coletamos',
    body: (
      <ul className="list-disc pl-6 space-y-1">
        <li><strong className="text-zinc-200">Conta:</strong> nome, e-mail, telefone (opcional), foto de perfil e senha (armazenada com hash). No login com Google ou Apple recebemos nome e e-mail.</li>
        <li><strong className="text-zinc-200">Conversas:</strong> mensagens de texto, respostas da IA, arquivos e imagens que você envia ou gera.</li>
        <li><strong className="text-zinc-200">Voz:</strong> o áudio do microfone, enviado em tempo real somente durante o modo de voz (ScreenAI Live) ou ao gravar uma mensagem. Podemos guardar a transcrição no histórico.</li>
        <li><strong className="text-zinc-200">Câmera e tela:</strong> fotos da câmera e imagens da tela são capturadas apenas quando você inicia a análise ou o compartilhamento de tela, e enviadas à IA para gerar a resposta. No Android, uma notificação permanente indica que a captura está ativa e você pode encerrá-la a qualquer momento.</li>
        <li><strong className="text-zinc-200">Uso e pagamento:</strong> consumo de créditos, plano e status de assinatura. Dados de cartão são processados pelo provedor de pagamento e não são armazenados por nós.</li>
        <li><strong className="text-zinc-200">Dados técnicos:</strong> registros de erro e desempenho para manter o serviço estável.</li>
      </ul>
    ),
  },
  {
    title: '2. Como usamos os dados',
    body: (
      <p>
        Usamos seus dados para fornecer o serviço (responder suas perguntas, transcrever voz, analisar imagens e gerar conteúdo),
        manter sua conta, controlar créditos e cobranças, prevenir abusos e melhorar a estabilidade. Não vendemos seus dados.
      </p>
    ),
  },
  {
    title: '3. Compartilhamento com provedores de IA de terceiros',
    body: (
      <p>
        Para gerar as respostas, enviamos o que você escreve, fala, fotografa ou compartilha da tela a provedores de inteligência
        artificial de terceiros, como Google (Gemini), OpenAI, Anthropic, xAI, DeepSeek e outros modelos disponíveis no serviço,
        de acordo com o modelo escolhido por você. Esse envio só ocorre por uma ação sua (enviar mensagem, falar ou iniciar o
        compartilhamento) e, no aplicativo móvel, depois do seu consentimento explícito, que pode ser revogado a qualquer momento
        em Ajustes. Esses provedores tratam os dados conforme suas próprias políticas. Também usamos provedores de infraestrutura,
        e-mail e pagamento (por exemplo, Stripe e Cielo) estritamente para operar o serviço.
      </p>
    ),
  },
  {
    title: '4. Retenção e exclusão',
    body: (
      <p>
        Mantemos seus dados enquanto sua conta existir. Você pode apagar conversas individualmente e excluir sua conta e todos os dados
        associados (conversas, uso, assinatura e transações) a qualquer momento: pelo aplicativo, em Ajustes &gt; Excluir conta, ou pela página{' '}
        <Link href="/delete-account" className="text-zinc-200 underline underline-offset-4">/delete-account</Link>.
        Dados que a lei exija guardar podem ser mantidos pelo prazo legal.
      </p>
    ),
  },
  {
    title: '5. Seus direitos',
    body: (
      <p>
        Nos termos da LGPD, você pode solicitar acesso, correção, portabilidade e exclusão dos seus dados, e revogar consentimentos.
        Para exercer esses direitos, use as opções do aplicativo ou entre em contato.
      </p>
    ),
  },
  {
    title: '6. Segurança e crianças',
    body: (
      <p>
        Usamos conexão criptografada e controles de acesso para proteger os dados. O serviço não é destinado a menores de 13 anos.
      </p>
    ),
  },
]

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

        <div className="space-y-8 text-zinc-400 leading-relaxed">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-xl font-semibold text-zinc-100 mb-3">{s.title}</h2>
              {s.body}
            </section>
          ))}

          {CONTACT_EMAIL && (
            <section>
              <h2 className="text-xl font-semibold text-zinc-100 mb-3">7. Contato</h2>
              <p>
                Dúvidas ou solicitações sobre privacidade:{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-zinc-200 underline underline-offset-4">{CONTACT_EMAIL}</a>
              </p>
            </section>
          )}

          <section className="pt-8 border-t border-zinc-900">
            <p className="text-sm">Última atualização: 22 de Novembro de 2026.</p>
            <Link href="/app" className="inline-block mt-4 text-zinc-300 hover:text-white underline underline-offset-4">
              Voltar ao Início
            </Link>
          </section>
        </div>
      </main>
    </div>
  )
}
