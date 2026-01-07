import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Users, Clock, ArrowUpRight, ChevronRight, CreditCard, Wallet, Layers, Loader2, AlertTriangle, CheckCircle, MessageSquare, DollarSign, Zap, Home, UserCheck, Megaphone } from "lucide-react";
import StatCard from "./StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

const LandlordOverview = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [loading, setLoading] = useState(true);
    const [businessPulse, setBusinessPulse] = useState({
        // Money metrics
        annualRevenueCollected: 0,
        annualRevenueTarget: 0,
        thisMonthRevenue: 0,
        overdueAmount: 0,

        // Urgent actions
        pendingApps: 0,
        unreadMessages: 0,
        overdueTenants: [] as any[],

        // Portfolio health
        occupancyRate: 0,
        vacantRooms: 0,
        totalRooms: 0,

        // Recent activity
        recentPayments: [] as any[],
        recentMessages: [] as any[]
    });

    useEffect(() => {
        fetchBusinessPulse();
    }, []);

    const fetchBusinessPulse = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get current year date range for annual calculations
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // 1. Annual revenue calculations
            const { data: annualPayments } = await supabase
                .from("payments")
                .select("amount")
                .eq("status", "success")
                .gte("created_at", startOfYear.toISOString());

            const annualRevenueCollected = annualPayments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

            // Calculate annual revenue target (sum of all room prices in portfolio)
            const { data: buildings } = await supabase
                .from("buildings")
                .select(`
                    rooms(price)
                `)
                .eq("landlord_id", user.id);

            const annualRevenueTarget = buildings?.flatMap(b => b.rooms || []).reduce((sum, room) => sum + (Number(room.price) || 0), 0) || 0;

            // 2. This month's revenue
            const { data: thisMonthPayments } = await supabase
                .from("payments")
                .select("amount")
                .eq("status", "success")
                .gte("created_at", startOfMonth.toISOString());

            const thisMonthRevenue = thisMonthPayments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

            // 3. Overdue payments
            const { data: overduePayments } = await supabase
                .from("payments")
                .select(`
                    amount,
                    profiles:user_id (name, email),
                    tenancies:tenancies!tenancy_id (rooms(room_name))
                `)
                .in("status", ["pending", "failed"]);

            const overdueAmount = overduePayments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
            const overdueTenants = overduePayments || [];

            // 4. Pending applications
            const { data: pendingApps } = await supabase
                .from("applications")
                .select("id")
                .eq("status", "pending");

            // 5. Unread messages (simplified - last 24 hours)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const { data: recentMessages } = await supabase
                .from("messages")
                .select("*")
                .or(`receiver_id.eq.${user.id},building_id.not.is.null`)
                .gte("created_at", oneDayAgo.toISOString())
                .order("created_at", { ascending: false })
                .limit(5);

            // 6. Portfolio status
            const { data: rooms } = await supabase.from("rooms").select("id, status");
            const totalRooms = rooms?.length || 0;
            const occupiedRooms = rooms?.filter(r => r.status === "occupied").length || 0;
            const vacantRooms = totalRooms - occupiedRooms;
            const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

            // 7. Recent payments
            const { data: recentPayments } = await supabase
                .from("payments")
                .select(`
                    amount, status, created_at,
                    profiles:user_id (name),
                    tenancies:tenancies!tenancy_id (rooms(room_name))
                `)
                .order("created_at", { ascending: false })
                .limit(3);

            setBusinessPulse({
                annualRevenueCollected,
                annualRevenueTarget,
                thisMonthRevenue,
                overdueAmount,
                pendingApps: pendingApps?.length || 0,
                unreadMessages: recentMessages?.length || 0,
                overdueTenants,
                occupancyRate,
                vacantRooms,
                totalRooms,
                recentPayments: recentPayments || [],
                recentMessages: recentMessages || []
            });

        } catch (error) {
            console.error("Business pulse fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const annualProgress = businessPulse.annualRevenueTarget > 0
        ? Math.round((businessPulse.annualRevenueCollected / businessPulse.annualRevenueTarget) * 100)
        : 0;

    return (
        <div className={cn("animate-reveal-up", isMobile ? "space-y-6" : "space-y-8")}>
            {/* Header */}
            <div className={cn(isMobile ? "flex flex-col gap-4" : "flex justify-between items-end")}>
                <div>
                    <h2 className={cn("font-display font-bold text-stone-900 tracking-tighter", isMobile ? "text-3xl" : "text-5xl")}>
                        Portfolio Overview<span className="text-primary">.</span>
                    </h2>
                    <p className="text-stone-500 mt-1 font-medium" style={{fontSize: isMobile ? '14px' : '18px'}}>Your property empire at a glance.</p>
                </div>
                <Button
                    onClick={() => navigate("/landlord/broadcasts")}
                    className={cn("rounded-2xl bg-stone-900 text-white font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-stone-900/20", isMobile ? "h-12 px-6 w-full" : "h-16 px-8")}
                >
                    <Megaphone className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                    Quick Announcement
                </Button>
            </div>

            {/* Money First - Priority Dashboard */}
            <div className={cn("bg-white rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-2xl hover:shadow-stone-200/50 transition-all duration-500", isMobile ? "p-6" : "p-8")}>
                <div className={cn("flex items-center justify-between", isMobile ? "mb-6" : "mb-8")}>
                    <div>
                        <h3 className="text-lg font-bold text-stone-900 mb-2 uppercase tracking-widest text-sm">Annual Revenue Progress</h3>
                        <div className="flex items-baseline gap-4">
                            <span className={cn("font-display font-bold text-stone-900", isMobile ? "text-3xl" : "text-4xl")}>
                                ₦{(businessPulse.annualRevenueCollected / 1000000).toFixed(1)}M
                            </span>
                            <span className="text-sm font-bold text-stone-500">collected</span>
                        </div>
                        <p className="text-stone-600 text-sm font-medium mt-1">{annualProgress}% of annual target</p>
                    </div>
                    <div className={cn("rounded-2xl bg-primary/10 flex items-center justify-center", isMobile ? "h-12 w-12" : "h-16 w-16")}>
                        <DollarSign className={cn("text-primary", isMobile ? "h-6 w-6" : "h-8 w-8")} />
                    </div>
                </div>

                {businessPulse.overdueAmount > 0 && (
                    <div className={cn("bg-stone-50 rounded-2xl border border-stone-200", isMobile ? "p-4" : "p-6")}>
                        <div className={cn("flex items-center justify-between", isMobile ? "flex-col gap-4" : "")}>
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-stone-600" />
                                <div>
                                    <span className="text-sm font-bold text-stone-900">
                                        {businessPulse.overdueTenants.length} overdue payment{businessPulse.overdueTenants.length !== 1 ? 's' : ''}
                                    </span>
                                    <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">
                                        ₦{businessPulse.overdueAmount.toLocaleString()} outstanding
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => navigate("/landlord/financials")}
                                className={cn("bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest", isMobile ? "h-10 px-6 w-full" : "h-10 px-6")}
                            >
                                Send Reminders
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Today's Fire Drill - Urgent Actions */}
            <div className={cn("grid md:grid-cols-3", isMobile ? "gap-6" : "gap-8")}>
                <div
                    onClick={() => navigate("/landlord/applications")}
                    className="group relative bg-white rounded-[2.5rem] border border-stone-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-stone-200/50 hover:bg-stone-50/30 transition-all duration-500 cursor-pointer"
                >
                    <div className={cn("space-y-6", isMobile ? "p-6" : "p-8")}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-stone-100 flex items-center justify-center">
                                    <UserCheck className="h-6 w-6 text-stone-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-stone-900">Applications</p>
                                    <p className="text-[10px] text-stone-500 uppercase tracking-widest">Need Review</p>
                                </div>
                            </div>
                            <span className="text-3xl font-bold text-stone-900">{businessPulse.pendingApps}</span>
                        </div>

                        {businessPulse.pendingApps > 0 ? (
                            <div className="flex items-center gap-2 text-stone-400 group-hover:text-stone-600 transition-colors">
                                <ArrowUpRight className="h-4 w-4" />
                                <span className="text-xs font-medium">Review applications</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-primary">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs font-medium">All caught up</span>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    onClick={() => navigate("/landlord/broadcasts")}
                    className="group relative bg-white rounded-[2.5rem] border border-stone-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-stone-200/50 hover:bg-stone-50/30 transition-all duration-500 cursor-pointer"
                >
                    <div className={cn("space-y-6", isMobile ? "p-6" : "p-8")}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-stone-100 flex items-center justify-center">
                                    <MessageSquare className="h-6 w-6 text-stone-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-stone-900">Messages</p>
                                    <p className="text-[10px] text-stone-500 uppercase tracking-widest">Unread</p>
                                </div>
                            </div>
                            <span className="text-3xl font-bold text-stone-900">{businessPulse.unreadMessages}</span>
                        </div>

                        {businessPulse.unreadMessages > 0 ? (
                            <div className="flex items-center gap-2 text-stone-400 group-hover:text-stone-600 transition-colors">
                                <ArrowUpRight className="h-4 w-4" />
                                <span className="text-xs font-medium">Check messages</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-primary">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs font-medium">Inbox clear</span>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    onClick={() => navigate("/landlord/properties")}
                    className="group relative bg-white rounded-[2.5rem] border border-stone-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-stone-200/50 hover:bg-stone-50/30 transition-all duration-500 cursor-pointer"
                >
                    <div className={cn("space-y-6", isMobile ? "p-6" : "p-8")}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-stone-100 flex items-center justify-center">
                                    <Home className="h-6 w-6 text-stone-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-stone-900">Vacant Units</p>
                                    <p className="text-[10px] text-stone-500 uppercase tracking-widest">Need Filling</p>
                                </div>
                            </div>
                            <span className="text-3xl font-bold text-stone-900">{businessPulse.vacantRooms}</span>
                        </div>

                        {businessPulse.vacantRooms > 0 ? (
                            <div className="flex items-center gap-2 text-stone-400 group-hover:text-stone-600 transition-colors">
                                <ArrowUpRight className="h-4 w-4" />
                                <span className="text-xs font-medium">List properties</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-primary">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs font-medium">Fully occupied</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Property Status & Recent Activity */}
            <div className={cn("grid lg:grid-cols-2", isMobile ? "gap-6" : "gap-8")}>
                {/* Portfolio Health */}
                <div className={cn("bg-white rounded-[2.5rem] border border-stone-100 shadow-sm", isMobile ? "p-6" : "p-8")}>
                    <h3 className="text-lg font-bold text-stone-900 mb-6 uppercase tracking-widest text-sm">Portfolio Health</h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Occupancy Rate</p>
                                <p className="text-3xl font-bold text-stone-900">{businessPulse.occupancyRate}%</p>
                            </div>
                            <div className={cn("rounded-2xl bg-primary/10 flex items-center justify-center", isMobile ? "h-12 w-12" : "h-16 w-16")}>
                                <Layers className={cn("text-primary", isMobile ? "h-6 w-6" : "h-8 w-8")} />
                            </div>
                        </div>

                        <div className="bg-stone-50 rounded-2xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-stone-700">Occupied</span>
                                <span className="text-sm font-bold text-stone-900">
                                    {businessPulse.totalRooms - businessPulse.vacantRooms}/{businessPulse.totalRooms}
                                </span>
                            </div>
                            <div className="w-full bg-stone-200 rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${businessPulse.occupancyRate}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                                <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest mb-1">Active Tenants</p>
                                <p className="text-2xl font-bold text-stone-900">{businessPulse.totalRooms - businessPulse.vacantRooms}</p>
                            </div>
                            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                                <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest mb-1">Vacant Units</p>
                                <p className="text-2xl font-bold text-stone-900">{businessPulse.vacantRooms}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className={cn("bg-white rounded-[2.5rem] border border-stone-100 shadow-sm", isMobile ? "p-6" : "p-8")}>
                    <h3 className="text-lg font-bold text-stone-900 mb-6 uppercase tracking-widest text-sm">Recent Activity</h3>
                    <div className="space-y-4">
                        {businessPulse.recentPayments.slice(0, 4).map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-stone-100 flex items-center justify-center">
                                        <DollarSign className="h-4 w-4 text-stone-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-stone-900">{payment.profiles?.name}</p>
                                        <p className="text-[10px] text-stone-500">{payment.tenancies?.rooms?.room_name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-stone-900">₦{Number(payment.amount).toLocaleString()}</p>
                                    <Badge className={cn(
                                        "text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border-none",
                                        payment.status === "success" ? "bg-primary/10 text-primary" : "bg-stone-100 text-stone-600"
                                    )}>
                                        {payment.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                        {businessPulse.recentPayments.length === 0 && (
                            <div className="text-center py-8">
                                <Clock className="h-8 w-8 text-stone-300 mx-auto mb-3" />
                                <p className="text-stone-500 text-sm">No recent payments</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions Footer */}
            <div className={cn("bg-stone-50 rounded-[2.5rem] border border-stone-200", isMobile ? "p-6" : "p-8")}>
                <h3 className="text-lg font-bold text-stone-900 mb-6 uppercase tracking-widest text-sm">Quick Actions</h3>
                <div className={cn("grid md:grid-cols-4", isMobile ? "grid-cols-2 gap-3" : "gap-4")}>
                    <Button
                        onClick={() => navigate("/landlord/properties")}
                        variant="outline"
                        className={cn("rounded-2xl border-stone-300 hover:bg-stone-100 flex flex-col items-center gap-2", isMobile ? "h-14" : "h-16")}
                    >
                        <Home className="h-6 w-6" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Add Property</span>
                    </Button>

                    <Button
                        onClick={() => navigate("/landlord/broadcasts")}
                        variant="outline"
                        className={cn("rounded-2xl border-stone-300 hover:bg-stone-100 flex flex-col items-center gap-2", isMobile ? "h-14" : "h-16")}
                    >
                        <Megaphone className="h-6 w-6" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Send Message</span>
                    </Button>

                    <Button
                        onClick={() => navigate("/landlord/financials")}
                        variant="outline"
                        className={cn("rounded-2xl border-stone-300 hover:bg-stone-100 flex flex-col items-center gap-2", isMobile ? "h-14" : "h-16")}
                    >
                        <TrendingUp className="h-6 w-6" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">View Reports</span>
                    </Button>

                    <Button
                        onClick={() => navigate("/landlord/residents")}
                        variant="outline"
                        className={cn("rounded-2xl border-stone-300 hover:bg-stone-100 flex flex-col items-center gap-2", isMobile ? "h-14" : "h-16")}
                    >
                        <Users className="h-6 w-6" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Manage Tenants</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LandlordOverview;
