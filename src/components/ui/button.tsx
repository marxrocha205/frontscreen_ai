"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all",
          
          // VARIANTS
          variant === "default" && "bg-zinc-800 text-white hover:bg-zinc-700",
          variant === "ghost" && "hover:bg-zinc-800 text-zinc-200",
          variant === "outline" && "border border-zinc-700 hover:bg-zinc-800",

          // SIZES
          size === "default" && "h-9 px-3",
          size === "sm" && "h-8 px-2",
          size === "lg" && "h-10 px-4",
          size === "icon" && "h-9 w-9",

          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }