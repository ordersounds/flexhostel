import { useState, useEffect } from "react";
import { CreditCard, Wallet, ArrowDownRight, ArrowUpRight, Search, FileText, Download, Filter, Loader2, CheckCircle2 } from "lucide-react";
import StatCard from "./StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ManualPaymentDialog from "./ManualPaymentDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LandlordFinancials = () => {
    const isMobile = useIsMobile();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [payments, setPayments] = useState<any[]>([]);
    const [stats, setStats] = useState({
        collected: 0,
        forecast: 0,
        debt: 0
    });
    const [markingPaid, setMarkingPaid] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; paymentId: string | null }>({ open: false, paymentId: null });

    useEffect(() => {
        fetchFinancialData();
    }, []);

    const fetchFinancialData = async () => {
        setLoading(true);

        // 1. Fetch all payments with relations
        const { data: pData, error: pError } = await supabase
            .from("payments")
            .select(`
                *,
                profiles:user_id (name),
                charges:charge_id (name)
            `)
            .order("created_at", { ascending: false });

        if (pError) {
            toast.error("Failed to load financial data");
            console.error(pError);
        } else {
            setPayments(pData || []);

            // 2. Calculate Revenue Stats
            const collected = pData
                ?.filter(p => p.status === "success")
                ?.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) || 0;

            const debt = pData
                ?.filter(p => p.status === "pending" || p.status === "failed")
                ?.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) || 0;

            // 3. Fetch all rooms for Yield Forecast (Sum of all annual rents)
            const { data: rData } = await supabase.from("rooms").select("price");
            const forecast = rData?.reduce((acc, r) => acc + (Number(r.price) || 0), 0) || 0;

            setStats({ collected, forecast, debt });
        }
        setLoading(false);
    };

    const handleMarkAsPaid = async (paymentId: string) => {
        setMarkingPaid(paymentId);
        
        try {
            const { data, error } = await supabase.functions.invoke("confirm-manual-payment", {
                body: { payment_id: paymentId, notes: "Manually marked as paid by landlord" },
            });

            if (error) {
                throw new Error(error.message);
            }

            if (data?.success) {
                toast.success("Payment marked as paid");
                fetchFinancialData();
            } else {
                throw new Error(data?.error || "Failed to update payment");
            }
        } catch (err: any) {
            console.error("Mark as paid error:", err);
            toast.error(err.message || "Failed to mark as paid");
        } finally {
            setMarkingPaid(null);
            setConfirmDialog({ open: false, paymentId: null });
        }
    };

    const getPaymentTypeLabel = (payment: any) => {
        let label = '';
        
        if (payment.payment_type === 'charge' && payment.charges?.name) {
            label = payment.charges.name;
        } else if (payment.payment_type === 'rent') {
            label = 'Rent';
        } else if (payment.payment_type === 'manual') {
            label = 'Manual';
        } else if (payment.charge_id) {
            label = 'Charge';
        } else if (payment.application_id) {
            label = 'Application';
        } else {
            label = 'Other';
        }
        
        // Append period label if available
        if (payment.period_label) {
            label += ` - ${payment.period_label}`;
        }
        
        return label;
    };

    const getPaymentMethod = (payment: any) => {
        if (payment.manual_confirmation_by) return 'Manual';
        if (payment.payment_method === 'card') return 'Card';
        if (payment.payment_method === 'bank') return 'Bank';
        if (payment.payment_method === 'ussd') return 'USSD';
        if (payment.payment_method) return payment.payment_method;
        return 'Paystack';
    };

    const filteredLedger = payments.filter(p => {
        const tenantName = p.profiles?.name?.toLowerCase() || "";
        const txId = p.id.toLowerCase();
        const query = searchQuery.toLowerCase();
        return tenantName.includes(query) || txId.includes(query);
    });

    return (
        <div className={cn("animate-reveal-up pb-20", isMobile ? "space-y-8" : "space-y-12")}>
            <div className={cn(isMobile ? "flex flex-col gap-4" : "flex justify-between items-end")}>
                <div>
                    <h2 className={cn("font-display font-bold text-stone-900 tracking-tighter", isMobile ? "text-3xl" : "text-5xl")}>
                        General Ledger<span className="text-primary">.</span>
                    </h2>
                    <p className="text-stone-500 mt-2 font-medium" style={{fontSize: isMobile ? '14px' : '18px'}}>Full historical audit of all cash flows and transactions.</p>
                </div>
                <div className={cn("flex gap-3 flex-wrap", isMobile ? "w-full justify-center" : "")}>
                    <ManualPaymentDialog onPaymentCreated={fetchFinancialData} />
                </div>
            </div>

            <div className={cn("grid md:grid-cols-3", isMobile ? "gap-4" : "gap-6")}>
                <StatCard
                    title="Total Collected"
                    value={`₦${stats.collected.toLocaleString()}`}
                    subtext="Actual cash in bank"
                    icon={Wallet}
                    color="primary"
                />
                <StatCard
                    title="Yield Forecast"
                    value={`₦${stats.forecast.toLocaleString()}`}
                    subtext="Expected by end of year"
                    icon={ArrowUpRight}
                    color="stone"
                />
                <StatCard
                    title="Outstanding Debt"
                    value={`₦${stats.debt.toLocaleString()}`}
                    subtext="Unpaid services & charges"
                    icon={ArrowDownRight}
                    color="stone"
                    className="text-red-500"
                />
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                        <Input
                            placeholder="Search transaction ID or tenant..."
                            className={cn("pl-10 rounded-2xl border-stone-100 bg-white", isMobile ? "h-12" : "h-14")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className={cn("bg-white rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/20 overflow-hidden relative", isMobile ? "min-h-[300px]" : "min-h-[400px]")}>
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        </div>
                    ) : isMobile ? (
                        // Mobile: Card layout
                        <div className="p-6 space-y-4">
                            {filteredLedger.map((tx) => (
                                <div key={tx.id} className="bg-stone-50/30 rounded-2xl p-4 border border-stone-100/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-stone-300" />
                                            <span className="font-mono text-[10px] font-bold text-stone-400">{tx.id.slice(0, 8)}...</span>
                                        </div>
                                        <Badge className={cn(
                                            "rounded-full px-3 py-1 font-bold uppercase tracking-widest text-[8px] border-none shadow-sm",
                                            tx.status === "success" ? "bg-emerald-50 text-emerald-600" :
                                                tx.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                                        )}>
                                            {tx.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Tenant</span>
                                            <span className="font-bold text-stone-900 text-sm">{tx.profiles?.name || "Unknown"}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Date</span>
                                            <span className="text-xs font-medium text-stone-500">{new Date(tx.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Type</span>
                                            <span className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">
                                                {getPaymentTypeLabel(tx)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Method</span>
                                            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">
                                                {getPaymentMethod(tx)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Amount</span>
                                            <span className="font-display font-bold text-stone-900 text-lg">₦{Number(tx.amount).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {tx.status === "pending" && (
                                        <Button
                                            onClick={() => setConfirmDialog({ open: true, paymentId: tx.id })}
                                            disabled={markingPaid === tx.id}
                                            size="sm"
                                            className="w-full mt-4 rounded-xl bg-stone-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-stone-900/20"
                                        >
                                            {markingPaid === tx.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Mark as Paid
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {filteredLedger.length === 0 && (
                                <div className="py-20 text-center text-stone-400 font-medium italic">
                                    No transactions found matching your criteria.
                                </div>
                            )}
                        </div>
                    ) : (
                        // Desktop: Table layout
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-stone-50/50 border-b border-stone-100 text-stone-400 font-bold uppercase tracking-widest text-[10px]">
                                    <th className="px-6 py-5">Transaction ID</th>
                                    <th className="px-6 py-5">Tenant</th>
                                    <th className="px-6 py-5">Date</th>
                                    <th className="px-6 py-5">Type</th>
                                    <th className="px-6 py-5">Method</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-6 py-5 text-right">Amount</th>
                                    <th className="px-6 py-5">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {filteredLedger.map((tx) => (
                                    <tr key={tx.id} className="group hover:bg-stone-50/30 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-stone-300" />
                                                <span className="font-mono text-[10px] font-bold text-stone-400">{tx.id.slice(0, 8)}...</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-bold text-stone-900 text-sm tracking-tight">{tx.profiles?.name || "Unknown"}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-medium text-stone-500">{new Date(tx.created_at).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">
                                                {getPaymentTypeLabel(tx)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">
                                                {getPaymentMethod(tx)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Badge className={cn(
                                                "rounded-full px-3 py-1 font-bold uppercase tracking-widest text-[8px] border-none shadow-sm",
                                                tx.status === "success" ? "bg-emerald-50 text-emerald-600" :
                                                    tx.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                                            )}>
                                                {tx.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="font-display font-bold text-stone-900">₦{Number(tx.amount).toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            {tx.status === "pending" && (
                                                <Button
                                                    onClick={() => setConfirmDialog({ open: true, paymentId: tx.id })}
                                                    disabled={markingPaid === tx.id}
                                                    size="sm"
                                                    className="rounded-xl bg-stone-900 text-white font-bold text-[9px] uppercase tracking-widest shadow-xl shadow-stone-900/20"
                                                >
                                                    {markingPaid === tx.id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Mark Paid
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredLedger.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-20 text-center text-stone-400 font-medium italic">
                                            No transactions found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Confirm Mark as Paid Dialog */}
            <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, paymentId: open ? confirmDialog.paymentId : null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Manual Payment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to mark this payment as paid? This action will update the payment status and cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => confirmDialog.paymentId && handleMarkAsPaid(confirmDialog.paymentId)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            Confirm Payment
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default LandlordFinancials;
