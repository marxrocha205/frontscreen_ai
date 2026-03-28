"use client"

import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts"

// Tipagem dos dados que vêm da nossa nova API Python
export interface TrendData {
  date: string
  full_date: string
  users: number
  sessions: number
  messages: number
}

interface TrendsChartProps {
  data: TrendData[]
}

/**
 * Componente visual para gráficos de tendências.
 * Utiliza o Recharts com estilização adaptada ao Dark Mode (zinc-950).
 */
export function TrendsChart({ data }: TrendsChartProps) {
  return (
    <div className="h-[350px] w-full mt-4">
      {/* ResponsiveContainer garante que o gráfico se adapta ao tamanho do ecrã e do Card */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {/* Gradientes para dar um aspeto moderno (estilo Vercel/Stripe) */}
            <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
          
          <XAxis 
            dataKey="date" 
            stroke="#a1a1aa" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
          <YAxis 
            stroke="#a1a1aa" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value}`} 
          />
          
          {/* Tooltip personalizado para o Dark Mode */}
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#09090b', // zinc-950
              borderColor: '#27272a',     // zinc-800
              color: '#f4f4f5',           // zinc-100
              borderRadius: '8px',
              fontSize: '14px'
            }}
            itemStyle={{ color: '#e4e4e7' }} // zinc-200
          />
          
          <Area 
            type="monotone" 
            dataKey="sessions" 
            name="Sessões"
            stroke="#8b5cf6" // Violeta
            fillOpacity={1} 
            fill="url(#colorSessions)" 
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="users" 
            name="Novos Utilizadores"
            stroke="#10b981" // Esmeralda
            fillOpacity={1} 
            fill="url(#colorUsers)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}