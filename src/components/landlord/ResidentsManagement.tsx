import { useState, useEffect } from "react";
import { Users, UserPlus, Phone, Mail, Search, MoreVertical, Star, Building, CreditCard, AlertTriangle, CheckCircle2, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import TenantDetailDialog from "./TenantDetailDialog";

const ResidentsManagement = () => {
    const isMobile = useIsMobile();
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            // Fetch tenants with their tenancy, room, and application information
            const { data: tenantData, error } = await supabase
                .from("profiles")
                .select(`
                    *,
                    tenancies!inner (
                        id,
                        start_date,
                        end_date,
                        status,
                        rooms (
                            id,
                            room_name,
                            price,
                            buildings (
                                id,
                                name,
                                address
                            )
                        )
                    ),
                    applications (
                        submitted_data
                    )
                `)
                .eq("role", "tenant")
                .eq("status", "active")
                .eq("tenancies.status", "active");

            if (error) {
                console.error("Error fetching tenants:", error);
                toast.error("Failed to load tenant data");
                setTenants([]);
                return;
            }

            // Fetch payment information for each tenant and resolve phone fallback
            const tenantsWithPayments = await Promise.all(
                (tenantData || []).map(async (tenant) => {
                    // Fallback for phone number from application data
                    let displayPhone = tenant.phone_number;
                    if (!displayPhone && tenant.applications && tenant.applications.length > 0) {
                        // Find the most recent application with a phone number
                        for (const app of tenant.applications) {
                            const phone = (app.submitted_data as any)?.personal?.phone;
                            if (phone) {
                                displayPhone = phone;
                                break;
                            }
                        }
                    }

                    const { data: payments } = await supabase
                        .from("payments")
                        .select("*")
                        .eq("user_id", tenant.id)
                        .order("created_at", { ascending: false })
                        .limit(1);

                    const outstandingAmount = payments?.filter(p =>
                        p.status === "pending" || p.status === "failed"
                    ).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

                    return {
                        ...tenant,
                        phone_number: displayPhone, // Use the resolved phone number (fallback applied)
                        latestPayment: payments?.[0] || null,
                        outstandingAmount,
                        paymentStatus: payments?.[0]?.status || "unknown"
                    };
                })
            );

            setTenants(tenantsWithPayments);
        } catch (error) {
            console.error("Error fetching tenant data:", error);
            toast.error("Failed to load tenant data");
            setTenants([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("animate-reveal-up pb-20", isMobile ? "space-y-8" : "space-y-12")}>
            <div className="flex justify-between items-end">
                <div>
                    <h2 className={cn("font-display font-bold text-stone-900 tracking-tighter", isMobile ? "text-3xl" : "text-5xl")}>
                        Resident Directory<span className="text-primary">.</span>
                    </h2>
                    <p className="text-stone-500 mt-2 font-medium" style={{ fontSize: isMobile ? '14px' : '18px' }}>Manage your active tenant community and their accommodations.</p>
                </div>
            </div>

            <div className="space-y-8">
                <div className={cn("flex items-center gap-4", isMobile ? "flex-col" : "justify-between")}>
                    <div className="relative flex-1 max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                        <Input placeholder="Search residents..." className={cn("pl-10 rounded-2xl border-stone-100", isMobile ? "h-12" : "h-14")} />
                    </div>
                    <Button className={cn("rounded-2xl bg-stone-900 text-white font-bold uppercase tracking-widest text-[10px]", isMobile ? "h-12 px-6 w-full" : "h-14 px-8")}>
                        <UserPlus className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} /> Register Tenant
                    </Button>
                </div>

                <div className={cn("grid md:grid-cols-2 lg:grid-cols-3", isMobile ? "gap-4" : "gap-6")}>
                    {tenants.map((tenant) => {
                        const tenancy = tenant.tenancies?.[0]; // Get the first active tenancy
                        const room = tenancy?.rooms;
                        const building = room?.buildings;

                        const getDaysUntilExpiry = () => {
                            if (!tenancy?.end_date) return null;
                            const endDate = new Date(tenancy.end_date);
                            const today = new Date();
                            const diffTime = endDate.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return diffDays;
                        };

                        const daysRemaining = getDaysUntilExpiry();

                        return (
                            <TenantDetailDialog
                                key={tenant.id}
                                tenant={tenant}
                                trigger={
                                    <div className={cn("bg-white rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-500 group cursor-pointer", isMobile ? "p-5" : "p-6")}>
                                        {/* Header with avatar and actions */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={cn("rounded-[1.5rem] bg-stone-100 overflow-hidden shadow-inner p-1 flex-shrink-0", isMobile ? "h-10 w-10" : "h-12 w-12")}>
                                                {tenant.photo_url ? (
                                                    <img src={tenant.photo_url} className="w-full h-full object-cover rounded-[1.2rem]" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-bold text-stone-400 uppercase text-sm">
                                                        {tenant.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <button className="h-8 w-8 flex items-center justify-center text-stone-300 hover:text-stone-900 transition-colors flex-shrink-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {/* Name and Status */}
                                        <div className="mb-3">
                                            <h4 className={cn("font-display font-bold text-stone-900 tracking-tight truncate", isMobile ? "text-base" : "text-lg")}>{tenant.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[7px] uppercase tracking-widest px-1.5 py-0.5 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                    Active
                                                </Badge>
                                                {daysRemaining !== null && daysRemaining <= 30 && (
                                                    <Badge className="bg-red-50 text-red-600 border-none font-bold text-[7px] uppercase tracking-widest px-1.5 py-0.5">
                                                        {daysRemaining}d left
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Room Information */}
                                        {room && (
                                            <div className="flex items-center gap-2 text-stone-600 mb-3">
                                                <Building className="h-3.5 w-3.5 text-stone-400 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-xs font-semibold truncate block">{room.room_name}</span>
                                                    {building && (
                                                        <span className="text-[9px] text-stone-500 uppercase tracking-widest block">{building.name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Contact Info - Compact */}
                                        <div className="flex items-center gap-3 text-stone-500 mb-3">
                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                <Phone className="h-3 w-3 flex-shrink-0" />
                                                <span className="text-xs truncate">{tenant.phone_number || "No contact"}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                <Mail className="h-3 w-3 flex-shrink-0" />
                                                <span className="text-xs truncate">{tenant.email}</span>
                                            </div>
                                        </div>

                                        {/* Payment Status - Compact */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "rounded-lg flex items-center justify-center h-6 w-6",
                                                    tenant.paymentStatus === "success" ? "bg-emerald-100" :
                                                        tenant.paymentStatus === "pending" ? "bg-amber-100" :
                                                            tenant.paymentStatus === "failed" ? "bg-red-100" : "bg-stone-100"
                                                )}>
                                                    {tenant.paymentStatus === "success" ? (
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                    ) : tenant.paymentStatus === "pending" ? (
                                                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                                                    ) : tenant.paymentStatus === "failed" ? (
                                                        <AlertTriangle className="h-3 w-3 text-red-600" />
                                                    ) : (
                                                        <Clock className="h-3 w-3 text-stone-400" />
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">
                                                    {tenant.outstandingAmount > 0 ? `₦${tenant.outstandingAmount.toLocaleString()}` : "Paid"}
                                                </span>
                                            </div>
                                            <Button variant="ghost" className="h-6 w-6 p-0 text-stone-300 hover:text-primary flex-shrink-0">
                                                <Star className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        {/* Tenancy Dates - Compact */}
                                        {tenancy && (
                                            <div className="mt-3 pt-3 border-t border-stone-50">
                                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest text-center">
                                                    {new Date(tenancy.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {new Date(tenancy.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                }
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ResidentsManagement;
