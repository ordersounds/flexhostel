import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    ShieldCheck,
    Building2,
    Users,
    CreditCard,
    ArrowUpRight,
    TrendingUp,
    LayoutDashboard,
    Box,
    Settings,
    Bell,
    CheckCircle2,
    XCircle,
    Clock,
    LogOut,
    Megaphone,
    Plus,
    MoreVertical,
    MessageSquare,
    ChevronRight
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const LandlordDashboard = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        occupancyRate: 0,
        pendingApps: 0,
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "applications" | "inventory" | "settings">("overview");

    // Broadcast state
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const [broadcastTitle, setBroadcastTitle] = useState("");
    const [broadcastContent, setBroadcastContent] = useState("");
    const [broadcastBuildingId, setBroadcastBuildingId] = useState("");
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate("/auth");
                return;
            }

            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();

            if (profileData?.role !== "landlord") {
                toast.error("Access denied. Landlord credentials required.");
                navigate("/dashboard");
                return;
            }
            setProfile(profileData);

            // Fetch Applications
            const { data: apps } = await supabase
                .from("applications")
                .select(`
          *,
          applicant:profiles!applications_user_id_fkey (name, email),
          rooms (room_name, price)
        `)
                .order("created_at", { ascending: false });

            setApplications(apps || []);

            // Fetch Rooms for stats and broadcast
            const { data: roomData } = await supabase
                .from("rooms")
                .select("*, buildings(*)"); // Fetch building details

            setRooms(roomData || []);
            if (roomData && roomData.length > 0) {
                // Set default broadcast building to the first available building
                const uniqueBuildings = [...new Set(roomData.map(r => r.buildings?.id))];
                if (uniqueBuildings.length > 0) {
                    setBroadcastBuildingId(uniqueBuildings[0]);
                }
            }

            // Calculate simple stats
            const occupied = roomData?.filter(r => r.status === "occupied").length || 0;
            const total = roomData?.length || 1;
            setStats({
                totalRevenue: roomData?.filter(r => r.status === "occupied").reduce((acc, r) => acc + Number(r.price), 0) || 0,
                occupancyRate: Math.round((occupied / total) * 100),
                pendingApps: apps?.filter(a => a.status === "pending").length || 0,
            });

            setLoading(false);
        };

        fetchData();
    }, [navigate]);

    const handleApplication = async (appId: string, status: "approved" | "rejected") => {
        const { error } = await supabase
            .from("applications")
            .update({ status, approved_at: status === "approved" ? new Date().toISOString() : null })
            .eq("id", appId);

        if (error) {
            toast.error(`Failed to ${status} application`);
        } else {
            toast.success(`Application ${status} successfully`);
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
        }
    };

    const handleBroadcast = async () => {
        if (!broadcastTitle || !broadcastContent || !broadcastBuildingId) {
            toast.error("Please fill in all broadcast fields.");
            return;
        }

        setIsBroadcasting(true);
        const { error } = await supabase
            .from("broadcasts")
            .insert({
                title: broadcastTitle,
                content: broadcastContent,
                building_id: broadcastBuildingId,
                landlord_id: profile.id,
            });

        if (error) {
            toast.error("Failed to send broadcast.");
            console.error("Broadcast error:", error);
        } else {
            toast.success("Broadcast sent successfully!");
            setBroadcastTitle("");
            setBroadcastContent("");
            setIsBroadcastOpen(false);
        }
        setIsBroadcasting(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="font-display text-stone-400 font-medium uppercase tracking-widest">Accessing Management Core</p>
                </div>
            </div>
        );
    }

    // Extract unique buildings from rooms for the broadcast dropdown
    const uniqueBuildings = Array.from(new Map(rooms.map(room => [room.buildings?.id, room.buildings])).values())
        .filter(building => building !== null && building !== undefined);

    return (
        <div className="min-h-screen bg-stone-50">
            <Header />

            <main className="pt-32 pb-24">
                <div className="container mx-auto px-6 max-w-7xl">

                    {/* Dashboard Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
                        <div>
                            <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-xs mb-4">
                                <Building2 className="h-4 w-4" />
                                <span>Executive Management Suite</span>
                            </div>
                            <h1 className="font-display text-5xl md:text-7xl font-bold text-stone-900 tracking-tighter leading-none">
                                Portfolio<span className="text-primary">.</span>
                            </h1>
                            <p className="text-stone-500 text-lg md:text-xl mt-4 max-w-sm font-medium">
                                Real-time oversight of the Okitipupa flagship residency.
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
                                <DialogTrigger asChild>
                                    <Button className="rounded-full bg-stone-900 border-stone-800 text-white font-bold h-12 uppercase tracking-widest text-[10px] px-8">
                                        Broadcast update
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white rounded-[2rem] border-stone-100 shadow-2xl sm:max-w-[500px]">
                                    <DialogHeader>
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                            <Megaphone className="h-6 w-6 text-primary" />
                                        </div>
                                        <DialogTitle className="font-display text-2xl font-bold text-stone-900">Transmit Update</DialogTitle>
                                        <DialogDescription className="text-stone-500">
                                            Send a building-wide announcement to all flagship residents.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-6 py-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Building</label>
                                            <select
                                                className="w-full h-12 rounded-xl border-stone-100 bg-stone-50 px-4 text-sm font-medium focus:ring-primary focus:border-primary"
                                                value={broadcastBuildingId}
                                                onChange={(e) => setBroadcastBuildingId(e.target.value)}
                                            >
                                                <option value="">Select Building</option>
                                                {uniqueBuildings.map((b: any) => (
                                                    <option key={b?.id} value={b?.id}>{b?.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Headlines</label>
                                            <Input
                                                placeholder="Urgent: Maintenance Schedule"
                                                className="rounded-xl border-stone-100 h-12"
                                                value={broadcastTitle}
                                                onChange={(e) => setBroadcastTitle(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Transmission</label>
                                            <Textarea
                                                placeholder="Detailed message content..."
                                                className="rounded-xl border-stone-100 min-h-[120px]"
                                                value={broadcastContent}
                                                onChange={(e) => setBroadcastContent(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            className="w-full rounded-xl bg-primary h-14 font-bold uppercase tracking-widest text-xs"
                                            onClick={handleBroadcast}
                                            disabled={isBroadcasting}
                                        >
                                            {isBroadcasting ? "Transmitting..." : "Initiate Broadcast"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Button variant="outline" className="rounded-full border-stone-200 text-stone-400 h-12 px-6">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Core Stats Grid */}
                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm relative group overflow-hidden">
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                        <TrendingUp className="h-6 w-6 text-primary" />
                                    </div>
                                    <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">Projected Revenue</p>
                                    <h3 className="font-display text-4xl font-bold text-stone-900 mt-2">₦{(stats.totalRevenue / 1000000).toFixed(1)}M</h3>
                                </div>
                                <p className="text-green-500 text-xs font-bold uppercase tracking-widest mt-6 flex items-center gap-1">
                                    <ArrowUpRight className="h-3 w-3" />
                                    12.5% increase
                                </p>
                            </div>
                            <div className="absolute bottom-[-10%] right-[-10%] text-stone-50/50 font-display text-9xl font-bold opacity-10">NGN</div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm relative group overflow-hidden">
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="h-12 w-12 rounded-2xl bg-stone-50 flex items-center justify-center mb-6">
                                        <Users className="h-6 w-6 text-stone-400" />
                                    </div>
                                    <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">Occupancy Rate</p>
                                    <h3 className="font-display text-4xl font-bold text-stone-900 mt-2">{stats.occupancyRate}%</h3>
                                </div>
                                <div className="w-full bg-stone-100 h-2 rounded-full mt-6 overflow-hidden">
                                    <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${stats.occupancyRate}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm relative group overflow-hidden">
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="h-12 w-12 rounded-2xl bg-stone-50 flex items-center justify-center mb-6">
                                        <Clock className="h-6 w-6 text-stone-400" />
                                    </div>
                                    <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">Pending Decisions</p>
                                    <h3 className="font-display text-4xl font-bold text-stone-900 mt-2">{stats.pendingApps}</h3>
                                </div>
                                <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-6">Awaiting review</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Application Queue - Massive Table Style */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="font-display text-3xl font-bold text-stone-900 tracking-tight">Application Queue</h2>
                                <Button variant="ghost" className="text-primary font-bold uppercase tracking-widest text-[10px]">
                                    View All Archive <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-stone-50/50 border-b border-stone-100">
                                                <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Applicant</th>
                                                <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Intended Suite</th>
                                                <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                                                <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-50">
                                            {applications.length > 0 ? (
                                                applications.map((app) => (
                                                    <tr key={app.id} className="group hover:bg-stone-50/30 transition-colors">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 uppercase font-bold text-xs ring-4 ring-white shadow-sm">
                                                                    {app.applicant?.name?.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-stone-900">{app.applicant?.name}</p>
                                                                    <p className="text-[10px] text-stone-400 font-medium">{app.applicant?.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-2">
                                                                <Badge className="bg-stone-100 text-stone-600 border-none font-bold uppercase tracking-widest text-[8px]">Room {app.rooms?.room_name}</Badge>
                                                                <span className="text-[10px] text-stone-400 font-bold uppercase">₦{(app.rooms?.price / 1000).toLocaleString()}k</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <Badge className={`px-3 py-1 rounded-full font-bold uppercase tracking-widest text-[8px] ${app.status === "approved" ? "bg-green-50 text-green-600" :
                                                                app.status === "rejected" ? "bg-red-50 text-red-600" :
                                                                    "bg-stone-100 text-stone-400"
                                                                }`}>
                                                                {app.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            {app.status === "pending" ? (
                                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => handleApplication(app.id, "approved")}
                                                                        className="h-10 w-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                                                                    >
                                                                        <CheckCircle className="h-5 w-5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleApplication(app.id, "rejected")}
                                                                        className="h-10 w-10 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                                    >
                                                                        <XCircle className="h-5 w-5" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="text-stone-300 font-bold text-[8px] uppercase tracking-widest px-4">Decision Final</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-8 py-24 text-center">
                                                        <Clock className="h-12 w-12 text-stone-100 mx-auto mb-4" />
                                                        <p className="font-display text-xl text-stone-300 font-bold italic">Queue currently silent.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Portfolio Sidebar */}
                        <div className="space-y-12">
                            <div className="space-y-8">
                                <h2 className="font-display text-3xl font-bold text-stone-900 tracking-tight px-2">Inventory</h2>
                                <div className="bg-stone-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Active Inventory</p>
                                                <h4 className="text-2xl font-bold mt-1">{rooms.length} Suites</h4>
                                            </div>
                                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                                <MoreVertical className="h-5 w-5 text-white/40" />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {rooms.slice(0, 3).map(room => (
                                                <div key={room.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-2 w-2 rounded-full ${room.status === "available" ? "bg-green-400" : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"}`} />
                                                        <span className="font-bold text-sm tracking-tight text-white/90">Room {room.room_name}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{room.status}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <Button variant="ghost" className="w-full text-white/40 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[8px] mt-4">
                                            Explore Full Inventory <ArrowUpRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    </div>
                                    <div className="absolute top-[-20%] right-[-10%] text-white/5 font-display text-7xl font-bold">Okitipupa</div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
                                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
                                    <MessageSquare className="h-6 w-6 text-amber-500" />
                                </div>
                                <h3 className="font-display text-2xl font-bold text-stone-900 mb-2">Support Threads</h3>
                                <p className="text-stone-500 mb-6 font-medium text-sm leading-relaxed">Direct communication channels with active tenants and assigned agents.</p>
                                <Badge className="bg-amber-100 text-amber-600 border-none px-3 py-1 rounded-full font-bold uppercase tracking-widest text-[8px]">3 unread threads</Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default LandlordDashboard;
