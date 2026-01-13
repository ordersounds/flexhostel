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
    DollarSign,
    Lock,
    CalendarDays,
    Wallet,
    Info
} from "lucide-react";
import {
    getChargePaymentStatus,
    type ChargePaymentStatus
} from "@/lib/charge-status";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import EditTenancyDatesDialog from "./EditTenancyDatesDialog";

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
            // Check payment status and calculate arrears for each charge
            const chargesWithStatus = await Promise.all(
                (chargeData || []).map(async (charge) => {
                    // Use the unified status calculation
                    // Need tenancy start date for accurate calculations
                    const startDate = tenancyData?.start_date || new Date().toISOString();

                    try {
                        const status = await getChargePaymentStatus(
                            tenant.id,
                            charge.id,
                            charge.name,
                            charge.amount,
                            charge.frequency,
                            startDate
                        );
                        return status;
                    } catch (err) {
                        console.error(`Failed to calc status for charge ${charge.id}`, err);
                        // Fallback minimal object (should rarely happen)
                        return {
                            chargeId: charge.id,
                            chargeName: charge.name,
                            chargeAmount: charge.amount,
                            chargeFrequency: charge.frequency,
                            chosenFrequency: null,
                            isLocked: false,
                            lockedAt: null,
                            currentPeriodPaid: false,
                            paidPeriods: [],
                            unpaidPeriods: [],
                            nextPaymentDue: null,
                            totalArrears: 0,
                            isUpToDate: false
                        } as ChargePaymentStatus;
                    }
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
                                                <p className="text-sm text-stone-500">Yearly Rent</p>
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
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        Tenancy Period
                                    </h3>
                                    {tenantData.tenancy && (
                                        <EditTenancyDatesDialog
                                            tenancyId={tenantData.tenancy.id}
                                            currentStartDate={tenantData.tenancy.start_date}
                                            currentEndDate={tenantData.tenancy.end_date}
                                            onUpdate={fetchTenantDetails}
                                        />
                                    )}
                                </div>

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
                                    {tenantData.buildingCharges.map((charge: ChargePaymentStatus) => (
                                        <div key={charge.chargeId} className="p-5 bg-stone-50 rounded-[1.5rem] border border-stone-200">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                                                        charge.isUpToDate ? "bg-emerald-100/50" : "bg-white border border-stone-100"
                                                    )}>
                                                        {charge.isUpToDate ? (
                                                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                        ) : (
                                                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-stone-900 text-lg">{charge.chargeName}</h4>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <Badge className={cn(
                                                                "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0",
                                                                charge.chosenFrequency === 'yearly'
                                                                    ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                                    : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                                                            )}>
                                                                {charge.chosenFrequency || charge.chargeFrequency}
                                                            </Badge>
                                                            {charge.isLocked && (
                                                                <span className="flex items-center text-[10px] text-stone-400 font-medium bg-stone-100 px-1.5 py-0.5 rounded-md">
                                                                    <Lock className="h-2.5 w-2.5 mr-1" />
                                                                    Locked
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-1">Status</p>
                                                    {charge.isUpToDate ? (
                                                        <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none">
                                                            Paid Up To Date
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-none">
                                                            {charge.unpaidPeriods.length} Period{charge.unpaidPeriods.length > 1 ? 's' : ''} Due
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Details Section */}
                                            <div className="bg-white rounded-xl p-3 border border-stone-100 space-y-3">
                                                {/* Arrears / Outstanding */}
                                                {!charge.isUpToDate && (
                                                    <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                                                        <span className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
                                                            <Wallet className="h-3.5 w-3.5" />
                                                            Outstanding Amount
                                                        </span>
                                                        <span className="font-bold text-red-600 text-base">
                                                            {formatCurrency(charge.totalArrears)}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Unpaid Periods List */}
                                                {!charge.isUpToDate && charge.unpaidPeriods.length > 0 && (
                                                    <div className="pt-1">
                                                        <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">
                                                            Unpaid Periods
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {charge.unpaidPeriods.slice(0, 4).map((period, idx) => (
                                                                <Badge key={idx} variant="outline" className="text-stone-600 text-[10px] border-stone-200 bg-stone-50">
                                                                    {period.label}
                                                                </Badge>
                                                            ))}
                                                            {charge.unpaidPeriods.length > 4 && (
                                                                <Badge variant="outline" className="text-stone-400 text-[10px] border-dashed border-stone-300">
                                                                    +{charge.unpaidPeriods.length - 4} more
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Paid History Preview */}
                                                {charge.isUpToDate && charge.paidPeriods.length > 0 && (
                                                    <div className="flex justify-between items-center text-xs text-stone-500">
                                                        <span className="flex items-center gap-1.5">
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                            Last paid
                                                        </span>
                                                        <span className="font-medium text-stone-900">
                                                            {charge.paidPeriods[charge.paidPeriods.length - 1].label}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Fallback if no specific data */}
                                                {charge.isUpToDate && charge.paidPeriods.length === 0 && (
                                                    <p className="text-xs text-stone-400 italic">No payment history yet (initial state)</p>
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
