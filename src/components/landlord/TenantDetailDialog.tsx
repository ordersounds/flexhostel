import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    CreditCard,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Building,
    Home,
    DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TenantDetailDialogProps {
    tenant: any;
    trigger?: React.ReactNode;
    onUpdate?: () => void;
}

const TenantDetailDialog = ({ tenant, trigger, onUpdate }: TenantDetailDialogProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tenantData, setTenantData] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [outstandingCharges, setOutstandingCharges] = useState<any[]>([]);

    useEffect(() => {
        if (open && tenant) {
            fetchTenantDetails();
        }
    }, [open, tenant]);

    const fetchTenantDetails = async () => {
        setLoading(true);
        try {
            // Fetch comprehensive tenant data
            const { data: tenancyData } = await supabase
                .from("tenancies")
                .select(`
                    *,
                    rooms:room_id (
                        id,
                        room_name,
                        price,
                        buildings:building_id (
                            id,
                            name,
                            address
                        )
                    )
                `)
                .eq("tenant_id", tenant.id)
                .eq("status", "active")
                .single();

            // Fetch recent payments
            const { data: paymentData } = await supabase
                .from("payments")
                .select(`
                    *,
                    charges:charge_id (name)
                `)
                .eq("user_id", tenant.id)
                .order("created_at", { ascending: false })
                .limit(5);

            // Fetch building charges
            const { data: chargeData } = await supabase
                .from("charges")
                .select("*")
                .eq("building_id", tenancyData?.rooms?.buildings?.id);

            // Check payment status and calculate arrears for each charge
            const chargesWithStatus = await Promise.all(
                (chargeData || []).map(async (charge) => {
                    // Get all successful payments for this charge by this tenant
                    const { data: chargePayments } = await supabase
                        .from("payments")
                        .select("*")
                        .eq("charge_id", charge.id)
                        .eq("user_id", tenant.id)
                        .eq("status", "success")
                        .order("created_at", { ascending: false });

                    const lastPayment = chargePayments?.[0];
                    const isPaid = !!lastPayment;

                    // Calculate arrears for recurring charges
                    let arrearsCount = 0;
                    let outstandingAmount = 0;
                    let lastPaidPeriod = null;

                    if (charge.frequency === 'monthly') {
                        // For monthly charges, calculate unpaid months
                        const currentDate = new Date();
                        const currentMonth = currentDate.getMonth();
                        const currentYear = currentDate.getFullYear();

                        // Find the earliest payment to establish baseline
                        const earliestPayment = chargePayments?.[chargePayments.length - 1];
                        let startMonth, startYear;

                        if (earliestPayment) {
                            const paymentDate = new Date(earliestPayment.created_at);
                            startMonth = paymentDate.getMonth();
                            startYear = paymentDate.getFullYear();
                            lastPaidPeriod = paymentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        } else {
                            // If no payments, assume tenancy start
                            if (tenancyData) {
                                const tenancyStart = new Date(tenancyData.start_date);
                                startMonth = tenancyStart.getMonth();
                                startYear = tenancyStart.getFullYear();
                            } else {
                                startMonth = currentMonth;
                                startYear = currentYear;
                            }
                        }

                        // Count unpaid months from start until now
                        let tempMonth = startMonth;
                        let tempYear = startYear;

                        while (tempYear < currentYear || (tempYear === currentYear && tempMonth <= currentMonth)) {
                            // Check if this month has been paid
                            const monthPaid = chargePayments?.some(payment => {
                                const paymentDate = new Date(payment.created_at);
                                return paymentDate.getMonth() === tempMonth && paymentDate.getFullYear() === tempYear;
                            });

                            if (!monthPaid) {
                                arrearsCount++;
                                outstandingAmount += charge.amount;
                            }

                            tempMonth++;
                            if (tempMonth > 11) {
                                tempMonth = 0;
                                tempYear++;
                            }
                        }
                    } else if (charge.frequency === 'yearly') {
                        // For yearly charges, check if current year is paid
                        const currentYear = new Date().getFullYear();
                        const yearPaid = chargePayments?.some(payment => {
                            const paymentDate = new Date(payment.created_at);
                            return paymentDate.getFullYear() === currentYear;
                        });

                        if (!yearPaid) {
                            arrearsCount = 1;
                            outstandingAmount = charge.amount;
                        }

                        if (lastPayment) {
                            lastPaidPeriod = new Date(lastPayment.created_at).getFullYear().toString();
                        }
                    }

                    return {
                        ...charge,
                        lastPayment,
                        isPaid,
                        paymentStatus: isPaid ? "paid" : "unpaid",
                        arrearsCount,
                        outstandingAmount,
                        lastPaidPeriod
                    };
                })
            );

            setTenantData({
                ...tenant,
                tenancy: tenancyData,
                recentPayments: paymentData || [],
                buildingCharges: chargesWithStatus
            });
            setPayments(paymentData || []);

        } catch (error) {
            console.error("Error fetching tenant details:", error);
            toast.error("Failed to load tenant details");
        } finally {
            setLoading(false);
        }
    };

    const getDaysUntilExpiry = () => {
        if (!tenantData?.tenancy?.end_date) return null;
        const endDate = new Date(tenantData.tenancy.end_date);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getPaymentStatus = () => {
        if (!payments.length) return "unknown";
        const hasPending = payments.some(p => p.status === "pending" || p.status === "failed");
        const hasSuccess = payments.some(p => p.status === "success");
        if (hasPending) return "pending";
        if (hasSuccess) return "paid";
        return "unknown";
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString()}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!tenant) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[3rem] border-stone-100 p-0 shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Tenant Details - {tenant.name}</DialogTitle>
                    <DialogDescription>
                        Comprehensive information about this tenant
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="h-96 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-stone-500 font-medium">Loading tenant details...</p>
                        </div>
                    </div>
                ) : tenantData ? (
                    <div className="p-10 space-y-8">
                        {/* Header Section */}
                        <div className="flex items-start gap-6">
                            <div className="h-20 w-20 rounded-[1.5rem] bg-stone-100 overflow-hidden shadow-inner flex-shrink-0">
                                {tenantData.photo_url ? (
                                    <img src={tenantData.photo_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-stone-400 uppercase text-2xl">
                                        {tenantData.name.charAt(0)}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="font-display font-bold text-2xl text-stone-900 tracking-tight">
                                        {tenantData.name}
                                    </h2>
                                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-xs uppercase tracking-widest px-3">
                                        Active Tenant
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-4 text-stone-500">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        <span className="text-sm font-medium">{tenantData.email}</span>
                                    </div>
                                    {tenantData.phone_number && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            <span className="text-sm font-medium">{tenantData.phone_number}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Room & Tenancy Information */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                                    <Home className="h-5 w-5" />
                                    Accommodation
                                </h3>

                                {tenantData.tenancy ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                                            <Building className="h-5 w-5 text-stone-400" />
                                            <div>
                                                <p className="font-semibold text-stone-900">{tenantData.tenancy.rooms?.room_name}</p>
                                                <p className="text-sm text-stone-500">{tenantData.tenancy.rooms?.buildings?.name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                                            <MapPin className="h-5 w-5 text-stone-400" />
                                            <div>
                                                <p className="text-sm text-stone-500">Location</p>
                                                <p className="font-medium text-stone-900 text-sm">{tenantData.tenancy.rooms?.buildings?.address}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                                            <DollarSign className="h-5 w-5 text-stone-400" />
                                            <div>
                                                <p className="text-sm text-stone-500">Monthly Rent</p>
                                                <p className="font-semibold text-stone-900">{formatCurrency(tenantData.tenancy.rooms?.price || 0)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                        <p className="text-amber-800 font-medium">No active tenancy found</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Tenancy Period
                                </h3>

                                {tenantData.tenancy ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                                            <Calendar className="h-5 w-5 text-stone-400" />
                                            <div>
                                                <p className="text-sm text-stone-500">Start Date</p>
                                                <p className="font-medium text-stone-900">{formatDate(tenantData.tenancy.start_date)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                                            <Calendar className="h-5 w-5 text-stone-400" />
                                            <div>
                                                <p className="text-sm text-stone-500">End Date</p>
                                                <p className="font-medium text-stone-900">{formatDate(tenantData.tenancy.end_date)}</p>
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl",
                                            getDaysUntilExpiry() !== null && getDaysUntilExpiry()! <= 30
                                                ? "bg-red-50 border border-red-200"
                                                : "bg-emerald-50"
                                        )}>
                                            <Clock className="h-5 w-5 text-stone-400" />
                                            <div>
                                                <p className="text-sm text-stone-500">Days Remaining</p>
                                                <p className={cn(
                                                    "font-semibold",
                                                    getDaysUntilExpiry() !== null && getDaysUntilExpiry()! <= 30
                                                        ? "text-red-700"
                                                        : "text-emerald-700"
                                                )}>
                                                    {getDaysUntilExpiry() !== null ? `${getDaysUntilExpiry()} days` : "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-stone-50 rounded-xl">
                                        <p className="text-stone-500 font-medium">No tenancy information</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Building Charges */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Building Charges
                            </h3>

                            {tenantData.buildingCharges && tenantData.buildingCharges.length > 0 ? (
                                <div className="space-y-3">
                                    {tenantData.buildingCharges.map((charge: any) => (
                                        <div key={charge.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-full flex items-center justify-center",
                                                    charge.isPaid ? "bg-emerald-100" : "bg-red-100"
                                                )}>
                                                    {charge.isPaid ? (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                    ) : (
                                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-stone-900">{charge.name}</p>
                                                    <p className="text-sm text-stone-500">
                                                        {charge.frequency === 'monthly' ? 'Monthly' : 'Yearly'} • {formatCurrency(charge.amount)}
                                                    </p>
                                                    {charge.arrearsCount > 0 && (
                                                        <p className="text-xs text-red-600 font-medium">
                                                            {charge.arrearsCount} {charge.frequency === 'monthly' ? 'month' : 'year'}{charge.arrearsCount > 1 ? 's' : ''} unpaid
                                                        </p>
                                                    )}
                                                    {charge.lastPaidPeriod && (
                                                        <p className="text-xs text-stone-400">
                                                            Last paid: {charge.lastPaidPeriod}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge className={cn(
                                                    "text-xs font-bold uppercase tracking-widest",
                                                    charge.isPaid ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                                )}>
                                                    {charge.isPaid ? "Paid" : "Unpaid"}
                                                </Badge>
                                                {!charge.isPaid && (
                                                    <p className="text-sm font-medium text-stone-600 mt-1">
                                                        {formatCurrency(charge.amount)} due
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 text-center">
                                    <p className="text-stone-500 font-medium">No charges configured for this building</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Payments */}
                        {payments.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <h3 className="font-bold text-stone-900 text-lg">Recent Payments</h3>
                                    <div className="space-y-3">
                                        {payments.slice(0, 3).map((payment: any) => (
                                            <div key={payment.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-full flex items-center justify-center",
                                                        payment.status === "success" ? "bg-emerald-100" :
                                                        payment.status === "pending" ? "bg-amber-100" :
                                                        "bg-red-100"
                                                    )}>
                                                        <CreditCard className={cn(
                                                            "h-4 w-4",
                                                            payment.status === "success" ? "text-emerald-600" :
                                                            payment.status === "pending" ? "text-amber-600" :
                                                            "text-red-600"
                                                        )} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-stone-900">
                                                            {payment.payment_type === 'rent' ? 'Rent Payment' :
                                                             payment.payment_type === 'charge' ? (payment.charges?.name || 'Charge') :
                                                             payment.payment_type === 'manual' ? 'Manual Payment' :
                                                             'Payment'}
                                                        </p>
                                                        <p className="text-sm text-stone-500">{formatDate(payment.created_at)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-stone-900">{formatCurrency(payment.amount)}</p>
                                                    <Badge className={cn(
                                                        "text-xs",
                                                        payment.status === "success" ? "bg-emerald-50 text-emerald-600" :
                                                        payment.status === "pending" ? "bg-amber-50 text-amber-600" :
                                                        "bg-red-50 text-red-600"
                                                    )}>
                                                        {payment.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="h-96 flex items-center justify-center">
                        <p className="text-stone-500 font-medium">No tenant data available</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default TenantDetailDialog;
