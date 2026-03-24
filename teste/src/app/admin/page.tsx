export default function AdminDashboard() {
  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">System overview and real-time monitoring.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         {[
           { label: 'Active Sessions', val: '24', desc: '+12% from last hour' },
           { label: 'WebSocket Latency', val: '43ms', desc: 'p95 latency global' },
           { label: 'Total Users', val: '1,204', desc: '+42 this week' },
           { label: 'VAD Dropped Frames', val: '0.01%', desc: 'Acceptable range' },
         ].map((stat, i) => (
           <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between">
             <div className="text-sm font-medium text-zinc-400">{stat.label}</div>
             <div className="text-3xl font-bold mt-4">{stat.val}</div>
             <div className="text-xs text-zinc-500 mt-2">{stat.desc}</div>
           </div>
         ))}
      </div>
      
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 h-64 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Main Chart/Graph Placeholder</p>
      </div>
    </div>
  )
}
