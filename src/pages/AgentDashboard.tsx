import { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

// Import Agent Components
import AgentSidebar from "@/components/agent/AgentSidebar";
import AgentRoomsOverview from "@/components/agent/AgentRoomsOverview";
import BroadcastCenter from "@/components/landlord/BroadcastCenter";

const AgentDashboard = () => {
    const navigate = useNavigate();
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

            if (profileData?.role !== "agent") {
                toast.error("Agent access required.");
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
                    <p className="font-display text-stone-400 font-bold uppercase tracking-[0.2em] text-[10px]">Loading Agent Portal</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 flex">
            {/* Sidebar */}
            <AgentSidebar
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
                "flex-1 min-h-screen relative transition-all duration-300",
                isMobile ? "p-6" : "ml-80 p-12"
            )}>
                {/* Main Dynamic Viewport */}
                <div className="pb-24 max-w-7xl mx-auto">
                    <Routes>
                        <Route path="/" element={<AgentRoomsOverview />} />
                        <Route path="/announcements" element={<BroadcastCenter isReadOnly={true} />} />
                        <Route path="*" element={<Navigate to="/agent" replace />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default AgentDashboard;
