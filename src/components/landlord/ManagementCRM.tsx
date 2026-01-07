import { useState, useEffect } from "react";
import { Users, UserPlus, Phone, Mail, Shield, MapPin, Search, MoreVertical, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ManagementCRM = () => {
    const [tenants, setTenants] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const { data: tenantData } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "tenant")
            .eq("status", "active");

        const { data: agentData } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "agent");

        setTenants(tenantData || []);
        setAgents(agentData || []);
        setLoading(false);
    };

    return (
        <div className="space-y-12 animate-reveal-up">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="font-display text-5xl font-bold text-stone-900 tracking-tighter">
                        Directory<span className="text-primary">.</span>
                    </h2>
                    <p className="text-stone-500 text-lg mt-2 font-medium">Manage your network of residents and operations staff.</p>
                </div>
            </div>

            <Tabs defaultValue="tenants" className="w-full">
                <TabsList className="bg-stone-100/50 p-1.5 rounded-[1.5rem] mb-12 flex w-fit">
                    <TabsTrigger value="tenants" className="rounded-2xl px-8 py-3.5 data-[state=active]:bg-white data-[state=active]:shadow-lg text-xs font-bold uppercase tracking-widest text-stone-400 data-[state=active]:text-stone-900">
                        Active Residents
                    </TabsTrigger>
                    <TabsTrigger value="agents" className="rounded-2xl px-8 py-3.5 data-[state=active]:bg-white data-[state=active]:shadow-lg text-xs font-bold uppercase tracking-widest text-stone-400 data-[state=active]:text-stone-900">
                        Operational Agents
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tenants" className="space-y-8">
                    <div className="flex justify-between items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                            <Input placeholder="Search residents..." className="pl-10 h-14 rounded-2xl border-stone-100" />
                        </div>
                        <Button className="rounded-2xl bg-stone-900 text-white h-14 px-8 font-bold uppercase tracking-widest text-[10px]">
                            <UserPlus className="h-4 w-4 mr-2" /> Register Tenant
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tenants.map((tenant) => (
                            <div key={tenant.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-500 group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="h-16 w-16 rounded-[1.5rem] bg-stone-100 overflow-hidden shadow-inner p-1">
                                        {tenant.photo_url ? (
                                            <img src={tenant.photo_url} className="w-full h-full object-cover rounded-[1.2rem]" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-lg text-stone-400 uppercase">
                                                {tenant.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <button className="h-10 w-10 flex items-center justify-center text-stone-300 hover:text-stone-900 transition-colors">
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-display text-2xl font-bold text-stone-900 tracking-tight">{tenant.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[8px] uppercase tracking-widest px-2 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                Active Tenant
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="pt-4 space-y-3">
                                        <div className="flex items-center gap-3 text-stone-500">
                                            <div className="h-8 w-8 rounded-xl bg-stone-50 flex items-center justify-center">
                                                <Phone className="h-3.5 w-3.5" />
                                            </div>
                                            <span className="text-xs font-bold">{tenant.phone_number || "No contact"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-stone-500">
                                            <div className="h-8 w-8 rounded-xl bg-stone-50 flex items-center justify-center">
                                                <Mail className="h-3.5 w-3.5" />
                                            </div>
                                            <span className="text-xs font-bold truncate">{tenant.email}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-stone-50 flex items-center justify-between">
                                        <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest italic font-medium">Jan 2026 - Jan 2027</p>
                                        <Button variant="ghost" className="h-8 w-8 p-0 text-stone-300 hover:text-primary">
                                            <Star className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="agents" className="space-y-8">
                    <div className="flex justify-between items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                            <Input placeholder="Search agents..." className="pl-10 h-14 rounded-2xl border-stone-100" />
                        </div>
                        <Button className="rounded-2xl bg-stone-900 text-white h-14 px-8 font-bold uppercase tracking-widest text-[10px]">
                            <Shield className="h-4 w-4 mr-2" /> Hire New Agent
                        </Button>
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
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ManagementCRM;
