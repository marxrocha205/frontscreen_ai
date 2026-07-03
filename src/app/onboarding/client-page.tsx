"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

const COUNTRIES = [
  { code: 'BR', name: 'Brasil', dial: '+55', flag: '🇧🇷', mask: '(##) #####-####' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸', mask: '(###) ###-####' },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹', mask: '## ### ####' },
  { code: 'ES', name: 'España', dial: '+34', flag: '🇪🇸', mask: '### ### ###' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧', mask: '#### ######' },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷', mask: '(###) ###-####' },
  { code: 'MX', name: 'México', dial: '+52', flag: '🇲🇽', mask: '## #### ####' },
  { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴', mask: '### ### ####' },
  { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱', mask: '# #### ####' },
  { code: 'PE', name: 'Perú', dial: '+51', flag: '🇵🇪', mask: '### ### ###' },
  { code: 'UY', name: 'Uruguay', dial: '+598', flag: '🇺🇾', mask: '## ### ###' },
  { code: 'PY', name: 'Paraguay', dial: '+595', flag: '🇵🇾', mask: '## #######' },
  { code: 'BO', name: 'Bolivia', dial: '+591', flag: '🇧🇴', mask: '########' },
  { code: 'VE', name: 'Venezuela', dial: '+58', flag: '🇻🇪', mask: '###-###-####' },
  { code: 'EC', name: 'Ecuador', dial: '+593', flag: '🇪🇨', mask: '## ### ####' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷', mask: '## ## ## ## ##' },
  { code: 'DE', name: 'Deutschland', dial: '+49', flag: '🇩🇪', mask: '### ### ####' },
  { code: 'IT', name: 'Italia', dial: '+39', flag: '🇮🇹', mask: '### #### ###' },
  { code: 'JP', name: '日本', dial: '+81', flag: '🇯🇵', mask: '##-####-####' },
  { code: 'CN', name: '中国', dial: '+86', flag: '🇨🇳', mask: '### #### ####' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳', mask: '#####-#####' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺', mask: '### ### ###' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦', mask: '(###) ###-####' },
]

function applyMask(digits: string, mask: string): string {
  let result = ''
  let digitIndex = 0
  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    if (mask[i] === '#') {
      result += digits[digitIndex++]
    } else {
      result += mask[i]
    }
  }
  return result
}

export default function OnboardingClient() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; phone?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (isDropdownOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [isDropdownOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    setPhone(applyMask(raw, selectedCountry.mask))
  }

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country)
    setPhone('')
    setIsDropdownOpen(false)
    setSearch('')
  }

  const validate = () => {
    const errs: typeof errors = {}
    if (!firstName.trim()) errs.firstName = 'Informe seu nome'
    if (!lastName.trim()) errs.lastName = 'Informe seu sobrenome'
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 7) errs.phone = 'Número inválido'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setIsLoading(true)

    // Salva localmente para uso imediato (Gemini Live prompt)
    const fullName = `${firstName.trim()} ${lastName.trim()}`
    localStorage.setItem('user_first_name', firstName.trim())
    localStorage.setItem('user_last_name', lastName.trim())
    localStorage.setItem('user_phone', `${selectedCountry.dial} ${phone}`)

    // Persiste no banco de dados
    try {
      const token = localStorage.getItem('access_token')
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            full_name: fullName,
            phone: `${selectedCountry.dial} ${phone}`
          })
        })
      }
    } catch (err) {
      console.error('[ONBOARDING] Falha ao salvar perfil na API:', err)
      // Não bloqueamos o usuário por erro de API — o dado já está no localStorage
    }

    router.push('/app')
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950">

      <div className="relative flex flex-col items-center gap-6 w-full max-w-sm px-4 animate-enter-fade-zoom">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img src="/logobranco-semfundo.png" alt="ScreenAI" className="h-14 w-auto object-contain drop-shadow-md" />
        </div>

        <div className="text-center space-y-2 mb-2">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Antes de começar
          </h1>
          <p className="text-sm text-zinc-400 max-w-[280px] leading-relaxed mx-auto">
            Queremos te conhecer melhor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-3">

          {/* First + Last Name */}
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Nome"
                value={firstName}
                maxLength={20}
                onChange={e => { setFirstName(e.target.value); setErrors(prev => ({ ...prev, firstName: undefined })) }}
                className={`w-full bg-zinc-900 border text-zinc-300 placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors focus:border-zinc-600 h-11 ${errors.firstName ? 'border-red-500/60' : 'border-zinc-800'}`}
              />
              {errors.firstName && <p className="text-red-400 text-xs mt-1 ml-0.5">{errors.firstName}</p>}
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Sobrenome"
                value={lastName}
                maxLength={20}
                onChange={e => { setLastName(e.target.value); setErrors(prev => ({ ...prev, lastName: undefined })) }}
                className={`w-full bg-zinc-900 border text-zinc-300 placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors focus:border-zinc-600 h-11 ${errors.lastName ? 'border-red-500/60' : 'border-zinc-800'}`}
              />
              {errors.lastName && <p className="text-red-400 text-xs mt-1 ml-0.5">{errors.lastName}</p>}
            </div>
          </div>

          {/* Phone */}
          <div>
            <div className={`flex border rounded-lg bg-zinc-900 transition-colors focus-within:border-zinc-600 ${errors.phone ? 'border-red-500/60' : 'border-zinc-800'}`}>
              {/* Country selector */}
              <div ref={dropdownRef} className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(o => !o)}
                  className="flex items-center gap-1.5 px-3 h-11 text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors border-r border-zinc-800 min-w-[96px] rounded-l-lg"
                >
                  <span className="text-base leading-none">{selectedCountry.flag}</span>
                  <span className="text-zinc-400 text-xs font-mono">{selectedCountry.dial}</span>
                  <ChevronDown className={`w-3 h-3 text-zinc-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 z-50 mt-1 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-zinc-800">
                      <input
                        ref={searchRef}
                        type="text"
                        placeholder="Buscar país..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-zinc-800 text-white text-xs placeholder-zinc-500 rounded-lg px-3 py-2 outline-none"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {filtered.map(c => (
                        <button
                          key={c.code + c.dial}
                          type="button"
                          onClick={() => handleCountrySelect(c)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-zinc-800 transition-colors text-left ${selectedCountry.code === c.code ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
                        >
                          <span className="text-base">{c.flag}</span>
                          <span className="flex-1 truncate">{c.name}</span>
                          <span className="text-zinc-600 font-mono">{c.dial}</span>
                        </button>
                      ))}
                      {filtered.length === 0 && (
                        <p className="text-zinc-600 text-xs text-center py-4">Nenhum país encontrado</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Phone number */}
              <input
                type="tel"
                placeholder={selectedCountry.mask.replace(/#/g, '0')}
                value={phone}
                onChange={handlePhoneChange}
                className="flex-1 bg-transparent text-zinc-300 placeholder-zinc-500 px-3 py-2.5 text-sm outline-none min-w-0 h-11 rounded-r-lg"
              />
            </div>
            {errors.phone && <p className="text-red-400 text-xs mt-1 ml-0.5">{errors.phone}</p>}
          </div>

          {/* Submit */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium py-2.5 rounded-lg text-sm transition-all active:scale-[0.98] h-11 disabled:opacity-60"
            >
              {isLoading ? 'Salvando...' : 'Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
