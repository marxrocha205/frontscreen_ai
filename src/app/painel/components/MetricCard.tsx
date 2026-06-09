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
    // MUDANÇA 1: Fundo mudado para bg-zinc-950 (quase preto) e borda escura
    <Card className="bg-zinc-950 border-zinc-800 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {/* MUDANÇA 2: Título clareado (de zinc-600 para zinc-300) para legibilidade */}
        <CardTitle className="text-sm font-medium text-zinc-300">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {/* MUDANÇA 3: Número do KPI em branco brilhante (de zinc-900 para zinc-100) */}
        <div className="text-2xl font-bold text-zinc-100">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <p className="text-xs text-zinc-500 mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}