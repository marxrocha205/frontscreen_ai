"use client"

import { useState, useEffect, useRef } from 'react'
import { Camera, ShieldCheck, Mail, Phone, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { useI18n } from '@/context/i18n-context'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { config } from '@/lib/config'

export default function ProfileSettingsPage() {
  const { t, language } = useI18n()
  const { user } = useAuth()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  
  // State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [picture, setPicture] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  
  // Passwords
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  const [initialState, setInitialState] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  })

  useEffect(() => {
    // Busca dados reais do localStorage assim que o componente monta
    const first = localStorage.getItem('user_first_name') || ''
    const last = localStorage.getItem('user_last_name') || ''
    const pic = localStorage.getItem('user_picture') || ''
    const ph = localStorage.getItem('user_phone') || ''
    
    setFirstName(first)
    setLastName(last)
    setPicture(pic)
    setPhone(ph)
    
    setInitialState({
      firstName: first,
      lastName: last,
      phone: ph
    })
  }, [])

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email)
    } else {
      // Tentar pegar do localStorage caso o estado global demore
      const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('user_email') : null
      if (savedEmail) setEmail(savedEmail)
    }
  }, [user?.email])

  const initialAvatar = firstName ? `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ''}`.toUpperCase() : 'US'

  // Check if anything changed to enable save button
  const hasChanges = 
    (firstName !== initialState.firstName) ||
    (lastName !== initialState.lastName) ||
    (phone !== initialState.phone) ||
    (currentPassword.length > 0 && newPassword.length > 0 && newPassword === confirmPassword)

  const handleSave = async () => {
    if (!hasChanges) return
    setIsSaving(true)
    setPasswordError('')
    
    try {
      // Handle password change if filled
      if (currentPassword && newPassword && confirmPassword === newPassword) {
        const token = localStorage.getItem('access_token')
        const response = await fetch(`${config.apiUrl}/auth/change-password`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          setPasswordError(errorData.detail || (language === 'pt-BR' ? 'Erro ao alterar a senha.' : 'Error changing password.'))
          setIsSaving(false)
          return // Stop execution if password fails
        }
      }

      // Handle profile data changes (simulated or real if profile API exists)
      if (firstName !== initialState.firstName || lastName !== initialState.lastName || phone !== initialState.phone) {
        // Here you would also call the API to update profile data (e.g. /auth/profile)
        // For now we just update localStorage as before
        localStorage.setItem('user_first_name', firstName)
        localStorage.setItem('user_last_name', lastName)
        localStorage.setItem('user_phone', phone)
        
        setInitialState({
          firstName,
          lastName,
          phone
        })
        
        // Dispatch event to update layout header
        window.dispatchEvent(new Event('storage'))
      }
      
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
      
      // Reset password fields if they were used
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setIsEditingPassword(false)
    } catch (error) {
      console.error('Error saving settings:', error)
      setPasswordError(language === 'pt-BR' ? 'Erro de conexão ao alterar a senha.' : 'Connection error changing password.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setPicture(result)
        localStorage.setItem('user_picture', result)
        window.dispatchEvent(new Event('storage'))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header Section */}
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
          {language === 'pt-BR' ? 'Configurar Perfil' : 'Profile Settings'}
        </h2>
        <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed">
          {language === 'pt-BR' 
            ? 'Gerencie suas informações pessoais e credenciais de acesso.'
            : 'Manage your personal information and access credentials.'}
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-12 xl:gap-20">
        
        {/* Left Column: Avatar */}
        <div className="flex-shrink-0 flex flex-col items-start xl:items-center">
          <div className="relative">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
              {picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={picture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-400 text-4xl font-semibold">
                  {initialAvatar}
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          
          <button 
            onClick={handleImageClick}
            className="mt-5 text-[15px] text-zinc-300 hover:text-white underline underline-offset-4 transition-colors"
          >
            {language === 'pt-BR' ? 'Escolher Arquivo' : 'Choose File'}
          </button>
        </div>

        {/* Right Column: Forms */}
        <div className="flex-1 max-w-2xl">
          
          <div className="space-y-8">
            
            {/* Name and Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {language === 'pt-BR' ? 'Nome' : 'First Name'}
                </Label>
                <Input 
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 h-11 px-4 text-zinc-100 focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500 transition-all rounded-lg"
                  placeholder="Ex: João"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {language === 'pt-BR' ? 'Sobrenome' : 'Last Name'}
                </Label>
                <Input 
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 h-11 px-4 text-zinc-100 focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500 transition-all rounded-lg"
                  placeholder="Ex: Silva"
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[15px] font-medium text-zinc-200">{email || (language === 'pt-BR' ? 'Não informado' : 'Not provided')}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  {language === 'pt-BR' ? 'Número de Telefone' : 'Phone Number'}
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[15px] font-medium text-zinc-200">{phone || (language === 'pt-BR' ? 'Não informado' : 'Not provided')}</span>
                </div>
              </div>
            </div>

            {/* Passwords */}
            <div className="pt-2">
              {!isEditingPassword ? (
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-zinc-200">
                      {language === 'pt-BR' ? 'Senha' : 'Password'}
                    </span>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input 
                        disabled
                        type="password"
                        value="••••••••••••••"
                        className="bg-zinc-900/50 border-zinc-800 h-11 pl-10 text-zinc-500 rounded-lg cursor-not-allowed opacity-100"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsEditingPassword(true)}
                    className="text-[15px] font-medium text-indigo-500 hover:text-indigo-400 transition-colors text-left"
                  >
                    {language === 'pt-BR' ? 'Alterar Senha' : 'Change Password'}
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-5 space-y-5 mt-2 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-200">
                      {language === 'pt-BR' ? 'Alterar Senha' : 'Change Password'}
                    </h3>
                    <button 
                      onClick={() => {
                        setIsEditingPassword(false)
                        setCurrentPassword('')
                        setNewPassword('')
                        setConfirmPassword('')
                      }}
                      className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      {language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentPass" className="text-xs font-semibold text-zinc-400">
                      {language === 'pt-BR' ? 'Senha Atual' : 'Current Password'}
                    </Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input 
                        id="currentPass"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="bg-zinc-950/50 border-zinc-800 h-11 pl-10 text-zinc-100 focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500 transition-all rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="newPass" className="text-xs font-semibold text-zinc-400">
                        {language === 'pt-BR' ? 'Nova Senha' : 'New Password'}
                      </Label>
                      <Input 
                        id="newPass"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-zinc-950/50 border-zinc-800 h-11 text-zinc-100 focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500 transition-all rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPass" className="text-xs font-semibold text-zinc-400">
                        {language === 'pt-BR' ? 'Confirmar Nova Senha' : 'Confirm New Password'}
                      </Label>
                      <Input 
                        id="confirmPass"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`bg-zinc-950/50 border-zinc-800 h-11 text-zinc-100 focus-visible:ring-1 transition-all rounded-lg ${
                          confirmPassword.length > 0 && confirmPassword !== newPassword 
                          ? 'border-rose-500/50 focus-visible:ring-rose-500/50 focus-visible:border-rose-500' 
                          : 'focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500'
                        }`}
                      />
                      {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                        <p className="text-[11px] text-rose-400 mt-1 font-medium">
                          {language === 'pt-BR' ? 'As senhas não coincidem' : 'Passwords do not match'}
                        </p>
                      )}
                    </div>
                  </div>

                  {passwordError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm font-medium animate-in fade-in">
                      {passwordError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-10 pb-10 flex items-center justify-between">
             <div className="h-10 flex items-center">
               {showSuccessToast && (
                 <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium animate-in slide-in-from-left-4 fade-in duration-300">
                   <CheckCircle2 className="w-4 h-4" />
                   {language === 'pt-BR' ? 'Alterações salvas com sucesso!' : 'Changes saved successfully!'}
                 </div>
               )}
             </div>
             
             <Button
               onClick={handleSave}
               disabled={!hasChanges || isSaving}
               className={`
                 h-12 px-8 rounded-full font-bold shadow-lg transition-all duration-300
                 ${hasChanges 
                   ? 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-indigo-500/25 hover:-translate-y-0.5' 
                   : 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed shadow-none'
                 }
               `}
             >
               {isSaving ? (
                 <>
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                   {language === 'pt-BR' ? 'Salvando...' : 'Saving...'}
                 </>
               ) : (
                 <>
                   <Save className="w-4 h-4 mr-2" />
                   {language === 'pt-BR' ? 'Salvar alterações' : 'Save changes'}
                 </>
               )}
             </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
