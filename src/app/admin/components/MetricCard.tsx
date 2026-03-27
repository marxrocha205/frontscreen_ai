import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Tipagem rigorosa para as propriedades do componente
interface MetricCardProps {
  title: string
  value: number | string
  icon: ReactNode
  description: string
}

/**
 * Componente visual para exibição de KPIs.
 * Isolado para garantir consistência visual em todo o painel.
 */
export function MetricCard({ title, value, icon, description }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {/* Adicionado fallback visual caso o valor seja undefined */}
        <div className="text-2xl font-bold text-zinc-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <p className="text-xs text-zinc-500">{description}</p>
      </CardContent>
    </Card>
  )
}