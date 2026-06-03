"use client"

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { ChevronLeft, Loader2, Zap, Paperclip, Image as ImageIcon, Brain, CreditCard, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { config } from '@/lib/config'
import { useI18n } from '@/context/i18n-context'
import { StripeCardForm } from './StripeCardForm'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js'

/* ─── Plan data ─────────────────────────────────────────── */
import { Language } from '@/locales'

type CheckoutPlan = {
  id: number
  name: string
  price: number
  features: { text: string; Icon: typeof Zap; color: string }[]
}

const getCheckoutPlans = (language: Language): CheckoutPlan[] => {
  switch (language) {
    case 'pt-BR':
      return [
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
    case 'es-ES':
      return [
        {
          id: 2,
          name: 'Plan PRO Mensual',
          price: 19.90,
          features: [
            { text: 'Respuestas más inteligentes y rápidas', Icon: Zap, color: '#3b82f6' },
            { text: 'Tokens ilimitados y sin interrupciones', Icon: Paperclip, color: '#3b82f6' },
            { text: 'Acceso a ScreenAI, Gemini y GPT-5', Icon: ImageIcon, color: '#818cf8' },
            { text: 'Historial completo entre sesiones', Icon: Brain, color: '#818cf8' },
          ],
        },
        {
          id: 3,
          name: 'Plan PRO Anual',
          price: 149.90,
          features: [
            { text: 'Todo lo de PRO y mucho más', Icon: Zap, color: '#3b82f6' },
            { text: 'Ventana de contexto gigante', Icon: Paperclip, color: '#3b82f6' },
            { text: 'Multi-IA Simultánea (Claude/GPT/Gemini)', Icon: ImageIcon, color: '#818cf8' },
            { text: 'Soporte técnico prioritario 24h', Icon: Brain, color: '#818cf8' },
          ],
        },
      ]
    case 'en-US':
    default:
      return [
        {
          id: 2,
          name: 'PRO Monthly Plan',
          price: 19.90,
          features: [
            { text: 'Smarter and faster responses', Icon: Zap, color: '#3b82f6' },
            { text: 'Unlimited tokens with no interruptions', Icon: Paperclip, color: '#3b82f6' },
            { text: 'Access to ScreenAI, Gemini, and GPT-5', Icon: ImageIcon, color: '#818cf8' },
            { text: 'Full history across sessions', Icon: Brain, color: '#818cf8' },
          ],
        },
        {
          id: 3,
          name: 'PRO Annual Plan',
          price: 149.90,
          features: [
            { text: 'Everything in PRO and much more', Icon: Zap, color: '#3b82f6' },
            { text: 'Giant context window', Icon: Paperclip, color: '#3b82f6' },
            { text: 'Simultaneous multi-AI (Claude/GPT/Gemini)', Icon: ImageIcon, color: '#818cf8' },
            { text: 'Priority 24/7 technical support', Icon: Brain, color: '#818cf8' },
          ],
        },
      ]
  }
}

/* ─── Multi-currency pricing ─────────────────────────────── */
type CurrencyCode = 'BRL' | 'EUR' | 'USD'

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  BRL: 'R$',
  EUR: '€',
  USD: '$',
}

const CARD_PRICES: Record<number, Record<CurrencyCode, number>> = {
  2: { BRL: 97.90, EUR: 19.90, USD: 19.90 },
  3: { BRL: 797.90, EUR: 149.90, USD: 149.90 },
}

/* ─── Stripe Element Styles (tema escuro) ───────────────── */
const STRIPE_ELEMENT_STYLE = {
  base: {
    fontSize: '16px',
    color: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSmoothing: 'antialiased',
    '::placeholder': { color: '#6b7280' },
  },
  invalid: {
    color: '#ef4444',
    iconColor: '#ef4444',
  },
}

/* ─── Pix official icon ─────────────────────────────────── */
const checkoutCopy = {
  'pt-BR': {
    paymentMethod: 'Método de pagamento',
    card: 'Cartão',
    cardNumber: 'Número do cartão',
    expiration: 'Data de expiração',
    cvv: 'Código CVV',
    fullName: 'Nome completo',
    document: 'CPF ou CNPJ',
    phone: 'Celular (com DDD)',
    billingAddress: 'Endereço de Cobrança',
    zip: 'CEP',
    street: 'Rua / Logradouro',
    number: 'Número',
    complement: 'Complemento',
    neighborhood: 'Bairro',
    city: 'Cidade',
    state: 'UF',
    qrNotice: 'Você verá um código QR para escanear e concluir sua compra.',
    included: 'O que está incluído',
    annualSubscription: 'Assinatura anual',
    monthlySubscription: 'Assinatura mensal',
    estimatedTaxes: 'Impostos estimados',
    totalToday: 'Total hoje',
    subscribeNow: 'Assinar agora',
    waitingPayment: 'Aguardando Pagamento...',
    copyPix: 'Copiar Código Pix',
    pixCopied: 'Código Pix copiado!',
    pixActivated: 'Após o pagamento, sua conta será ativada automaticamente em instantes.',
    paymentError: 'Erro ao gerar pagamento.',
    connectionError: 'Erro de conexão com o servidor.',
    footer: (plan: CheckoutPlan) => `Renova ${plan.id === 3 ? 'anualmente' : 'mensalmente'} até ser cancelado. R$${plan.price.toFixed(2)}/${plan.id === 3 ? 'ano' : 'mês'} serão cobrados. Cancele a qualquer momento nas Configurações. Ao assinar, você concorda com nossos Termos de Uso e Termos de Crédito de Serviço, leu nossa Política de Privacidade, e autoriza a ScreenAI a armazenar e cobrar seu método de pagamento.`,
    errors: {
      fullNameRequired: 'Nome completo é obrigatório',
      firstLastName: 'Por favor, digite seu nome e sobrenome',
      fullNameLength: 'Nome completo deve ter pelo menos 4 caracteres',
      documentRequired: 'CPF ou CNPJ é obrigatório',
      documentComplete: 'Insira um CPF (11 dígitos) ou CNPJ (14 dígitos) completo',
      documentCompleteShort: 'Insira um CPF ou CNPJ completo',
      documentInvalid: 'CPF ou CNPJ inválido',
      phoneRequired: 'Celular é obrigatório',
      phoneInvalid: 'Celular inválido (mínimo 10 dígitos com DDD)',
      zipRequired: 'CEP é obrigatório',
      zipLength: 'CEP deve ter 8 dígitos',
      streetRequired: 'Logradouro é obrigatório',
      numberRequired: 'Número é obrigatório',
      neighborhoodRequired: 'Bairro é obrigatório',
      cityRequired: 'Cidade é obrigatória',
      stateRequired: 'UF é obrigatória (2 letras)',
      fieldRequired: 'Este campo é obrigatório',
      zipNotFound: 'CEP não encontrado',
    },
  },
  'en-US': {
    paymentMethod: 'Payment method',
    card: 'Card',
    cardNumber: 'Card number',
    expiration: 'Expiration date',
    cvv: 'CVV code',
    fullName: 'Full name',
    document: 'CPF or CNPJ',
    phone: 'Mobile phone (with area code)',
    billingAddress: 'Billing Address',
    zip: 'ZIP code',
    street: 'Street / Address',
    number: 'Number',
    complement: 'Complement',
    neighborhood: 'Neighborhood',
    city: 'City',
    state: 'State',
    qrNotice: 'You will see a QR code to scan and complete your purchase.',
    included: 'What is included',
    annualSubscription: 'Annual subscription',
    monthlySubscription: 'Monthly subscription',
    estimatedTaxes: 'Estimated taxes',
    totalToday: 'Total today',
    subscribeNow: 'Subscribe now',
    waitingPayment: 'Waiting for payment...',
    copyPix: 'Copy Pix Code',
    pixCopied: 'Pix code copied!',
    pixActivated: 'After payment, your account will be activated automatically in a few moments.',
    paymentError: 'Error generating payment.',
    connectionError: 'Connection error with the server.',
    footer: (plan: CheckoutPlan) => `Renews ${plan.id === 3 ? 'annually' : 'monthly'} until canceled. R$${plan.price.toFixed(2)}/${plan.id === 3 ? 'year' : 'month'} will be charged. Cancel anytime in Settings. By subscribing, you agree to our Terms of Use and Service Credit Terms, acknowledge our Privacy Policy, and authorize ScreenAI to store and charge your payment method.`,
    errors: {
      fullNameRequired: 'Full name is required',
      firstLastName: 'Please enter your first and last name',
      fullNameLength: 'Full name must be at least 4 characters',
      documentRequired: 'CPF or CNPJ is required',
      documentComplete: 'Enter a complete CPF (11 digits) or CNPJ (14 digits)',
      documentCompleteShort: 'Enter a complete CPF or CNPJ',
      documentInvalid: 'Invalid CPF or CNPJ',
      phoneRequired: 'Mobile phone is required',
      phoneInvalid: 'Invalid mobile phone (at least 10 digits with area code)',
      zipRequired: 'ZIP code is required',
      zipLength: 'ZIP code must have 8 digits',
      streetRequired: 'Street is required',
      numberRequired: 'Number is required',
      neighborhoodRequired: 'Neighborhood is required',
      cityRequired: 'City is required',
      stateRequired: 'State is required (2 letters)',
      fieldRequired: 'This field is required',
      zipNotFound: 'ZIP code not found',
    },
  },
  'es-ES': {
    paymentMethod: 'Método de pago',
    card: 'Tarjeta',
    cardNumber: 'Número de tarjeta',
    expiration: 'Fecha de caducidad',
    cvv: 'Código CVV',
    fullName: 'Nombre completo',
    document: 'Documento (DNI/NIF/NIE)',
    phone: 'Teléfono móvil',
    billingAddress: 'Dirección de facturación',
    zip: 'Código Postal',
    street: 'Calle / Dirección',
    number: 'Número',
    complement: 'Complemento',
    neighborhood: 'Barrio',
    city: 'Ciudad',
    state: 'Estado/Provincia',
    qrNotice: 'Verás un código QR para escanear y completar tu compra.',
    included: 'Qué incluye',
    annualSubscription: 'Suscripción anual',
    monthlySubscription: 'Suscripción mensual',
    estimatedTaxes: 'Impuestos estimados',
    totalToday: 'Total hoy',
    subscribeNow: 'Suscribirse ahora',
    waitingPayment: 'Esperando pago...',
    copyPix: 'Copiar código Pix',
    pixCopied: '¡Código Pix copiado!',
    pixActivated: 'Después del pago, tu cuenta se activará automáticamente en unos momentos.',
    paymentError: 'Error al generar el pago.',
    connectionError: 'Error de conexión con el servidor.',
    footer: (plan: CheckoutPlan) => `Se renueva ${plan.id === 3 ? 'anualmente' : 'mensualmente'} hasta que se cancele. Se cobrarán ${CURRENCY_SYMBOLS['EUR']}${plan.price.toFixed(2)} al ${plan.id === 3 ? 'año' : 'mes'}. Cancela en cualquier momento en Configuración. Al suscribirte, aceptas nuestros Términos de uso y Políticas de privacidad.`,
    errors: {
      fullNameRequired: 'El nombre completo es obligatorio',
      firstLastName: 'Por favor, introduce tu nombre y apellido',
      fullNameLength: 'El nombre completo debe tener al menos 4 caracteres',
      documentRequired: 'El documento es obligatorio',
      documentComplete: 'Introduce un documento completo',
      documentCompleteShort: 'Introduce un documento completo',
      documentInvalid: 'Documento no válido',
      phoneRequired: 'El teléfono es obligatorio',
      phoneInvalid: 'Teléfono no válido',
      zipRequired: 'El código postal es obligatorio',
      zipLength: 'El código postal debe ser válido',
      streetRequired: 'La calle es obligatoria',
      numberRequired: 'El número es obligatorio',
      neighborhoodRequired: 'El barrio es obligatorio',
      cityRequired: 'La ciudad es obligatoria',
      stateRequired: 'El estado es obligatorio',
      fieldRequired: 'Este campo es obligatorio',
      zipNotFound: 'Código postal no encontrado',
    },
  },
}

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
  const { language } = useI18n()
  const { hasHydrated, isLoggedIn, syncFromStorage } = useAuth()
  const plans = getCheckoutPlans(language)
  const copy = checkoutCopy[language]

  const planId = searchParams.get('plan')
  const selectedPlan = plans.find(p => p.id === Number(planId)) || plans[0]

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card')
  const [isLoading, setIsLoading] = useState(false)
  const currency: CurrencyCode = language === 'pt-BR' ? 'BRL' : (language === 'es-ES' ? 'EUR' : 'USD')

  const [cardNumberComplete, setCardNumberComplete] = useState(false)
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false)
  const [cardCvcComplete, setCardCvcComplete] = useState(false)

  // Formulário de dados pessoais para Cartão (mesmos campos do PIX)
  const [cardForm, setCardForm] = useState({
    name: '',
    cpf: '',
    phone: '',
    zip_code: '',
    street_name: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  })

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

  // Preço exibido baseado na moeda selecionada (para cartão) ou BRL (para PIX)
  const displayPrice = paymentMethod === 'card'
    ? (CARD_PRICES[selectedPlan.id]?.[currency] ?? selectedPlan.price)
    : selectedPlan.price
  const displaySymbol = paymentMethod === 'card' ? CURRENCY_SYMBOLS[currency] : 'R$'

  const isCardComplete = cardNumberComplete && cardExpiryComplete && cardCvcComplete

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
      newErrors.name = copy.errors.fullNameRequired
    } else if (nameParts.length < 2) {
      newErrors.name = copy.errors.firstLastName
    } else if (pixForm.name.trim().length < 4) {
      newErrors.name = copy.errors.fullNameLength
    }

    const rawCpf = pixForm.cpf.replace(/\D/g, '')
    if (!rawCpf) {
      newErrors.cpf = copy.errors.documentRequired
    } else if (rawCpf.length !== 11 && rawCpf.length !== 14) {
      newErrors.cpf = copy.errors.documentComplete
    } else if (!validateCpfOrCnpj(pixForm.cpf)) {
      newErrors.cpf = copy.errors.documentInvalid
    }

    const rawPhone = pixForm.phone.replace(/\D/g, '')
    if (!rawPhone) {
      newErrors.phone = copy.errors.phoneRequired
    } else if (rawPhone.length < 10 || rawPhone.length > 11) {
      newErrors.phone = copy.errors.phoneInvalid
    }

    if (isPersonalDataComplete) {
      const rawCep = pixForm.zip_code.replace(/\D/g, '')
      if (!rawCep) {
        newErrors.zip_code = copy.errors.zipRequired
      } else if (rawCep.length !== 8) {
        newErrors.zip_code = copy.errors.zipLength
      }
      if (!pixForm.street_name.trim()) {
        newErrors.street_name = copy.errors.streetRequired
      }
      if (!pixForm.number.trim()) {
        newErrors.number = copy.errors.numberRequired
      }
      if (!pixForm.neighborhood.trim()) {
        newErrors.neighborhood = copy.errors.neighborhoodRequired
      }
      if (!pixForm.city.trim()) {
        newErrors.city = copy.errors.cityRequired
      }
      if (!pixForm.state.trim() || pixForm.state.trim().length !== 2) {
        newErrors.state = copy.errors.stateRequired
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
        newErrors.name = copy.errors.fullNameRequired;
      } else if (nameParts.length < 2) {
        newErrors.name = copy.errors.firstLastName;
      } else if (value.trim().length < 4) {
        newErrors.name = copy.errors.fullNameLength;
      } else {
        delete newErrors.name;
      }
    }

    if (field === 'cpf') {
      const rawCpf = value.replace(/\D/g, '');
      if (!rawCpf) {
        newErrors.cpf = copy.errors.documentRequired;
      } else if (rawCpf.length !== 11 && rawCpf.length !== 14) {
        newErrors.cpf = copy.errors.documentCompleteShort;
      } else if (!validateCpfOrCnpj(value)) {
        newErrors.cpf = copy.errors.documentInvalid;
      } else {
        delete newErrors.cpf;
      }
    }

    if (field === 'phone') {
      const rawPhone = value.replace(/\D/g, '');
      if (!rawPhone) {
        newErrors.phone = copy.errors.phoneRequired;
      } else if (rawPhone.length < 10 || rawPhone.length > 11) {
        newErrors.phone = copy.errors.phoneInvalid;
      } else {
        delete newErrors.phone;
      }
    }

    if (field === 'zip_code') {
      const rawCep = value.replace(/\D/g, '');
      if (!rawCep) {
        newErrors.zip_code = copy.errors.zipRequired;
      } else if (rawCep.length !== 8) {
        newErrors.zip_code = copy.errors.zipLength;
      } else {
        delete newErrors.zip_code;
      }
    }

    if (['street_name', 'number', 'neighborhood', 'city', 'state'].includes(field)) {
      if (!value.trim()) {
        newErrors[field] = copy.errors.fieldRequired;
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
    if (hasHydrated && !isLoggedIn) {
      const returnUrl = `/checkout?plan=${planId}`
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
    }
  }, [hasHydrated, isLoggedIn, router, planId])

  useEffect(() => {
    if (hasHydrated) {
      console.log(`[Checkout] Idioma detectado: ${language} | Moeda aplicada: ${currency}`)
    }
  }, [hasHydrated, language, currency])

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>, formType: 'pix' | 'card' = 'pix') => {
    const masked = maskCEP(e.target.value)
    const cep = masked.replace(/\D/g, '')

    if (formType === 'card') {
      setCardForm(prev => ({ ...prev, zip_code: masked }))
    } else {
      setPixForm(prev => ({ ...prev, zip_code: masked }))
    }

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
          const addressData = {
            street_name: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '',
          }
          if (formType === 'card') {
            setCardForm(prev => ({ ...prev, ...addressData }))
          } else {
            setPixForm(prev => ({ ...prev, ...addressData }))
          }
          setErrors(prev => {
            const copy = { ...prev }
            delete copy.street_name
            delete copy.neighborhood
            delete copy.city
            delete copy.state
            return copy
          })
        } else {
          setErrors(prev => ({ ...prev, zip_code: copy.errors.zipNotFound }))
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error)
      }
    }
  }

  /* ── Handler: Pagamento PIX ── */
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
        alert(data.detail || copy.paymentError)
      }
    } catch {
      alert(copy.connectionError)
    } finally {
      setIsLoading(false)
    }
  }

  
  // O processamento de cartão agora ocorre totalmente dentro de <StripeCardForm />
  // handleCardSubmit e estados relacionados foram delegados.
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
              <span style={{ fontSize: 14, fontWeight: 500, color: '#e5e7eb' }}>{copy.paymentMethod}</span>

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
                {copy.card}
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

            
            {/* ── CARD FIELDS (Stripe PaymentElement) ── */}
            {paymentMethod === 'card' && (
              <div style={{ marginTop: 4 }}>
                <StripeCardForm 
                  planId={selectedPlan.id} 
                  currency={currency} 
                  language={language} 
                />
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
                      placeholder={copy.fullName}
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
                      placeholder={copy.document}
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
                      placeholder={copy.phone}
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
                    <span>{copy.billingAddress}</span>

                  </p>
                </div>

                {/* Billing Address - Shows only when personal data is complete, with animation */}
                {isPersonalDataComplete && (
                  <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 4 }}>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <input
                          type="text"
                          placeholder={copy.zip}
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
                          placeholder={copy.street}
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
                            placeholder={copy.number}
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
                          placeholder={copy.complement}
                          value={pixForm.complement}
                          onChange={e => setPixForm({ ...pixForm, complement: e.target.value })}
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <input
                          type="text"
                          placeholder={copy.neighborhood}
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
                            placeholder={copy.city}
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
                            placeholder={copy.state}
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
                    {copy.qrNotice}
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
              {copy.included}
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
                <span>{selectedPlan.id === 3 ? copy.annualSubscription : copy.monthlySubscription}</span>
                <span style={{ color: '#d1d5db' }}>{displaySymbol}{displayPrice.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#9ca3af' }}>
                <span>{copy.estimatedTaxes}</span>
                <span style={{ color: '#d1d5db' }}>{displaySymbol}0,00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 6 }}>
                <span>{copy.totalToday}</span>
                <span>{displaySymbol}{displayPrice.toFixed(2)}</span>
              </div>
            </div>

            
            {/* Subscribe button (Apenas para PIX, pois Cartão tem seu próprio botão) */}
            {paymentMethod === 'pix' && (
              <button
                onClick={handlePixSubmit}
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
                  gap: 8,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isLoading && !pixData) (e.currentTarget as HTMLButtonElement).style.background = '#4848e8' }}
                onMouseLeave={e => { if (!pixData) (e.currentTarget as HTMLButtonElement).style.background = '#5c5cfc' }}
              >
                {isLoading
                  ? <Loader2 size={20} className="animate-spin" />
                  : pixData
                    ? copy.waitingPayment
                    : copy.subscribeNow
                }
              </button>
            )}

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
                    alert(copy.pixCopied)
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
                  {copy.copyPix}
                </button>
                <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', margin: 0 }}>
                  {copy.pixActivated}
                </p>
              </div>
            )}
          </div>

          </div>
        </main>

        {/* Footer disclaimer */}
        <p className="checkout-disclaimer">{copy.footer(selectedPlan)}</p>
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
