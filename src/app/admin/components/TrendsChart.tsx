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

export interface TrendData {
  date: string
  full_date: string
  users: number
  sessions: number
  revenue?: number // Adicionado para a receita diária
}

interface TrendsChartProps {
  data: TrendData[]
}

export function TrendsChart({ data }: TrendsChartProps) {
  return (
    <div className="h-[350px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
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
            minTickGap={20}
          />
          <YAxis 
            stroke="#a1a1aa" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
            itemStyle={{ color: '#e4e4e7' }}
          />
          
          <Area 
            type="monotone" 
            dataKey="sessions" 
            name="Sessões Ativas"
            stroke="#8b5cf6" 
            fillOpacity={1} 
            fill="url(#colorSessions)" 
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            name="Receita Diária (R$)"
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
