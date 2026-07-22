"use client"

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { useI18n } from '@/context/i18n-context'

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

function applyMask(value: string, mask: string): string {
  const digits = value.replace(/\D/g, '')
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

interface OnboardingFormProps {
  onComplete: (data: { firstName: string; lastName: string; phone: string; countryDial: string }) => void
}

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const { t } = useI18n()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; phone?: string }>({})
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
    if (!firstName.trim()) errs.firstName = t('onboarding.error_first_name')
    if (!lastName.trim()) errs.lastName = t('onboarding.error_last_name')
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 7) errs.phone = t('onboarding.error_phone')
    return errs
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onComplete({ firstName: firstName.trim(), lastName: lastName.trim(), phone, countryDial: selectedCountry.dial })
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#080808] flex items-center justify-center px-4">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-12 text-center">
          <span className="text-white text-xl font-semibold tracking-tight">Screen<span className="text-zinc-500">AI</span></span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="mb-8">
            <h1 className="text-white text-2xl font-semibold tracking-tight">{t('onboarding.title')}</h1>
            <p className="text-zinc-500 text-sm mt-1.5">{t('onboarding.subtitle')}</p>
          </div>

          {/* First + Last Name row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t('onboarding.first_name')}
                value={firstName}
                onChange={e => { setFirstName(e.target.value); setErrors(prev => ({ ...prev, firstName: undefined })) }}
                className={`w-full bg-zinc-900/60 border text-white placeholder-zinc-600 rounded-xl px-4 py-3.5 text-sm outline-none transition-colors focus:border-zinc-500 ${errors.firstName ? 'border-red-500/60' : 'border-zinc-800'}`}
              />
              {errors.firstName && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.firstName}</p>}
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder={t('onboarding.last_name')}
                value={lastName}
                onChange={e => { setLastName(e.target.value); setErrors(prev => ({ ...prev, lastName: undefined })) }}
                className={`w-full bg-zinc-900/60 border text-white placeholder-zinc-600 rounded-xl px-4 py-3.5 text-sm outline-none transition-colors focus:border-zinc-500 ${errors.lastName ? 'border-red-500/60' : 'border-zinc-800'}`}
              />
              {errors.lastName && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Phone input */}
          <div>
            <div className={`flex border rounded-xl overflow-hidden bg-zinc-900/60 transition-colors focus-within:border-zinc-500 ${errors.phone ? 'border-red-500/60' : 'border-zinc-800'}`}>
              {/* Country selector */}
              <div ref={dropdownRef} className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(o => !o)}
                  className="flex items-center gap-2 px-3.5 py-3.5 text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors h-full border-r border-zinc-800 min-w-[100px]"
                >
                  <span className="text-lg leading-none">{selectedCountry.flag}</span>
                  <span className="text-zinc-400 text-xs font-mono">{selectedCountry.dial}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 z-50 mt-1 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-zinc-800">
                      <input
                        ref={searchRef}
                        type="text"
                        placeholder={t('onboarding.search_country')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-zinc-800/60 text-white text-xs placeholder-zinc-600 rounded-lg px-3 py-2 outline-none border border-transparent focus:border-zinc-700"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {filtered.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleCountrySelect(c)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-zinc-800 transition-colors text-left ${selectedCountry.code === c.code ? 'bg-zinc-800/60 text-white' : 'text-zinc-400'}`}
                        >
                          <span className="text-base">{c.flag}</span>
                          <span className="flex-1 truncate">{c.name}</span>
                          <span className="text-zinc-600 font-mono">{c.dial}</span>
                        </button>
                      ))}
                      {filtered.length === 0 && (
                        <p className="text-zinc-600 text-xs text-center py-4">{t('onboarding.no_country')}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Phone number input */}
              <input
                type="tel"
                placeholder={selectedCountry.mask.replace(/#/g, '0')}
                value={phone}
                onChange={handlePhoneChange}
                className="flex-1 bg-transparent text-white placeholder-zinc-600 px-4 py-3.5 text-sm outline-none min-w-0"
              />
            </div>
            {errors.phone && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.phone}</p>}
          </div>

          {/* Submit button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold py-3.5 rounded-xl text-sm transition-all active:scale-[0.98]"
            >
              {t('onboarding.continue')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
