"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { ChevronLeft, Loader2, Zap, Paperclip, Image as ImageIcon, Brain, CreditCard } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { config } from '@/lib/config'

/* ─── Plan data ─────────────────────────────────────────── */
const plans = [
  {
    id: 2,
    name: 'Go plan',
    price: 39.99,
    features: [
      { text: 'Smarter, faster responses with GPT-5', Icon: Zap,        color: '#3b82f6' },
      { text: 'More messages & uploads',              Icon: Paperclip,   color: '#3b82f6' },
      { text: 'Create more images, faster',           Icon: ImageIcon,   color: '#818cf8' },
      { text: 'Extra memory & context',               Icon: Brain,       color: '#818cf8' },
    ],
  },
  {
    id: 3,
    name: 'Pro plan',
    price: 97.00,
    features: [
      { text: 'Smarter, faster responses with GPT-5', Icon: Zap,        color: '#3b82f6' },
      { text: 'More messages & uploads',              Icon: Paperclip,   color: '#3b82f6' },
      { text: 'Create more images, faster',           Icon: ImageIcon,   color: '#818cf8' },
      { text: 'Extra memory & context',               Icon: Brain,       color: '#818cf8' },
    ],
  },
]

/* ─── Pix official icon ─────────────────────────────────── */
function PixIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-label="Pix"
    >
      <path fill="#4db6ac" d="M11.9,12h-0.68l8.04-8.04c2.62-2.61,6.86-2.61,9.48,0L36.78,12H36.1c-1.6,0-3.11,0.62-4.24,1.76l-6.8,6.77c-0.59,0.59-1.53,0.59-2.12,0l-6.8-6.77C15.01,12.62,13.5,12,11.9,12z"/>
      <path fill="#4db6ac" d="M36.1,36h0.68l-8.04,8.04c-2.62,2.61-6.86,2.61-9.48,0L11.22,36h0.68c1.6,0,3.11-0.62,4.24-1.76l6.8-6.77c0.59-0.59,1.53-0.59,2.12,0l6.8,6.77C32.99,35.38,34.5,36,36.1,36z"/>
      <path fill="#4db6ac" d="M44.04,28.74L38.78,34H36.1c-1.07,0-2.07-0.42-2.83-1.17l-6.8-6.78c-1.36-1.36-3.58-1.36-4.94,0l-6.8,6.78C13.97,33.58,12.97,34,11.9,34H9.22l-5.26-5.26c-2.61-2.62-2.61-6.86,0-9.48L9.22,14h2.68c1.07,0,2.07,0.42,2.83,1.17l6.8,6.78c0.68,0.68,1.58,1.02,2.47,1.02s1.79-0.34,2.47-1.02l6.8-6.78C34.03,14.42,35.03,14,36.1,14h2.68l5.26,5.26C46.65,21.88,46.65,26.12,44.04,28.74z"/>
    </svg>
  )
}

/* ─── Card brand mini-badges ──────────────────────────────── */
function CardBrands() {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {/* Visa */}
      <span style={{
        background: '#1a1f71', color: '#fff', fontSize: 9, fontWeight: 900,
        fontStyle: 'italic', padding: '2px 5px', borderRadius: 3, letterSpacing: 0.5,
      }}>VISA</span>
      {/* Mastercard */}
      <span style={{ display: 'flex', gap: -4, position: 'relative', width: 24, height: 16 }}>
        <span style={{
          width: 14, height: 14, borderRadius: '50%', background: '#eb001b',
          position: 'absolute', left: 0, top: 1,
        }} />
        <span style={{
          width: 14, height: 14, borderRadius: '50%', background: '#f79e1b',
          position: 'absolute', left: 8, top: 1, opacity: 0.9,
        }} />
      </span>
      {/* Amex */}
      <span style={{
        background: '#007bc1', color: '#fff', fontSize: 8, fontWeight: 700,
        padding: '2px 4px', borderRadius: 3, letterSpacing: 0.3,
      }}>AMEX</span>
    </div>
  )
}

