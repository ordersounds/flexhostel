import { useState, useEffect } from "react";
import { Users, UserPlus, Phone, Mail, Search, MoreVertical, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const ResidentsManagement = () => {
    const isMobile = useIsMobile();
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        setLoading(true);
        const { data: tenantData } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "tenant")
            .eq("status", "active");

        setTenants(tenantData || []);
        setLoading(false);
    };

    return (
        <div className={cn("animate-reveal-up pb-20", isMobile ? "space-y-8" : "space-y-12")}>
            <div className="flex justify-between items-end">
                <div>
                    <h2 className={cn("font-display font-bold text-stone-900 tracking-tighter", isMobile ? "text-3xl" : "text-5xl")}>
                        Resident Directory<span className="text-primary">.</span>
                    </h2>
                    <p className="text-stone-500 mt-2 font-medium" style={{fontSize: isMobile ? '14px' : '18px'}}>Manage your active tenant community and their accommodations.</p>
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
                    {tenants.map((tenant) => (
                        <div key={tenant.id} className={cn("bg-white rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-500 group", isMobile ? "p-6" : "p-8")}>
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn("rounded-[1.5rem] bg-stone-100 overflow-hidden shadow-inner p-1", isMobile ? "h-12 w-12" : "h-16 w-16")}>
                                    {tenant.photo_url ? (
                                        <img src={tenant.photo_url} className="w-full h-full object-cover rounded-[1.2rem]" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-stone-400 uppercase" style={{fontSize: isMobile ? '16px' : '18px'}}>
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
                                    <h4 className={cn("font-display font-bold text-stone-900 tracking-tight", isMobile ? "text-lg" : "text-2xl")}>{tenant.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[8px] uppercase tracking-widest px-2 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                            Active Tenant
                                        </Badge>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <div className="flex items-center gap-3 text-stone-500">
                                        <div className={cn("rounded-xl bg-stone-50 flex items-center justify-center", isMobile ? "h-7 w-7" : "h-8 w-8")}>
                                            <Phone className={cn("", isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />
                                        </div>
                                        <span className="text-xs font-bold">{tenant.phone_number || "No contact"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-stone-500">
                                        <div className={cn("rounded-xl bg-stone-50 flex items-center justify-center", isMobile ? "h-7 w-7" : "h-8 w-8")}>
                                            <Mail className={cn("", isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />
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
            </div>
        </div>
    );
};

export default ResidentsManagement;
