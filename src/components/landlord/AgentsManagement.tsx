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
        const { data: agentData } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "agent");

        setAgents(agentData || []);
        setLoading(false);
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
                                        <div>
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Coverage</p>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge className="bg-stone-100 text-stone-600 border-none text-[8px] font-bold uppercase tracking-widest px-3 py-1">Okitipupa Building</Badge>
                                                <Badge className="bg-stone-900 text-white border-none text-[8px] font-bold uppercase tracking-widest px-3 py-1">12 Rooms</Badge>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Performance</p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary w-[85%] rounded-full" />
                                                </div>
                                                <span className="text-sm font-bold text-stone-900">85%</span>
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
                                    <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Coverage</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Performance</th>
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
                                            <div className="flex flex-wrap gap-2">
                                                <Badge className="bg-stone-100 text-stone-600 border-none text-[8px] font-bold uppercase tracking-widest px-2.5 py-1">Okitipupa Building</Badge>
                                                <Badge className="bg-stone-900 text-white border-none text-[8px] font-bold uppercase tracking-widest px-2.5 py-1">12 Rooms</Badge>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden w-24">
                                                    <div className="h-full bg-primary w-[85%] rounded-full" />
                                                </div>
                                                <span className="text-[10px] font-bold text-stone-900">85%</span>
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
