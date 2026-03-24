"use client"

import { useI18n } from '@/context/i18n-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LoginPromptDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { t } = useI18n()
  const router = useRouter()
  const [email, setEmail] = useState('')

  const handleContinue = () => {
    if (email.trim()) {
      router.push(`/register?email=${encodeURIComponent(email)}`)
    } else {
      router.push('/login')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1f1f1f] border-zinc-800 text-zinc-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-center text-xl font-semibold tracking-tight">Log in or sign up</DialogTitle>
          <p className="text-center text-zinc-400 text-sm mt-2">
            You&apos;ll get smarter responses and can upload files, images, and more.
          </p>
        </DialogHeader>
        
        <div className="space-y-3">
           <Button variant="outline" onClick={() => router.push('/login')} className="w-full bg-[#2f2f2f] border-zinc-700 text-zinc-200 hover:bg-[#3f3f3f] hover:text-white rounded-lg h-12 justify-center font-medium">
             <span className="font-bold flex-1 text-center font-serif flex items-center justify-center gap-2"><span className="text-lg">G</span> Continue with Google</span>
           </Button>
           
           <Button variant="outline" onClick={() => router.push('/login')} className="w-full bg-[#2f2f2f] border-zinc-700 text-zinc-200 hover:bg-[#3f3f3f] hover:text-white rounded-lg h-12 justify-center font-medium">
             <span className="font-bold flex-1 text-center flex items-center justify-center gap-2">Continue with phone</span>
           </Button>

           <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-semibold">
                <span className="bg-[#1f1f1f] px-4 text-zinc-500">OR</span>
              </div>
           </div>

           <div className="space-y-3">
              <Input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address" 
                className="bg-[#1f1f1f] border-zinc-700 h-12 rounded-lg text-zinc-300 placeholder:text-zinc-500 focus-visible:ring-zinc-600 focus-visible:border-zinc-500 transition-all text-base px-4" 
              />
              <Button onClick={handleContinue} className="w-full bg-white text-black hover:bg-zinc-200 rounded-lg h-12 font-medium">
                Continue
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
