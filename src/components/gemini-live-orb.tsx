"use client"

import { cn } from '@/lib/utils'
import type { CSSProperties } from 'react'

type GeminiLiveOrbProps = {
  active: boolean
  connected: boolean
  phase: 'idle' | 'connecting' | 'listening' | 'speaking'
  level: number
}

export function GeminiLiveOrb({ active, connected, phase, level }: GeminiLiveOrbProps) {
  const normalizedLevel = Math.max(0, Math.min(1, level))
  const orbScale = 1 + normalizedLevel * (phase === 'speaking' ? 0.08 : 0.14)

  if (!active) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[#0a0a0a]/62 backdrop-blur-[2px]" />
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
