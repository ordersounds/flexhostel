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
import LandlordSettings from "@/components/landlord/LandlordSettings";
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
        <div className="min-h-screen bg-stone-50 flex overflow-x-hidden">
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
                    className="fixed top-6 right-6 z-40 h-12 w-12 rounded-2xl bg-stone-900 text-white shadow-xl shadow-stone-900/20 hover:scale-110 transition-all duration-300"
                    size="sm"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            )}

            {/* Main Content Area */}
            <main className={cn(
                "flex-1 min-w-0 min-h-screen relative transition-all duration-300",
                isMobile ? "p-6" : "ml-80 p-12"
            )}>

                {/* Main Dynamic Viewport */}
                <div className="pb-24 w-full max-w-7xl mx-auto overflow-hidden">
                    <Routes>
                        <Route path="/" element={<LandlordOverview />} />
                        <Route path="/properties" element={<PropertyPortfolio />} />
                        <Route path="/financials" element={<LandlordFinancials />} />
                        <Route path="/applications" element={<ApplicationCenter />} />
                        <Route path="/residents" element={<ResidentsManagement />} />
                        <Route path="/agents" element={<AgentsManagement />} />
                        <Route path="/broadcasts" element={<BroadcastCenter />} />
                        <Route path="/settings" element={<LandlordSettings />} />
                        <Route path="*" element={<Navigate to="/landlord" replace />} />
                    </Routes>
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
