"use client"

import * as React from "react"

export function ThemeProvider({
  children,
}: React.PropsWithChildren<{
  attribute?: string
  defaultTheme?: string
}>) {
  return <>{children}</>
}
