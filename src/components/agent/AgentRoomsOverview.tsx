import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Home, MessageSquare, Building, Eye, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import TenantDetailDialog from "@/components/landlord/TenantDetailDialog";

const AgentRoomsOverview = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchAgentRooms();
    }, []);

    const fetchAgentRooms = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get rooms assigned to this agent
            const { data: roomsData, error } = await supabase
                .from("rooms")
                .select(`
                    id,
                    room_name,
                    status,
                    price,
                    cover_image_url,
                    buildings (
                        id,
                        name,
                        address
                    )
                `)
                .eq("agent_id", user.id);

            if (error) {
                console.error("Error fetching rooms:", error);
                toast.error("Failed to load your rooms");
                return;
            }

            // For each room, get the current tenant if occupied
            const roomsWithTenants = await Promise.all(
                (roomsData || []).map(async (room) => {
                    if (room.status === "occupied") {
                        const { data: tenancy } = await supabase
                            .from("tenancies")
                            .select(`
                                id,
                                start_date,
                                end_date,
                                tenant:profiles!tenancies_tenant_id_fkey (
                                    id,
                                    name,
                                    email,
                                    phone_number,
                                    photo_url
                                )
                            `)
                            .eq("room_id", room.id)
                            .eq("status", "active")
                            .maybeSingle();

                        return { ...room, tenancy };
                    }
                    return { ...room, tenancy: null };
                })
            );

            setRooms(roomsWithTenants);
        } catch (error) {
            console.error("Error:", error);
            toast.error("Failed to load rooms");
        } finally {
            setLoading(false);
        }
    };

    const handleMessageTenant = (tenantId: string) => {
        // Store the intended recipient in localStorage for MessageCenter to pick up
        localStorage.setItem('flexhostel-dm-recipient', tenantId);
        navigate("/agent/messages");
    };

    // Filter rooms based on search query
    const filteredRooms = useMemo(() => {
        if (!searchQuery.trim()) return rooms;

        const query = searchQuery.toLowerCase();
        return rooms.filter(room =>
            room.room_name?.toLowerCase().includes(query) ||
            room.buildings?.name?.toLowerCase().includes(query) ||
            room.tenancy?.tenant?.name?.toLowerCase().includes(query) ||
            room.tenancy?.tenant?.email?.toLowerCase().includes(query) ||
            room.tenancy?.tenant?.phone_number?.includes(query) ||
            room.status?.toLowerCase().includes(query)
        );
    }, [rooms, searchQuery]);

    // Calculate stats (from all rooms, not filtered)
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === "occupied").length;
    const vacantRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className={cn("animate-reveal-up pb-20", isMobile ? "space-y-6" : "space-y-10")}>
            {/* Header */}
            <div>
                <h2 className={cn("font-display font-bold text-stone-900 tracking-tighter", isMobile ? "text-3xl" : "text-5xl")}>
                    My Rooms<span className="text-primary">.</span>
                </h2>
                <p className="text-stone-500 mt-2 font-medium" style={{ fontSize: isMobile ? '14px' : '18px' }}>
                    Your assigned rooms and their current tenants.
                </p>
            </div>

            {/* Quick Stats */}
            <div className={cn("grid", isMobile ? "grid-cols-2 gap-4" : "grid-cols-4 gap-6")}>
                <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Total Rooms</p>
                    <p className="text-3xl font-bold text-stone-900">{totalRooms}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Occupied</p>
                    <p className="text-3xl font-bold text-primary">{occupiedRooms}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Vacant</p>
                    <p className="text-3xl font-bold text-stone-900">{vacantRooms}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Occupancy</p>
                    <p className="text-3xl font-bold text-stone-900">{occupancyRate}%</p>
                </div>
            </div>

            {/* Search Bar */}
            {rooms.length > 0 && (
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <Input
                        placeholder="Search rooms, tenants..."
                        className={cn("pl-11 rounded-2xl border-stone-100 bg-white", isMobile ? "h-12" : "h-14")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <p className="text-xs text-stone-500 mt-2 ml-1">
                            Showing {filteredRooms.length} of {rooms.length} rooms
                        </p>
                    )}
                </div>
            )}

            {/* Rooms Grid */}
            {rooms.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-stone-100 p-12 text-center">
                    <Home className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="font-display text-xl font-bold text-stone-900 mb-2">No Rooms Assigned</h3>
                    <p className="text-stone-500">You haven't been assigned any rooms yet. Contact the landlord for assignments.</p>
                </div>
            ) : filteredRooms.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-stone-100 p-12 text-center">
                    <Search className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="font-display text-xl font-bold text-stone-900 mb-2">No Results Found</h3>
                    <p className="text-stone-500">Try a different search term.</p>
                </div>
            ) : (
                <div className={cn("grid md:grid-cols-2 lg:grid-cols-3", isMobile ? "gap-4" : "gap-6")}>
                    {filteredRooms.map((room) => (
                        <div
                            key={room.id}
                            className="bg-white rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-500 overflow-hidden group"
                        >
                            {/* Room Image */}
                            <div className="relative h-40 overflow-hidden">
                                <img
                                    src={room.cover_image_url || "/placeholder.svg"}
                                    alt={room.room_name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <Badge className={cn(
                                    "absolute top-4 right-4 text-[8px] font-bold uppercase tracking-widest px-3 py-1 border-none",
                                    room.status === "occupied" ? "bg-primary/90 text-white" : "bg-stone-900/80 text-white"
                                )}>
                                    {room.status}
                                </Badge>
                                {/* Change Picture Button Removed due to RLS permissions */}
                            </div>

                            {/* Room Details */}
                            <div className={cn("p-6", isMobile ? "p-5" : "p-6")}>
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-display text-xl font-bold text-stone-900 tracking-tight">
                                            {room.room_name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-stone-500 mt-1">
                                            <Building className="h-3 w-3" />
                                            <span className="text-xs">{room.buildings?.name}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-primary">₦{(room.price / 1000).toFixed(0)}K/yr</p>
                                </div>

                                {/* Tenant Info or Vacant */}
                                {room.tenancy?.tenant ? (
                                    <div className="bg-stone-50 rounded-xl p-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-stone-200 overflow-hidden flex-shrink-0">
                                                {room.tenancy.tenant.photo_url ? (
                                                    <img src={room.tenancy.tenant.photo_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-bold text-stone-400">
                                                        {room.tenancy.tenant.name?.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-stone-900 text-sm truncate">{room.tenancy.tenant.name}</p>
                                                <p className="text-[10px] text-stone-500 truncate">{room.tenancy.tenant.phone_number || room.tenancy.tenant.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-stone-50 rounded-xl p-4 mb-4 text-center">
                                        <p className="text-stone-400 text-sm font-medium">No current tenant</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {room.tenancy?.tenant && (
                                        <>
                                            <TenantDetailDialog
                                                tenant={{
                                                    ...room.tenancy.tenant,
                                                    tenancies: [{
                                                        id: room.tenancy.id,
                                                        start_date: room.tenancy.start_date,
                                                        end_date: room.tenancy.end_date,
                                                        status: "active",
                                                        rooms: room
                                                    }]
                                                }}
                                                trigger={
                                                    <Button variant="outline" size="sm" className="flex-1 rounded-xl border-stone-200 h-10 text-[10px] font-bold uppercase tracking-widest">
                                                        <Eye className="h-3 w-3 mr-1.5" /> Details
                                                    </Button>
                                                }
                                            />
                                            <Button
                                                size="sm"
                                                className="flex-1 rounded-xl bg-stone-900 text-white h-10 text-[10px] font-bold uppercase tracking-widest"
                                                onClick={() => handleMessageTenant(room.tenancy.tenant.id)}
                                            >
                                                <MessageSquare className="h-3 w-3 mr-1.5" /> Message
                                            </Button>
                                        </>
                                    )}
                                    {!room.tenancy?.tenant && (
                                        <Button variant="outline" disabled className="flex-1 rounded-xl border-stone-200 h-10 text-[10px] font-bold uppercase tracking-widest text-stone-400 italic">
                                            Awaiting Tenant
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AgentRoomsOverview;
