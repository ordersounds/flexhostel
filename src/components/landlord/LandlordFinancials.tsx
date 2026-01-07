import { useState, useEffect } from "react";
import { CreditCard, Wallet, ArrowDownRight, ArrowUpRight, Search, FileText, Download, Filter, Loader2 } from "lucide-react";
import StatCard from "./StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LandlordFinancials = () => {
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [payments, setPayments] = useState<any[]>([]);
    const [stats, setStats] = useState({
        collected: 0,
        forecast: 0,
        debt: 0
    });

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
                tenancies:tenancies!tenancy_id (
                    rooms (
                        room_name,
                        price
                    )
                )
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

    const filteredLedger = payments.filter(p => {
        const tenantName = p.profiles?.name?.toLowerCase() || "";
        const roomName = p.tenancies?.rooms?.room_name?.toLowerCase() || "";
        const txId = p.id.toLowerCase();
        const query = searchQuery.toLowerCase();
        return tenantName.includes(query) || roomName.includes(query) || txId.includes(query);
    });

    return (
        <div className="space-y-12 animate-reveal-up pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="font-display text-5xl font-bold text-stone-900 tracking-tighter">
                        General Ledger<span className="text-primary">.</span>
                    </h2>
                    <p className="text-stone-500 text-lg mt-2 font-medium">Full historical audit of all cash flows and transactions.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-2xl border-stone-100 h-14 w-14 p-0">
                        <Filter className="h-5 w-5 text-stone-400" />
                    </Button>
                    <Button className="rounded-2xl bg-stone-900 text-white h-14 px-8 font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-stone-900/20">
                        <Download className="h-4 w-4 mr-2" /> Export CSV
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
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
                            placeholder="Search transaction ID, tenant or room..."
                            className="pl-10 h-14 rounded-2xl border-stone-100 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/20 overflow-hidden min-h-[400px] relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-stone-50/50 border-b border-stone-100 text-stone-400 font-bold uppercase tracking-widest text-[10px]">
                                    <th className="px-8 py-5">Transaction ID</th>
                                    <th className="px-8 py-5">Resident / Unit</th>
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5">Type</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {filteredLedger.map((tx) => (
                                    <tr key={tx.id} className="group hover:bg-stone-50/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-stone-300" />
                                                <span className="font-mono text-[10px] font-bold text-stone-400">{tx.id.slice(0, 8)}...</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="font-bold text-stone-900 text-sm tracking-tight">{tx.profiles?.name || "Unknown Tenant"}</p>
                                                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{tx.tenancies?.rooms?.room_name || "N/A"}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-medium text-stone-500">{new Date(tx.created_at).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">
                                                {tx.charge_id ? "Charge" : tx.application_id ? "Application" : "Rent"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge className={cn(
                                                "rounded-full px-3 py-1 font-bold uppercase tracking-widest text-[8px] border-none shadow-sm",
                                                tx.status === "success" ? "bg-emerald-50 text-emerald-600" :
                                                    tx.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                                            )}>
                                                {tx.status}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="font-display font-bold text-stone-900">₦{Number(tx.amount).toLocaleString()}</span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLedger.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center text-stone-400 font-medium italic">
                                            No transactions found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LandlordFinancials;
