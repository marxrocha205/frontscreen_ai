"use client"

import { useEffect } from 'react'
import clarity from '@microsoft/clarity'

export function ClarityInit({ projectId }: { projectId: string }) {
  useEffect(() => {
    if (projectId) {
      clarity.init(projectId)
    }
  }, [projectId])

  return null
}
