import { useState, useEffect } from "react";
import { Shield, Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddAgentDialog from "./AddAgentDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const AgentsManagement = () => {
    const isMobile = useIsMobile();
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            // Get all agents
            const { data: agentData } = await supabase
                .from("profiles")
                .select("*")
                .eq("role", "agent");

            if (!agentData) {
                setAgents([]);
                return;
            }

            // Get comprehensive data for each agent
            const agentsWithStats = await Promise.all(
                agentData.map(async (agent) => {
                    // Get buildings assigned to agent - use raw query approach
                    const buildingsResult = await supabase
                        .from("buildings")
                        .select("id, name");
                    
                    // Filter in JS since agent_id column is new
                    const buildings = (buildingsResult.data || []).filter(
                        (b: any) => (b as any).agent_id === agent.id
                    );

                    // Get rooms assigned to agent (either directly or through buildings)
                    const { data: rooms } = await supabase
                        .from("rooms")
                        .select(`
                            id, price, status, building_id,
                            buildings(name)
                        `)
                        .eq("agent_id", agent.id);

                    const buildingIds = buildings?.map((b: any) => b.id) || [];
                    const { data: buildingRooms } = buildingIds.length > 0 
                        ? await supabase
                            .from("rooms")
                            .select(`
                                id, price, status, building_id,
                                buildings(name)
                            `)
                            .in("building_id", buildingIds)
                            .is("agent_id", null)
                        : { data: [] };

                    const allRooms = [...(rooms || []), ...(buildingRooms || [])];
                    const portfolioValue = allRooms.reduce((sum, room) => sum + (Number(room.price) || 0), 0);

                    // Calculate occupancy
                    const occupiedRooms = allRooms.filter(room => room.status === "occupied").length;
                    const occupancyRate = allRooms.length > 0 ? Math.round((occupiedRooms / allRooms.length) * 100) : 0;

                    // Get revenue data (last 30 days)
                    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    const roomIds = allRooms.map(r => r.id);

                    // First get tenancies for these rooms
                    const { data: tenancies } = await supabase
                        .from("tenancies")
                        .select("id")
                        .in("room_id", roomIds);

                    const tenancyIds = tenancies?.map(t => t.id) || [];

                    // Then get payments for those tenancies
                    const { data: recentPayments } = await supabase
                        .from("payments")
                        .select("amount, status")
                        .in("tenancy_id", tenancyIds)
                        .gte("created_at", thirtyDaysAgo.toISOString());

                    const totalRevenue = recentPayments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
                    const successfulPayments = recentPayments?.filter(p => p.status === "success").length || 0;
                    const totalPayments = recentPayments?.length || 0;
                    const collectionRate = totalPayments > 0 ? Math.round((successfulPayments / totalPayments) * 100) : 100;

                    return {
                        ...agent,
                        buildingsCount: buildings?.length || 0,
                        roomsCount: allRooms.length,
                        portfolioValue,
                        occupancyRate,
                        activeTenants: occupiedRooms,
                        monthlyRevenue: totalRevenue,
                        collectionRate
                    };
                })
            );

            setAgents(agentsWithStats);
        } catch (error) {
            console.error("Error fetching agents:", error);
            setAgents([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("animate-reveal-up pb-20", isMobile ? "space-y-8" : "space-y-12")}>
            <div className="flex justify-between items-end">
                <div>
                    <h2 className={cn("font-display font-bold text-stone-900 tracking-tighter", isMobile ? "text-3xl" : "text-5xl")}>
                        Agent Operations<span className="text-primary">.</span>
                    </h2>
                    <p className="text-stone-500 mt-2 font-medium" style={{fontSize: isMobile ? '14px' : '18px'}}>Oversee your operational staff and their performance metrics.</p>
                </div>
            </div>

            <div className="space-y-8">
                <div className={cn("flex items-center gap-4", isMobile ? "flex-col" : "justify-between")}>
                    <div className="relative flex-1 max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                        <Input placeholder="Search agents..." className={cn("pl-10 rounded-2xl border-stone-100", isMobile ? "h-12" : "h-14")} />
                    </div>
                    <AddAgentDialog
                        onSuccess={() => fetchAgents()}
                        trigger={
                            <Button className={cn("rounded-2xl bg-stone-900 text-white font-bold uppercase tracking-widest text-[10px]", isMobile ? "h-12 px-6 w-full" : "h-14 px-8")}>
                                <Shield className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} /> Hire New Agent
                            </Button>
                        }
                    />
                </div>

                <div className={cn("bg-white rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/20 overflow-hidden", isMobile ? "" : "")}>
                    {isMobile ? (
                        // Mobile: Card layout
                        <div className="p-6 space-y-6">
                            {agents.map((agent) => (
                                <div key={agent.id} className="bg-stone-50/30 rounded-2xl p-6 border border-stone-100/50">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-sm uppercase">
                                                {agent.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-stone-900 text-lg tracking-tight">{agent.name}</p>
                                                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{agent.email}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" className="h-8 w-8 p-0 text-stone-300 hover:text-stone-900">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Buildings</p>
                                                <p className="text-lg font-bold text-stone-900">{agent.buildingsCount}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Rooms</p>
                                                <p className="text-lg font-bold text-stone-900">{agent.roomsCount}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Occupancy</p>
                                                <p className="text-lg font-bold text-stone-900">{agent.occupancyRate}%</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Active Tenants</p>
                                                <p className="text-lg font-bold text-stone-900">{agent.activeTenants}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Monthly Revenue</p>
                                                <p className="text-lg font-bold text-stone-900">₦{(agent.monthlyRevenue / 1000).toFixed(0)}K</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Collection Rate</p>
                                                <p className="text-lg font-bold text-stone-900">{agent.collectionRate}%</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Button className="w-full rounded-xl bg-stone-900 h-12 font-bold uppercase tracking-widest text-[10px]">
                                        View Portfolio
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Desktop: Table layout
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-stone-50/50 border-b border-stone-100">
                                    <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Agent</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Buildings</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Rooms</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Occupancy</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Revenue</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {agents.map((agent) => (
                                    <tr key={agent.id} className="group hover:bg-stone-50/10 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-[10px] uppercase">
                                                    {agent.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-stone-900 text-sm tracking-tight">{agent.name}</p>
                                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{agent.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-bold text-stone-900 text-sm">{agent.buildingsCount}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="font-bold text-stone-900 text-sm">{agent.roomsCount}</p>
                                                <p className="text-[10px] text-stone-500">₦{(agent.portfolioValue / 1000).toFixed(0)}K value</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="font-bold text-stone-900 text-sm">{agent.occupancyRate}%</p>
                                                <p className="text-[10px] text-stone-500">{agent.activeTenants} tenants</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="font-bold text-stone-900 text-sm">₦{(agent.monthlyRevenue / 1000).toFixed(0)}K</p>
                                                <p className="text-[10px] text-stone-500">{agent.collectionRate}% collected</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Button variant="ghost" className="rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-stone-100">
                                                View Portfolio
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentsManagement;
