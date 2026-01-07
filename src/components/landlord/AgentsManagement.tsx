import { useState, useEffect } from "react";
import { Shield, Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddAgentDialog from "./AddAgentDialog";

const AgentsManagement = () => {
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
        <div className="space-y-12 animate-reveal-up">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="font-display text-5xl font-bold text-stone-900 tracking-tighter">
                        Agent Operations<span className="text-primary">.</span>
                    </h2>
                    <p className="text-stone-500 text-lg mt-2 font-medium">Oversee your operational staff and their performance metrics.</p>
                </div>
            </div>

            <div className="space-y-8">
                <div className="flex justify-between items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                        <Input placeholder="Search agents..." className="pl-10 h-14 rounded-2xl border-stone-100" />
                    </div>
                    <AddAgentDialog
                        onSuccess={() => fetchAgents()}
                        trigger={
                            <Button className="rounded-2xl bg-stone-900 text-white h-14 px-8 font-bold uppercase tracking-widest text-[10px]">
                                <Shield className="h-4 w-4 mr-2" /> Hire New Agent
                            </Button>
                        }
                    />
                </div>

                <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/20 overflow-hidden">
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
                </div>
            </div>
        </div>
    );
};

export default AgentsManagement;
