"use client"

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import type { CSSProperties } from 'react'

type GeminiLiveOrbProps = {
  active: boolean
  connected: boolean
  phase: 'idle' | 'connecting' | 'listening' | 'speaking'
  level: number
  onClose: () => void
}

export function GeminiLiveOrb({ active, connected, phase, level, onClose }: GeminiLiveOrbProps) {
  const normalizedLevel = Math.max(0, Math.min(1, level))
  const orbScale = 1 + normalizedLevel * (phase === 'speaking' ? 0.08 : 0.14)

  if (!active) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[#0a0a0a]/62 backdrop-blur-[2px]" />
      <button
        type="button"
        onClick={onClose}
        title="Encerrar Gemini Live"
        aria-label="Encerrar Gemini Live"
        className="pointer-events-auto absolute top-5 left-1/2 z-50 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-zinc-700/70 bg-[#171717]/85 text-zinc-300 shadow-2xl backdrop-blur-md transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="relative flex flex-col items-center gap-8">
        <div
          className={cn(
            'gemini-live-orb',
            phase === 'connecting' && 'gemini-live-orb--connecting',
            phase === 'listening' && 'gemini-live-orb--listening',
            phase === 'speaking' && 'gemini-live-orb--speaking'
          )}
          style={{
            '--live-level': normalizedLevel,
            '--live-scale': orbScale
          } as CSSProperties}
        >
          <span className="gemini-live-orb__aura" />
          <span className="gemini-live-orb__surface" />
          <span className="gemini-live-orb__shine" />
          <span className="gemini-live-orb__wave gemini-live-orb__wave--one" />
          <span className="gemini-live-orb__wave gemini-live-orb__wave--two" />
        </div>
        {!connected && (
          <div className="h-5 text-center text-xs font-medium uppercase tracking-[0.22em] text-zinc-400/80">
            Conectando
          </div>
        )}
      </div>
    </div>
  )
}
