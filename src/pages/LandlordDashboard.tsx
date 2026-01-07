import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    LayoutDashboard,
    Building2,
    Inbox,
    Users,
    CreditCard,
    Megaphone,
    Settings,
    LogOut,
    Plus,
    Bell,
    User,
    Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Import Modular Sections
import LandlordSidebar from "@/components/landlord/LandlordSidebar";
import LandlordOverview from "@/components/landlord/LandlordOverview";
import PropertyPortfolio from "@/components/landlord/PropertyPortfolio";
import ApplicationCenter from "@/components/landlord/ApplicationCenter";
import ResidentsManagement from "@/components/landlord/ResidentsManagement";
import AgentsManagement from "@/components/landlord/AgentsManagement";
import BroadcastCenter from "@/components/landlord/BroadcastCenter";
import AddBuildingDialog from "@/components/landlord/AddBuildingDialog";
import AddRoomDialog from "@/components/landlord/AddRoomDialog";
import LandlordFinancials from "@/components/landlord/LandlordFinancials";

const LandlordDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useIsMobile();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
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
                toast.error("Executive access required.");
                navigate("/dashboard");
                return;
            }
            setProfile(profileData);
            setLoading(false);
        };

        checkAccess();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
        toast.success("Signed out successfully");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="h-16 w-16 border-4 border-stone-200 border-t-primary rounded-3xl animate-[spin_1.5s_linear_infinite]" />
                    <p className="font-display text-stone-400 font-bold uppercase tracking-[0.2em] text-[10px]">Authenticating Admin Core</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 flex">
            {/* Modular Sidebar */}
            <LandlordSidebar
                onLogout={handleLogout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Mobile Hamburger Button */}
            {isMobile && (
                <Button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed top-6 left-6 z-40 h-12 w-12 rounded-2xl bg-stone-900 text-white shadow-xl shadow-stone-900/20 hover:scale-110 transition-all duration-300"
                    size="sm"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            )}

            {/* Main Content Area */}
            <main className={cn(
                "flex-1 min-h-screen relative transition-all duration-300",
                isMobile ? "p-6" : "ml-80 p-12"
            )}>

                {/* Main Dynamic Viewport */}
                <div className="pb-24 max-w-7xl mx-auto">
                    <Routes>
                        <Route path="/" element={<LandlordOverview />} />
                        <Route path="/properties" element={<PropertyPortfolio />} />
                        <Route path="/financials" element={<LandlordFinancials />} />
                        <Route path="/applications" element={<ApplicationCenter />} />
                        <Route path="/residents" element={<ResidentsManagement />} />
                        <Route path="/agents" element={<AgentsManagement />} />
                        <Route path="/broadcasts" element={<BroadcastCenter />} />
                        <Route path="*" element={<Navigate to="/landlord" replace />} />
                    </Routes>
                </div>

                {/* Floating Action Center (Product Focus) */}
                <div className={cn(
                    "fixed z-50",
                    isMobile ? "bottom-6 right-6" : "bottom-12 right-12"
                )}>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="h-20 w-20 rounded-[2rem] bg-stone-900 text-white shadow-2xl shadow-stone-900/40 hover:scale-110 active:scale-95 transition-all duration-300 group">
                                <Plus className="h-8 w-8 transition-transform group-hover:rotate-90 duration-500" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm bg-white rounded-[3rem] border-stone-100 p-8 shadow-2xl">
                            <div className="space-y-6">
                                <h4 className="font-display text-2xl font-bold text-stone-900 tracking-tight">Expedite Operation</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <AddBuildingDialog trigger={
                                        <button className="flex items-center gap-4 p-5 rounded-3xl hover:bg-stone-50 transition-all group text-left w-full">
                                            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-stone-900 text-sm tracking-tight">New Building</p>
                                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Expand Portfolio</p>
                                            </div>
                                        </button>
                                    } />

                                    <AddRoomDialog trigger={
                                        <button className="flex items-center gap-4 p-5 rounded-3xl hover:bg-stone-50 transition-all group text-left w-full">
                                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                                                <LayoutDashboard className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-stone-900 text-sm tracking-tight">New Room</p>
                                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Unit Inventory</p>
                                            </div>
                                        </button>
                                    } />

                                    <button className="flex items-center gap-4 p-5 rounded-3xl hover:bg-stone-50 transition-all group text-left">
                                        <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-stone-900 text-sm tracking-tight">Hire Agent</p>
                                            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Instant Action</p>
                                        </div>
                                    </button>

                                    <button className="flex items-center gap-4 p-5 rounded-3xl hover:bg-stone-50 transition-all group text-left">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                                            <Megaphone className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-stone-900 text-sm tracking-tight">Broadcast Update</p>
                                            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Instant Action</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </main>
        </div>
    );
};

// Internal Shorthand components for simpler imports
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default LandlordDashboard;
