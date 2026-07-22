"use client"

import { useEffect, useState } from "react"
import { Loader2, AlertCircle, CreditCard, PlusCircle, MinusCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { config } from "@/lib/config"

interface BillingData {
    id: number
    email: string
    plan_name: string
    subscription_status: string
    remaining_credits: number
}

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Erro inesperado"

export function BillingTab() {
    const [accounts, setAccounts] = useState<BillingData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [selectedUser, setSelectedUser] = useState<BillingData | null>(null)
    const [amount, setAmount] = useState<number>(0)
    const [reason, setReason] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Modal para mudança de plano
    const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false)
    const [selectedPlanId, setSelectedPlanId] = useState<number>(1)
    const [isChangingPlan, setIsChangingPlan] = useState(false)

    useEffect(() => {
    const controller = new AbortController()

    async function fetchBillingData() {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1] || localStorage.getItem('access_token')
        if (!token) throw new Error("Não autenticado")

        const res = await fetch(`${config.apiUrl}/api/admin/billing`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        })

        if (!res.ok) throw new Error("Falha ao carregar contas de faturação")

        const data = await res.json()
        
        setAccounts(data.data)
        
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    fetchBillingData()
    return () => controller.abort()
  }, [])

    const handleAdjustCredits = async () => {
        if (!selectedUser || amount === 0 || reason.length < 5) {
            alert("Preencha o valor e justifique (mínimo 5 caracteres).")
            return
        }

        setIsSubmitting(true)
        try {
            const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1] || localStorage.getItem('access_token')
            const res = await fetch(`${config.apiUrl}/api/admin/users/${selectedUser.id}/credits`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ amount, reason })
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.detail || "Erro ao processar a transação.")
            }

            const responseData = await res.json()

            setAccounts(prev => prev.map(acc =>
                acc.id === selectedUser.id ? { ...acc, remaining_credits: responseData.data.new_balance } : acc
            ))

            setIsDialogOpen(false)
            setAmount(0)
            setReason("")
        } catch (err: unknown) {
            alert(getErrorMessage(err))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChangePlan = async () => {
        if (!selectedUser) return
        setIsChangingPlan(true)
        try {
            const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1] || localStorage.getItem('access_token')
            const res = await fetch(`${config.apiUrl}/api/admin/users/${selectedUser.id}/plan`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ plan_id: selectedPlanId })
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.detail || "Erro ao alterar o plano.")
            }

            const responseData = await res.json()

            const planNames = {1: "Free", 2: "Pro Mensal", 3: "Pro Anual"}
            setAccounts(prev => prev.map(acc =>
                acc.id === selectedUser.id ? { ...acc, plan_name: planNames[selectedPlanId as keyof typeof planNames] } : acc
            ))

            setIsPlanDialogOpen(false)
            alert(responseData.message)
        } catch (err: unknown) {
            alert(getErrorMessage(err))
        } finally {
            setIsChangingPlan(false)
        }
    }

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>
    if (error) return <div className="flex h-64 flex-col items-center justify-center text-red-500"><AlertCircle className="h-8 w-8" /><p>{error}</p></div>

    return (
        <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-zinc-100 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-400" /> Faturação e Créditos (Real)
                </CardTitle>
                <CardDescription className="text-zinc-400">Gerencie saldos, planos e transações reais dos utilizadores.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 overflow-hidden">
                <div className="rounded-md border border-zinc-800 overflow-x-auto w-full">
                    <table className="w-full text-sm text-left min-w-[700px]">
                        <thead className="bg-zinc-900 text-zinc-300">
                            <tr>
                                <th className="p-4 font-medium">Utilizador</th>
                                <th className="p-4 font-medium">Plano Atual</th>
                                <th className="p-4 font-medium">Estado</th>
                                <th className="p-4 font-medium text-right">Saldo (Créditos)</th>
                                <th className="p-4 font-medium text-right">Operações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((acc) => (
                                <tr key={acc.id} className="border-t border-zinc-800 hover:bg-zinc-800/40">
                                    <td className="p-4 font-medium text-zinc-100">{acc.email}</td>
                                    <td className="p-4 text-zinc-400">{acc.plan_name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-md text-xs border ${acc.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                            {acc.subscription_status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-mono text-zinc-300">
                                        {acc.remaining_credits.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <Dialog open={isDialogOpen && selectedUser?.id === acc.id} onOpenChange={(open) => {
                                            setIsDialogOpen(open)
                                            if (open) setSelectedUser(acc)
                                        }}>
                                            <DialogTrigger render={<Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800" />}>
                                                Gerir Fundo
                                            </DialogTrigger>
                                            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 w-[95vw] sm:w-full max-w-lg rounded-2xl p-4 sm:p-6">
                                                <DialogHeader>
                                                    <DialogTitle>Ajuste Manual de Créditos</DialogTitle>
                                                    <DialogDescription className="text-zinc-400">
                                                        Atenção: Esta ação altera diretamente o passivo financeiro da plataforma para o utilizador <strong className="text-zinc-200">{acc.email}</strong>.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="amount" className="text-zinc-300">Montante (+ ou -)</Label>
                                                        <Input
                                                            id="amount"
                                                            type="number"
                                                            value={amount}
                                                            onChange={(e) => setAmount(Number(e.target.value))}
                                                            className="bg-zinc-900 border-zinc-700 text-zinc-100"
                                                        />
                                                        <p className="text-xs text-zinc-500">Valores negativos deduzem do saldo atual ({acc.remaining_credits}).</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="reason" className="text-zinc-300">Motivo (Auditoria)</Label>
                                                        <Input
                                                            id="reason"
                                                            placeholder="Ex: Compensação por quebra de servidor"
                                                            value={reason}
                                                            onChange={(e) => setReason(e.target.value)}
                                                            className="bg-zinc-900 border-zinc-700 text-zinc-100"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent border-zinc-700 text-zinc-300">Cancelar</Button>
                                                    <Button
                                                        onClick={handleAdjustCredits}
                                                        disabled={isSubmitting || amount === 0 || reason.length < 5}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                    >
                                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                        Confirmar Transação
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        <Dialog open={isPlanDialogOpen && selectedUser?.id === acc.id} onOpenChange={(open) => {
                                            setIsPlanDialogOpen(open)
                                            if (open) {
                                                setSelectedUser(acc)
                                                setSelectedPlanId(acc.plan_name?.includes('Anual') ? 3 : acc.plan_name?.includes('Mensal') ? 2 : 1)
                                            }
                                        }}>
                                            <DialogTrigger render={<Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800" />}>
                                                Mudar Plano
                                            </DialogTrigger>
                                            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 w-[95vw] sm:w-full max-w-lg rounded-2xl p-4 sm:p-6">
                                                <DialogHeader>
                                                    <DialogTitle>Alterar Plano</DialogTitle>
                                                    <DialogDescription className="text-zinc-400">
                                                        Selecione o novo plano para o utilizador <strong className="text-zinc-200">{acc.email}</strong>.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-zinc-300">Novo Plano</Label>
                                                        <select 
                                                            value={selectedPlanId} 
                                                            onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                                                            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-md p-2 text-sm"
                                                        >
                                                            <option value={1}>Free</option>
                                                            <option value={2}>Pro Mensal</option>
                                                            <option value={3}>Pro Anual</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)} className="bg-transparent border-zinc-700 text-zinc-300">Cancelar</Button>
                                                    <Button
                                                        onClick={handleChangePlan}
                                                        disabled={isChangingPlan}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                    >
                                                        {isChangingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                        Confirmar Alteração
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
