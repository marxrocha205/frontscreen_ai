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
    name: 'Plano PRO Mensal',
    price: 97.90,
    features: [
      { text: 'Respostas mais inteligentes e rápidas', Icon: Zap, color: '#3b82f6' },
      { text: 'Tokens ilimitados e sem interrupções', Icon: Paperclip, color: '#3b82f6' },
      { text: 'Acesso a ScreenAI, Gemini e GPT-5', Icon: ImageIcon, color: '#818cf8' },
      { text: 'Histórico completo entre sessões', Icon: Brain, color: '#818cf8' },
    ],
  },
  {
    id: 3,
    name: 'Plano PRO Anual',
    price: 797.90,
    features: [
      { text: 'Tudo do PRO e muito mais', Icon: Zap, color: '#3b82f6' },
      { text: 'Janela de contexto gigante', Icon: Paperclip, color: '#3b82f6' },
      { text: 'Multi-IA Simultânea (Claude/GPT/Gemini)', Icon: ImageIcon, color: '#818cf8' },
      { text: 'Suporte técnico prioritário 24h', Icon: Brain, color: '#818cf8' },
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
      <path fill="#4db6ac" d="M11.9,12h-0.68l8.04-8.04c2.62-2.61,6.86-2.61,9.48,0L36.78,12H36.1c-1.6,0-3.11,0.62-4.24,1.76l-6.8,6.77c-0.59,0.59-1.53,0.59-2.12,0l-6.8-6.77C15.01,12.62,13.5,12,11.9,12z" />
      <path fill="#4db6ac" d="M36.1,36h0.68l-8.04,8.04c-2.62,2.61-6.86,2.61-9.48,0L11.22,36h0.68c1.6,0,3.11-0.62,4.24-1.76l6.8-6.77c0.59-0.59,1.53-0.59,2.12,0l6.8,6.77C32.99,35.38,34.5,36,36.1,36z" />
      <path fill="#4db6ac" d="M44.04,28.74L38.78,34H36.1c-1.07,0-2.07-0.42-2.83-1.17l-6.8-6.78c-1.36-1.36-3.58-1.36-4.94,0l-6.8,6.78C13.97,33.58,12.97,34,11.9,34H9.22l-5.26-5.26c-2.61-2.62-2.61-6.86,0-9.48L9.22,14h2.68c1.07,0,2.07,0.42,2.83,1.17l6.8,6.78c0.68,0.68,1.58,1.02,2.47,1.02s1.79-0.34,2.47-1.02l6.8-6.78C34.03,14.42,35.03,14,36.1,14h2.68l5.26,5.26C46.65,21.88,46.65,26.12,44.04,28.74z" />
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hasHydrated, isLoggedIn, syncFromStorage } = useAuth()

  const planId = searchParams.get('plan')
  const selectedPlan = plans.find(p => p.id === Number(planId)) || plans[0]

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card')
  const [isLoading, setIsLoading] = useState(false)
  const [pixForm, setPixForm] = useState({
    cpf: '',
    name: '',
    phone: '',
    zip_code: '',
    street_name: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  })
  const [pixData, setPixData] = useState<{ qrcode: string; copyPaste: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form masking functions
  const maskCPF = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 11) {
      return clean
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      return clean
        .substring(0, 14)
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
  };

  const maskPhone = (value: string) => {
    const clean = value.replace(/\D/g, '').substring(0, 11);
    if (clean.length <= 10) {
      return clean
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      return clean
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
  };

  const maskCEP = (value: string) => {
    const clean = value.replace(/\D/g, '').substring(0, 8);
    return clean.replace(/^(\d{5})(\d)/, '$1-$2');
  };

  const validateCPF = (cpf: string) => {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (/^(\d)\1+$/.test(clean)) return false;
    let sum = 0;
    let rest;
    for (let i = 1; i <= 9; i++) sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(clean.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(clean.substring(10, 11))) return false;
    return true;
  };

  const validateCNPJ = (cnpj: string) => {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return false;
    if (/^(\d)\1+$/.test(clean)) return false;
    let size = clean.length - 2;
    let numbers = clean.substring(0, size);
    const digits = clean.substring(size);
    let sum = 0;
    let pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;
    size = size + 1;
    numbers = clean.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;
    return true;
  };

  const validateCpfOrCnpj = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length === 11) return validateCPF(clean);
    if (clean.length === 14) return validateCNPJ(clean);
    return false;
  };

  // Determine if personal data is complete and valid
  const isPersonalDataComplete =
    pixForm.name.trim().length >= 4 &&
    pixForm.name.trim().split(/\s+/).filter(Boolean).length >= 2 &&
    pixForm.cpf.replace(/\D/g, '').length >= 11 &&
    validateCpfOrCnpj(pixForm.cpf) &&
    pixForm.phone.replace(/\D/g, '').length >= 10;

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    const nameParts = pixForm.name.trim().split(/\s+/).filter(Boolean);
    if (!pixForm.name.trim()) {
      newErrors.name = 'Nome completo é obrigatório'
    } else if (nameParts.length < 2) {
      newErrors.name = 'Por favor, digite seu nome e sobrenome'
    } else if (pixForm.name.trim().length < 4) {
      newErrors.name = 'Nome completo deve ter pelo menos 4 caracteres'
    }

    const rawCpf = pixForm.cpf.replace(/\D/g, '')
    if (!rawCpf) {
      newErrors.cpf = 'CPF ou CNPJ é obrigatório'
    } else if (rawCpf.length !== 11 && rawCpf.length !== 14) {
      newErrors.cpf = 'Insira um CPF (11 dígitos) ou CNPJ (14 dígitos) completo'
    } else if (!validateCpfOrCnpj(pixForm.cpf)) {
      newErrors.cpf = 'CPF ou CNPJ inválido'
    }

    const rawPhone = pixForm.phone.replace(/\D/g, '')
    if (!rawPhone) {
      newErrors.phone = 'Celular é obrigatório'
    } else if (rawPhone.length < 10 || rawPhone.length > 11) {
      newErrors.phone = 'Celular inválido (mínimo 10 dígitos com DDD)'
    }

    if (isPersonalDataComplete) {
      const rawCep = pixForm.zip_code.replace(/\D/g, '')
      if (!rawCep) {
        newErrors.zip_code = 'CEP é obrigatório'
      } else if (rawCep.length !== 8) {
        newErrors.zip_code = 'CEP deve ter 8 dígitos'
      }
      if (!pixForm.street_name.trim()) {
        newErrors.street_name = 'Logradouro é obrigatório'
      }
      if (!pixForm.number.trim()) {
        newErrors.number = 'Número é obrigatório'
      }
      if (!pixForm.neighborhood.trim()) {
        newErrors.neighborhood = 'Bairro é obrigatório'
      }
      if (!pixForm.city.trim()) {
        newErrors.city = 'Cidade é obrigatória'
      }
      if (!pixForm.state.trim() || pixForm.state.trim().length !== 2) {
        newErrors.state = 'UF é obrigatória (2 letras)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBlur = (field: string) => {
    const value = pixForm[field as keyof typeof pixForm] || '';
    const newErrors = { ...errors };

    if (field === 'name') {
      const nameParts = value.trim().split(/\s+/).filter(Boolean);
      if (!value.trim()) {
        newErrors.name = 'Nome completo é obrigatório';
      } else if (nameParts.length < 2) {
        newErrors.name = 'Por favor, digite seu nome e sobrenome';
      } else if (value.trim().length < 4) {
        newErrors.name = 'Nome completo deve ter pelo menos 4 caracteres';
      } else {
        delete newErrors.name;
      }
    }

    if (field === 'cpf') {
      const rawCpf = value.replace(/\D/g, '');
      if (!rawCpf) {
        newErrors.cpf = 'CPF ou CNPJ é obrigatório';
      } else if (rawCpf.length !== 11 && rawCpf.length !== 14) {
        newErrors.cpf = 'Insira um CPF ou CNPJ completo';
      } else if (!validateCpfOrCnpj(value)) {
        newErrors.cpf = 'CPF ou CNPJ inválido';
      } else {
        delete newErrors.cpf;
      }
    }

    if (field === 'phone') {
      const rawPhone = value.replace(/\D/g, '');
      if (!rawPhone) {
        newErrors.phone = 'Celular é obrigatório';
      } else if (rawPhone.length < 10 || rawPhone.length > 11) {
        newErrors.phone = 'Celular inválido (mínimo 10 dígitos com DDD)';
      } else {
        delete newErrors.phone;
      }
    }

    if (field === 'zip_code') {
      const rawCep = value.replace(/\D/g, '');
      if (!rawCep) {
        newErrors.zip_code = 'CEP é obrigatório';
      } else if (rawCep.length !== 8) {
        newErrors.zip_code = 'CEP deve ter 8 dígitos';
      } else {
        delete newErrors.zip_code;
      }
    }

    if (['street_name', 'number', 'neighborhood', 'city', 'state'].includes(field)) {
      if (!value.trim()) {
        newErrors[field] = 'Este campo é obrigatório';
      } else {
        delete newErrors[field];
      }
    }

    setErrors(newErrors);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPixForm(prev => ({ ...prev, name: e.target.value }))
    if (errors.name) setErrors(prev => {
      const copy = { ...prev }
      delete copy.name
      return copy
    })
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCPF(e.target.value)
    setPixForm(prev => ({ ...prev, cpf: masked }))
    if (errors.cpf) setErrors(prev => {
      const copy = { ...prev }
      delete copy.cpf
      return copy
    })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value)
    setPixForm(prev => ({ ...prev, phone: masked }))
    if (errors.phone) setErrors(prev => {
      const copy = { ...prev }
      delete copy.phone
      return copy
    })
  }

  useEffect(() => {
    syncFromStorage()
  }, [syncFromStorage])

  useEffect(() => {
    if (hasHydrated && !isLoggedIn) router.push('/login')
  }, [hasHydrated, isLoggedIn, router])

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCEP(e.target.value)
    let cep = masked.replace(/\D/g, '')
    setPixForm(prev => ({ ...prev, zip_code: masked }))
    if (errors.zip_code) setErrors(prev => {
      const copy = { ...prev }
      delete copy.zip_code
      return copy
    })

    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setPixForm(prev => ({
            ...prev,
            street_name: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || ''
          }))
          setErrors(prev => {
            const copy = { ...prev }
            delete copy.street_name
            delete copy.neighborhood
            delete copy.city
            delete copy.state
            return copy
          })
        } else {
          setErrors(prev => ({ ...prev, zip_code: 'CEP não encontrado' }))
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error)
      }
    }
  }

  const handlePixSubmit = async () => {
    if (!validateForm()) {
      return
    }
    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${config.apiUrl}/api/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          full_name: pixForm.name,
          document: pixForm.cpf.replace(/\D/g, ''),
          phone: pixForm.phone.replace(/\D/g, ''),
          street_name: pixForm.street_name,
          number: pixForm.number,
          complement: pixForm.complement,
          neighborhood: pixForm.neighborhood,
          city: pixForm.city,
          state: pixForm.state,
          zip_code: pixForm.zip_code.replace(/\D/g, '')
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
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', height: '100dvh', overflowY: 'auto', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; overflow: hidden; transform: translateY(-10px); }
          to { opacity: 1; max-height: 1000px; transform: translateY(0); }
        }
        body, html {
          touch-action: pan-y !important;
        }
        input, select, textarea {
          font-size: 16px !important;
        }
        .animate-fade-in {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-down {
          animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .checkout-container {
          max-width: 960px;
          margin: 0 auto;
          padding: 80px 32px 60px;
        }
        .checkout-main {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 64px;
          align-items: start;
        }
        .checkout-disclaimer {
          margin: 32px 0 0;
          font-size: 11px;
          color: #4b5563;
          line-height: 1.7;
          padding: 0 2px;
        }
        @media (max-width: 768px) {
          .checkout-container {
            padding: 32px 20px 60px;
          }
          .checkout-main {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .left-column-container {
            order: 2;
          }
          .right-column-container {
            order: 1;
          }
          .checkout-disclaimer {
            margin-top: 24px;
          }
        }
      `}</style>

      {/* Main Container */}
      <div className="animate-fade-in checkout-container" style={{ opacity: 0 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}
          >
            <ChevronLeft size={22} />
          </button>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px' }}>
            Checkout
          </h1>
        </div>

        {/* Main Grid */}
        <main className="checkout-main">

          {/* ── LEFT COLUMN ────────────────────────────────── */}
          <div className="left-column-container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Payment method label */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#e5e7eb' }}>Método de pagamento</span>

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
                Cartão
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
                    placeholder="Número do cartão"
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
                    placeholder="Data de expiração"
                    style={inputStyle}
                  />
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Código CVV"
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                {/* Personal Data Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={pixForm.name}
                      onChange={handleNameChange}
                      onBlur={() => handleBlur('name')}
                      style={{
                        ...inputStyle,
                        border: errors.name ? '1.5px solid #ef4444' : 'none'
                      }}
                    />
                    {errors.name && (
                      <span style={{ fontSize: 11, color: '#ef4444', paddingLeft: 4 }}>
                        {errors.name}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input
                      type="text"
                      placeholder="CPF ou CNPJ"
                      value={pixForm.cpf}
                      onChange={handleCpfChange}
                      onBlur={() => handleBlur('cpf')}
                      style={{
                        ...inputStyle,
                        border: errors.cpf ? '1.5px solid #ef4444' : 'none'
                      }}
                    />
                    {errors.cpf && (
                      <span style={{ fontSize: 11, color: '#ef4444', paddingLeft: 4 }}>
                        {errors.cpf}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input
                      type="text"
                      placeholder="Celular (com DDD)"
                      value={pixForm.phone}
                      onChange={handlePhoneChange}
                      onBlur={() => handleBlur('phone')}
                      style={{
                        ...inputStyle,
                        border: errors.phone ? '1.5px solid #ef4444' : 'none'
                      }}
                    />
                    {errors.phone && (
                      <span style={{ fontSize: 11, color: '#ef4444', paddingLeft: 4 }}>
                        {errors.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Billing Address Header */}
                <div style={{ marginTop: 8 }}>
                  <p style={{
                    margin: '0',
                    fontSize: 13,
                    color: isPersonalDataComplete ? '#9ca3af' : '#4b5563',
                    fontWeight: 500,
                    paddingLeft: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'color 0.3s ease'
                  }}>
                    <span>Endereço de Cobrança</span>

                  </p>
                </div>

                {/* Billing Address - Shows only when personal data is complete, with animation */}
                {isPersonalDataComplete && (
                  <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 4 }}>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <input
                          type="text"
                          placeholder="CEP"
                          value={pixForm.zip_code}
                          onChange={handleCepChange}
                          onBlur={() => handleBlur('zip_code')}
                          maxLength={9}
                          style={{
                            ...inputStyle,
                            border: errors.zip_code ? '1.5px solid #ef4444' : 'none'
                          }}
                        />
                        {errors.zip_code && (
                          <span style={{ fontSize: 11, color: '#ef4444', paddingLeft: 4 }}>
                            {errors.zip_code}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <input
                          type="text"
                          placeholder="Rua / Logradouro"
                          value={pixForm.street_name}
                          onChange={e => {
                            setPixForm({ ...pixForm, street_name: e.target.value })
                            if (errors.street_name) setErrors(prev => {
                              const copy = { ...prev }
                              delete copy.street_name
                              return copy
                            })
                          }}
                          onBlur={() => handleBlur('street_name')}
                          style={{
                            ...inputStyle,
                            border: errors.street_name ? '1.5px solid #ef4444' : 'none'
                          }}
                        />
                        {errors.street_name && (
                          <span style={{ fontSize: 11, color: '#ef4444', paddingLeft: 4 }}>
                            {errors.street_name}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <input
                            type="text"
                            placeholder="Número"
                            value={pixForm.number}
                            onChange={e => {
                              setPixForm({ ...pixForm, number: e.target.value })
                              if (errors.number) setErrors(prev => {
                                const copy = { ...prev }
                                delete copy.number
                                return copy
                              })
                            }}
                            onBlur={() => handleBlur('number')}
                            style={{
                              ...inputStyle,
                              border: errors.number ? '1.5px solid #ef4444' : 'none'
                            }}
                          />
                          {errors.number && (
                            <span style={{ fontSize: 11, color: '#ef4444', paddingLeft: 4 }}>
                              {errors.number}
                            </span>
                          )}
                        </div>

                        <input
                          type="text"
                          placeholder="Complemento"
                          value={pixForm.complement}
                          onChange={e => setPixForm({ ...pixForm, complement: e.target.value })}
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <input
                          type="text"
                          placeholder="Bairro"
                          value={pixForm.neighborhood}
                          onChange={e => {
                            setPixForm({ ...pixForm, neighborhood: e.target.value })
                            if (errors.neighborhood) setErrors(prev => {
                              const copy = { ...prev }
                              delete copy.neighborhood
                              return copy
                            })
                          }}
                          onBlur={() => handleBlur('neighborhood')}
                          style={{
                            ...inputStyle,
                            border: errors.neighborhood ? '1.5px solid #ef4444' : 'none'
                          }}
                        />
                        {errors.neighborhood && (
                          <span style={{ fontSize: 11, color: '#ef4444', paddingLeft: 4 }}>
                            {errors.neighborhood}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <input
                            type="text"
                            placeholder="Cidade"
                            value={pixForm.city}
                            onChange={e => {
                              setPixForm({ ...pixForm, city: e.target.value })
                              if (errors.city) setErrors(prev => {
                                const copy = { ...prev }
                                delete copy.city
                                return copy
                              })
                            }}
                            onBlur={() => handleBlur('city')}
                            style={{
                              ...inputStyle,
                              border: errors.city ? '1.5px solid #ef4444' : 'none'
                            }}
                          />
                          {errors.city && (
                            <span style={{ fontSize: 11, color: '#ef4444', paddingLeft: 4 }}>
                              {errors.city}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <input
                            type="text"
                            placeholder="UF"
                            value={pixForm.state}
                            onChange={e => {
                              setPixForm({ ...pixForm, state: e.target.value })
                              if (errors.state) setErrors(prev => {
                                const copy = { ...prev }
                                delete copy.state
                                return copy
                              })
                            }}
                            onBlur={() => handleBlur('state')}
                            maxLength={2}
                            style={{
                              ...inputStyle,
                              border: errors.state ? '1.5px solid #ef4444' : 'none'
                            }}
                          />
                          {errors.state && (
                            <span style={{ fontSize: 11, color: '#ef4444', paddingLeft: 4 }}>
                              {errors.state}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR code notice */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 4px 4px' }}>
                  <div style={{
                    width: 36, height: 36, border: '2px solid #4b5563',
                    borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {/* QR corners */}
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="1" y="1" width="7" height="7" rx="1" stroke="#9ca3af" strokeWidth="1.5" fill="none" />
                      <rect x="12" y="1" width="7" height="7" rx="1" stroke="#9ca3af" strokeWidth="1.5" fill="none" />
                      <rect x="1" y="12" width="7" height="7" rx="1" stroke="#9ca3af" strokeWidth="1.5" fill="none" />
                      <rect x="3" y="3" width="3" height="3" fill="#9ca3af" />
                      <rect x="14" y="3" width="3" height="3" fill="#9ca3af" />
                      <rect x="3" y="14" width="3" height="3" fill="#9ca3af" />
                      <line x1="12" y1="12" x2="19" y2="12" stroke="#9ca3af" strokeWidth="1.5" />
                      <line x1="12" y1="15" x2="15" y2="15" stroke="#9ca3af" strokeWidth="1.5" />
                      <line x1="17" y1="15" x2="19" y2="15" stroke="#9ca3af" strokeWidth="1.5" />
                      <line x1="12" y1="18" x2="19" y2="18" stroke="#9ca3af" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>
                    Você verá um código QR para escanear e concluir sua compra.
                  </p>
                </div>


              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ───────────────────────────────── */}
        <div className="right-column-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

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
              O que está incluído
            </p>

            {/* Features list */}
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedPlan.features.map(({ text, color }, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#d1d5db' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color || '#5c5cfc', flexShrink: 0 }} />
                  {text}
                </li>
              ))}
            </ul>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #2a2a2a', margin: '24px 0 16px' }} />

            {/* Price breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#9ca3af' }}>
                <span>{selectedPlan.id === 3 ? 'Assinatura anual' : 'Assinatura mensal'}</span>
                <span style={{ color: '#d1d5db' }}>R${selectedPlan.price.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#9ca3af' }}>
                <span>Impostos estimados</span>
                <span style={{ color: '#d1d5db' }}>R$0,00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 6 }}>
                <span>Total hoje</span>
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
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : (pixData ? 'Aguardando Pagamento...' : 'Assinar agora')}
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
                  <img src={pixData.qrcode} alt="Pix QR Code" style={{ width: 200, height: 200, display: 'block' }} />
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

          </div>
        </main>

        {/* Footer disclaimer */}
        <p className="checkout-disclaimer">
          Renova {selectedPlan.id === 3 ? 'anualmente' : 'mensalmente'} até ser cancelado. R${selectedPlan.price.toFixed(2)}/{selectedPlan.id === 3 ? 'ano' : 'mês'} serão cobrados.{' '}
          Cancele a qualquer momento{' '}
          nas Configurações. Ao assinar, você concorda com nossos{' '}
          Termos de Uso{' '}
          e{' '}
          Termos de Crédito de Serviço
          , leu nossa{' '}
          Política de Privacidade
          , e autoriza a ScreenAI a armazenar e cobrar seu método de pagamento.
        </p>
      </div>
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