/* ─── Main content ───────────────────────────────────────── */
function CheckoutContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { isLoggedIn } = useAuth()

  const planId       = searchParams.get('plan')
  const selectedPlan = plans.find(p => p.id === Number(planId)) || plans[0]

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card')
  const [isLoading,     setIsLoading]     = useState(false)
  const [pixForm,       setPixForm]       = useState({ cpf: '', name: '' })
  const [pixData,       setPixData]       = useState<{ qrcode: string; copyPaste: string } | null>(null)

  useEffect(() => {
    if (!isLoggedIn) router.push('/login')
  }, [isLoggedIn, router])

  const handlePixSubmit = async () => {
    setIsLoading(true)
    try {
      const token    = localStorage.getItem('access_token')
      const response = await fetch(`${config.apiUrl}/api/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          plan_id:   selectedPlan.id,
          full_name: pixForm.name,
          document:  pixForm.cpf.replace(/\D/g, ''),
          phone:     '00000000000',
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setPixData({ qrcode: data.pix_qrcode_url, copyPaste: data.pix_copy_paste })
      } else {
        alert(data.detail || 'Erro ao gerar pagamento.')
      }
    } catch {
      alert('Erro de conexão com o servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  /* ── shared input style ── */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#2a2a2a',
    border: 'none',
    borderRadius: 10,
    height: 56,
    padding: '0 20px',
    color: '#fff',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' }}>

      {/* Logo top-left */}
      <div style={{ position: 'absolute', top: 20, left: 28 }}>
        <Link href="/pricing">
          <Image src="/logobranco-semfundo.png" alt="ScreenAI" width={48} height={48} style={{ objectFit: 'contain', opacity: 0.9 }} />
        </Link>
      </div>

      {/* Main grid */}
      <main style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '80px 32px 60px',
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 64,
        alignItems: 'start',
      }}>

        {/* ── LEFT COLUMN ────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => router.back()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}
            >
              <ChevronLeft size={22} />
            </button>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px' }}>
              Configure your plan
            </h1>
          </div>

          {/* Payment method label */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#e5e7eb' }}>Payment method</span>

            {/* Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {/* Card tab */}
              <button
                onClick={() => setPaymentMethod('card')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 20px',
                  borderRadius: 10,
                  border: paymentMethod === 'card' ? '1.5px solid #e5e7eb' : '1.5px solid transparent',
                  background: '#1a1a1a',
                  color: paymentMethod === 'card' ? '#fff' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: 15, fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                <CreditCard size={16} />
                Card
              </button>

              {/* Pix tab */}
              <button
                onClick={() => setPaymentMethod('pix')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 20px',
                  borderRadius: 10,
                  border: paymentMethod === 'pix' ? '1.5px solid #e5e7eb' : '1.5px solid transparent',
                  background: '#1a1a1a',
                  color: paymentMethod === 'pix' ? '#fff' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: 15, fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                <PixIcon size={16} />
                Pix
              </button>
            </div>

            {/* ── CARD FIELDS ── */}
            {paymentMethod === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {/* Card number */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Card number"
                    style={inputStyle}
                  />
                  <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
                    <CardBrands />
                  </div>
                </div>

                {/* Expiration + Security */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Expiration date"
                    style={inputStyle}
                  />
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Security code"
                      maxLength={4}
                      inputMode="numeric"
                      style={inputStyle}
                    />
                    <CreditCard
                      size={18}
                      style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── PIX FIELDS ── */}
            {paymentMethod === 'pix' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <input
                  type="text"
                  placeholder="CPF or CNPJ"
                  value={pixForm.cpf}
                  onChange={e => setPixForm({ ...pixForm, cpf: e.target.value })}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Full name"
                  value={pixForm.name}
                  onChange={e => setPixForm({ ...pixForm, name: e.target.value })}
                  style={inputStyle}
                />

                {/* QR code notice */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 4px 4px' }}>
                  <div style={{
                    width: 36, height: 36, border: '2px solid #4b5563',
                    borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {/* QR corners */}
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="1" y="1" width="7" height="7" rx="1" stroke="#9ca3af" strokeWidth="1.5" fill="none"/>
                      <rect x="12" y="1" width="7" height="7" rx="1" stroke="#9ca3af" strokeWidth="1.5" fill="none"/>
                      <rect x="1" y="12" width="7" height="7" rx="1" stroke="#9ca3af" strokeWidth="1.5" fill="none"/>
                      <rect x="3" y="3" width="3" height="3" fill="#9ca3af"/>
                      <rect x="14" y="3" width="3" height="3" fill="#9ca3af"/>
                      <rect x="3" y="14" width="3" height="3" fill="#9ca3af"/>
                      <line x1="12" y1="12" x2="19" y2="12" stroke="#9ca3af" strokeWidth="1.5"/>
                      <line x1="12" y1="15" x2="15" y2="15" stroke="#9ca3af" strokeWidth="1.5"/>
                      <line x1="17" y1="15" x2="19" y2="15" stroke="#9ca3af" strokeWidth="1.5"/>
                      <line x1="12" y1="18" x2="19" y2="18" stroke="#9ca3af" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>
                    You will be shown a QR code to scan to complete your purchase.
                  </p>
                </div>

                {/* IOF notice */}
                <p style={{ margin: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.6, paddingTop: 4 }}>
                  This is an international purchase and may include a 3.5% IOF fee. By
                  proceeding, you acknowledge and accept{' '}
                  <Link href="#" style={{ color: '#6b7280', textDecoration: 'underline' }}>
                    Ebanx&apos;s terms and conditions
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ───────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Summary card */}
          <div style={{
            background: '#1c1c1c',
            borderRadius: 18,
            padding: '28px 28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}>
            {/* Plan name */}
            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 600 }}>
              {selectedPlan.name}
            </h2>

            {/* Top features label */}
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
              Top features
            </p>

            {/* Features list */}
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedPlan.features.map(({ text, Icon, color }, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#d1d5db' }}>
                  <Icon size={14} style={{ color, flexShrink: 0 }} />
                  {text}
                </li>
              ))}
            </ul>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #2a2a2a', margin: '24px 0 16px' }} />

            {/* Price breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#9ca3af' }}>
                <span>Monthly subscription</span>
                <span style={{ color: '#d1d5db' }}>R${selectedPlan.price.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#9ca3af' }}>
                <span>Estimated tax</span>
                <span style={{ color: '#d1d5db' }}>R$0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 6 }}>
                <span>Due today</span>
                <span>R${selectedPlan.price.toFixed(2)}</span>
              </div>
            </div>

            {/* Subscribe button */}
            <button
              onClick={paymentMethod === 'pix' ? handlePixSubmit : undefined}
              disabled={isLoading || !!pixData}
              style={{
                marginTop: 20,
                width: '100%',
                height: 48,
                background: pixData ? '#10b981' : '#5c5cfc',
                border: 'none',
                borderRadius: 9999,
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                cursor: isLoading ? 'wait' : (pixData ? 'default' : 'pointer'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isLoading && !pixData) (e.currentTarget as HTMLButtonElement).style.background = '#4848e8' }}
              onMouseLeave={e => { if (!pixData) (e.currentTarget as HTMLButtonElement).style.background = '#5c5cfc' }}
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : (pixData ? 'Aguardando Pagamento...' : 'Subscribe')}
            </button>

            {/* Pix QR Code Display */}
            {pixData && (
              <div style={{
                marginTop: 24,
                padding: 20,
                background: '#2a2a2a',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                border: '1px solid #32BCAD33'
              }}>
                <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
                  <Image src={pixData.qrcode} alt="Pix QR Code" width={200} height={200} />
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pixData.copyPaste)
                    alert('Código Pix copiado!')
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'transparent',
                    border: '1px solid #4b5563',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <Paperclip size={14} />
                  Copiar Código Pix
                </button>
                <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', margin: 0 }}>
                  Após o pagamento, sua conta será ativada automaticamente em instantes.
                </p>
              </div>
            )}
          </div>

          {/* Footer disclaimer */}
          <p style={{
            margin: 0,
            fontSize: 11,
            color: '#4b5563',
            lineHeight: 1.7,
            padding: '0 2px',
          }}>
            Renews monthly until cancelled. R${selectedPlan.price.toFixed(2)}/month will be charged.{' '}
            <Link href="#" style={{ color: '#4b5563', textDecoration: 'underline' }}>Cancel anytime</Link>{' '}
            in Settings. By subscribing, you agree to our{' '}
            <Link href="#" style={{ color: '#4b5563', textDecoration: 'underline' }}>Terms of Use</Link>{' '}
            and{' '}
            <Link href="#" style={{ color: '#4b5563', textDecoration: 'underline' }}>Service Credit Terms</Link>
            , have read our{' '}
            <Link href="#" style={{ color: '#4b5563', textDecoration: 'underline' }}>Privacy Policy</Link>
            , and authorize ScreenAI to store and charge your payment method.
          </p>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={40} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
