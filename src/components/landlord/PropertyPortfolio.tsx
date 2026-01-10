import { useState, useEffect } from "react";
import { Building2, Plus, DoorOpen, MapPin, MoreHorizontal, ChevronRight, Search, ArrowLeft, Users, CreditCard, LayoutDashboard, Image as ImageIcon, Shield, Layers, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddBuildingDialog from "./AddBuildingDialog";
import AddRoomDialog from "./AddRoomDialog";
import RoomControlCenter from "./RoomControlCenter";
import ManageChargesDialog from "./ManageChargesDialog";
import BuildingOptionsMenu from "./BuildingOptionsMenu";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const PropertyPortfolio = () => {
    const isMobile = useIsMobile();
    const [buildings, setBuildings] = useState<any[]>([]);
    const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [roomSearchQuery, setRoomSearchQuery] = useState("");

    useEffect(() => {
        fetchBuildings();
    }, []);

    const fetchBuildings = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("buildings")
            .select(`
                *,
                rooms (
                    id,
                    status
                )
            `);

        if (error) {
            toast.error("Failed to load portfolio");
        } else {
            setBuildings(data || []);
        }
        setLoading(false);
    };

    const fetchRooms = async (buildingId: string) => {
        setRoomsLoading(true);
        const { data, error } = await supabase
            .from("rooms")
            .select(`
                *,
                profiles:agent_id (name),
                blocks:block_id (name),
                tenancies:tenancies(
                    id,
                    status,
                    profiles:tenant_id (name, photo_url)
                )
            `)
            .eq("building_id", buildingId)
            .order("room_name");

        if (error) {
            toast.error("Failed to load rooms");
        } else {
            setRooms(data || []);
        }
        setRoomsLoading(false);
    };

    const handleSelectBuilding = (building: any) => {
        setSelectedBuilding(building);
        fetchRooms(building.id);
    };

    const handleBack = () => {
        setSelectedBuilding(null);
        setRooms([]);
    };

    const filteredBuildings = buildings.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredRooms = rooms.filter(room => {
        const activeTenancy = room.tenancies?.find((t: any) => t.status === "active");
        const tenantName = activeTenancy?.profiles?.name || "";
        const roomName = room.room_name || "";

        return roomName.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
               tenantName.toLowerCase().includes(roomSearchQuery.toLowerCase());
    });

    if (selectedBuilding) {
        return (
            <div className={cn("animate-reveal-up pb-20", isMobile ? "space-y-8" : "space-y-12")}>
                {/* Building Context Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-4">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-stone-400 hover:text-stone-900 font-bold uppercase tracking-widest text-[10px] transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Portfolio
                        </button>
                        <div>
                            <h2 className={cn("font-display font-bold text-stone-900 tracking-tight", isMobile ? "text-2xl" : "text-4xl")}>
                                {selectedBuilding.name}<span className="text-primary">.</span>
                            </h2>
                            <p className="text-stone-500 font-medium flex items-center gap-2 mt-1" style={{fontSize: isMobile ? '14px' : '16px'}}>
                                <MapPin className="h-4 w-4" /> {selectedBuilding.address}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <ManageChargesDialog
                            buildingId={selectedBuilding.id}
                            buildingName={selectedBuilding.name}
                            trigger={
                                <Button variant="outline" className={cn("rounded-2xl border-stone-200 font-bold uppercase tracking-widest text-[10px]", isMobile ? "flex-1 h-12 px-6" : "flex-1 md:flex-none h-16 px-8")}>
                                    Manage Charges
                                </Button>
                            }
                        />
                        <AddRoomDialog
                            preselectedBuildingId={selectedBuilding.id}
                            onSuccess={() => fetchRooms(selectedBuilding.id)}
                            trigger={
                                <Button className={cn("rounded-2xl bg-stone-900 text-white font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-stone-900/20", isMobile ? "flex-1 h-12 px-6" : "flex-1 md:flex-none h-16 px-8")}>
                                    <Plus className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} /> Add Room
                                </Button>
                            }
                        />
                    </div>
                </div>

                {/* Room Search */}
                <div className="flex justify-start">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                        <Input
                            placeholder="Search rooms or tenants..."
                            className={cn("pl-10 rounded-2xl border-stone-100", isMobile ? "h-12" : "h-14")}
                            value={roomSearchQuery}
                            onChange={(e) => setRoomSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Rooms Grid */}
                <div className={cn("grid md:grid-cols-2 lg:grid-cols-3", isMobile ? "gap-6" : "gap-8")}>
                    {roomsLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-64 bg-stone-100 rounded-[2.5rem] animate-pulse" />)
                    ) : filteredRooms.map((room) => {
                        const activeTenancy = room.tenancies?.find((t: any) => t.status === "active");
                        const tenantName = activeTenancy?.profiles?.name;

                        return (
                            <div key={room.id} className={cn("group bg-white rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-2xl hover:shadow-stone-200/50 transition-all duration-500 relative overflow-hidden", isMobile ? "p-6" : "p-8")}>
                                <div className={cn("absolute top-0 right-0 flex items-center gap-2", isMobile ? "p-6" : "p-8")}>
                                    {room.blocks?.name && (
                                        <Badge className="rounded-full px-2 py-1 font-bold uppercase tracking-widest text-[8px] border-none shadow-sm bg-primary/10 text-primary">
                                            {room.blocks.name}
                                        </Badge>
                                    )}
                                    <Badge className={cn(
                                        "rounded-full px-3 py-1 font-bold uppercase tracking-widest text-[8px] border-none shadow-sm",
                                        room.status === "available" ? "bg-emerald-50 text-emerald-600" :
                                            room.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-stone-100 text-stone-400"
                                    )}>
                                        {room.status}
                                    </Badge>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("rounded-2xl bg-stone-50 text-stone-900 flex items-center justify-center font-bold text-xl border border-stone-100 group-hover:bg-stone-900 group-hover:text-white transition-colors duration-500", isMobile ? "h-12 w-12" : "h-14 w-14")}>
                                            {room.room_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className={cn("font-display font-bold text-stone-900 tracking-tight leading-none", isMobile ? "text-lg" : "text-2xl")}>{room.room_name}</h4>
                                            <div className="flex items-center gap-3 mt-2">
                                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                                                    <CreditCard className="h-3 w-3" /> ₦{room.price.toLocaleString()}/yr
                                                </p>
                                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                                                    {room.floor_level === "upstairs" ? <ArrowUp className="h-3 w-3" /> : 
                                                     room.floor_level === "downstairs" ? <ArrowDown className="h-3 w-3" /> : 
                                                     <Minus className="h-3 w-3" />}
                                                    {room.floor_level || "ground"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-stone-50 space-y-4">
                                        <div className="flex justify-between items-center text-xs font-medium">
                                            <span className="text-stone-400 flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Resident</span>
                                            <span className="text-stone-900 font-bold">{tenantName || "Unoccupied"}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-medium">
                                            <span className="text-stone-400 flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Agent</span>
                                            <span className="text-stone-900 font-bold">{room.profiles?.name || "None"}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <RoomControlCenter
                                            roomId={room.id}
                                            onSuccess={() => fetchRooms(selectedBuilding.id)}
                                            trigger={
                                                <Button variant="outline" className={cn("w-full rounded-xl border-stone-200 font-bold uppercase tracking-widest text-[10px]", isMobile ? "h-12" : "h-14")}>
                                                    Room Control
                                                </Button>
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <AddRoomDialog
                        preselectedBuildingId={selectedBuilding.id}
                        onSuccess={() => fetchRooms(selectedBuilding.id)}
                        trigger={
                            <button className={cn("h-full min-h-[300px] border-2 border-dashed border-stone-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-stone-50/50 transition-all group group-hover:shadow-2xl", isMobile ? "min-h-[250px]" : "min-h-[300px]")}>
                                <div className={cn("rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-primary group-hover:text-white transition-all duration-300", isMobile ? "h-12 w-12" : "h-14 w-14")}>
                                    <Plus className={cn("", isMobile ? "h-6 w-6" : "h-7 w-7")} />
                                </div>
                                <p className={cn("font-display font-bold text-stone-400 group-hover:text-stone-900 tracking-tight transition-colors", isMobile ? "text-lg" : "text-xl")}>Add Unit</p>
                            </button>
                        }
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={cn("animate-reveal-up", isMobile ? "space-y-8" : "space-y-12")}>
            {/* Header */}
            <div className={cn(isMobile ? "flex flex-col gap-4" : "flex justify-between items-end")}>
                <div>
                    <h2 className={cn("font-display font-bold text-stone-900 tracking-tighter", isMobile ? "text-3xl" : "text-5xl")}>
                        Property Portfolio<span className="text-primary">.</span>
                    </h2>
                    <p className="text-stone-500 mt-1 font-medium" style={{fontSize: isMobile ? '14px' : '18px'}}>Manage your buildings and rental units.</p>
                </div>
                <AddBuildingDialog onSuccess={() => fetchBuildings()} trigger={
                    <Button className={cn("rounded-2xl bg-stone-900 text-white font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-stone-900/20", isMobile ? "h-12 px-6 w-full" : "h-16 px-8")}>
                        <Plus className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} /> Add Building
                    </Button>
                } />
            </div>

            {/* Search */}
            <div className="flex justify-start">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <Input
                        placeholder="Search buildings or locations..."
                        className={cn("pl-10 rounded-2xl border-stone-100", isMobile ? "h-12" : "h-14")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {
                loading ? (
                    <div className={cn("grid md:grid-cols-2 lg:grid-cols-3", isMobile ? "gap-6" : "gap-8")}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className={cn("bg-stone-100 rounded-[2.5rem] animate-pulse", isMobile ? "h-72" : "h-80")} />
                        ))}
                    </div>
                ) : (
                    <div className={cn("grid md:grid-cols-2 lg:grid-cols-3", isMobile ? "gap-6" : "gap-8")}>
                        {filteredBuildings.map((building) => (
                            <div
                                key={building.id}
                                className="group relative bg-white rounded-[2.5rem] border border-stone-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-stone-200/50 transition-all duration-500 cursor-pointer"
                            >
                                <BuildingOptionsMenu
                                    buildingId={building.id}
                                    buildingName={building.name}
                                    currentImageUrl={building.cover_image_url || ""}
                                    currentAgentId={building.agent_id}
                                    currentName={building.name}
                                    currentAddress={building.address}
                                    onSuccess={() => fetchBuildings()}
                                />

                                {/* Cover Image */}
                                <div
                                    className={cn("relative overflow-hidden", isMobile ? "h-40" : "h-52")}
                                    onClick={() => handleSelectBuilding(building)}
                                >
                                    <img
                                        src={building.cover_image_url || "/placeholder.svg"}
                                        alt={building.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <Badge className={cn("absolute bg-white/20 backdrop-blur-md text-white border-none font-bold uppercase tracking-widest text-[9px] px-3 py-1.5 rounded-full", isMobile ? "top-4 left-4" : "top-6 left-6")}>
                                        {building.rooms?.length || 0} Units
                                    </Badge>
                                    <div className={cn("absolute", isMobile ? "bottom-4 left-4 right-4" : "bottom-6 left-6 right-6")}>
                                        <h3 className={cn("font-display font-bold text-white tracking-tight", isMobile ? "text-lg" : "text-2xl")}>{building.name}</h3>
                                        <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">
                                            <MapPin className={cn("", isMobile ? "h-2.5 w-2.5" : "h-3 w-3")} /> {building.address}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className={cn("space-y-6", isMobile ? "p-6" : "p-8")}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 text-center">Occupancy</p>
                                            <p className={cn("font-bold text-stone-900 text-center tracking-tight", isMobile ? "text-lg" : "text-xl")}>
                                                {building.rooms?.length > 0
                                                    ? Math.round((building.rooms.filter((r: any) => r.status === "occupied").length / building.rooms.length) * 100)
                                                    : 0}%
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1 text-center">Status</p>
                                            <p className={cn("font-bold text-emerald-600 text-center tracking-tight uppercase tracking-wider text-xs", isMobile ? "text-xs" : "text-xs")}>{building.status}</p>
                                        </div>
                                    </div>


                                </div>
                            </div>
                        ))}

                        {/* New Building Ghost Card */}
                        <AddBuildingDialog onSuccess={() => fetchBuildings()} trigger={
                            <button className={cn("h-full border-2 border-dashed border-stone-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-stone-50/50 transition-all group group-hover:shadow-2xl", isMobile ? "min-h-[300px]" : "min-h-[400px]")}>
                                <div className={cn("rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-primary group-hover:text-white transition-all duration-300", isMobile ? "h-14 w-14" : "h-16 w-16")}>
                                    <Plus className={cn("", isMobile ? "h-7 w-7" : "h-8 w-8")} />
                                </div>
                                <p className={cn("font-display font-bold text-stone-400 group-hover:text-stone-900 tracking-tight transition-colors", isMobile ? "text-lg" : "text-xl")}>Expand Portfolio</p>
                                <p className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.2em]">Add new building</p>
                            </button>
                        } />
                    </div>
                )
            }
        </div >
    );
};

export default PropertyPortfolio;
