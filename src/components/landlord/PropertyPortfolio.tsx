import { useState, useEffect } from "react";
import { Building2, Plus, DoorOpen, MapPin, MoreHorizontal, ChevronRight, Search, ArrowLeft, Users, CreditCard, LayoutDashboard, Image as ImageIcon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddBuildingDialog from "./AddBuildingDialog";
import AddRoomDialog from "./AddRoomDialog";
import RoomControlCenter from "./RoomControlCenter";
import ManageChargesDialog from "./ManageChargesDialog";
import { cn } from "@/lib/utils";

const PropertyPortfolio = () => {
    const [buildings, setBuildings] = useState<any[]>([]);
    const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

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
                tenancies:tenancies(
                    id,
                    status,
                    profiles:tenant_id (name, photo_url)
                )
            `)
            .eq("building_id", buildingId);

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

    if (selectedBuilding) {
        return (
            <div className="space-y-12 animate-reveal-up pb-20">
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
                            <h2 className="font-display text-4xl font-bold text-stone-900 tracking-tight">
                                {selectedBuilding.name}<span className="text-primary">.</span>
                            </h2>
                            <p className="text-stone-500 font-medium flex items-center gap-2 mt-1">
                                <MapPin className="h-4 w-4" /> {selectedBuilding.address}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <ManageChargesDialog
                            buildingId={selectedBuilding.id}
                            buildingName={selectedBuilding.name}
                            trigger={
                                <Button variant="outline" className="flex-1 md:flex-none rounded-2xl border-stone-200 h-16 px-8 font-bold uppercase tracking-widest text-[10px]">
                                    Manage Charges
                                </Button>
                            }
                        />
                        <AddRoomDialog
                            preselectedBuildingId={selectedBuilding.id}
                            onSuccess={() => fetchRooms(selectedBuilding.id)}
                            trigger={
                                <Button className="flex-1 md:flex-none rounded-2xl bg-stone-900 text-white h-16 px-8 font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-stone-900/20">
                                    <Plus className="h-4 w-4 mr-2" /> Add Room
                                </Button>
                            }
                        />
                    </div>
                </div>

                {/* Rooms Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {roomsLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-64 bg-stone-100 rounded-[2.5rem] animate-pulse" />)
                    ) : rooms.map((room) => {
                        const activeTenancy = room.tenancies?.find((t: any) => t.status === "active");
                        const tenantName = activeTenancy?.profiles?.name;

                        return (
                            <div key={room.id} className="group bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-stone-200/50 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8">
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
                                        <div className="h-14 w-14 rounded-2xl bg-stone-50 text-stone-900 flex items-center justify-center font-bold text-xl border border-stone-100 group-hover:bg-stone-900 group-hover:text-white transition-colors duration-500">
                                            {room.room_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-display text-2xl font-bold text-stone-900 tracking-tight leading-none">{room.room_name}</h4>
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-2 flex items-center gap-1">
                                                <CreditCard className="h-3 w-3" /> ₦{room.price.toLocaleString()}/year
                                            </p>
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

                                    <div className="pt-2 flex gap-3">
                                        <RoomControlCenter
                                            roomId={room.id}
                                            onSuccess={() => fetchRooms(selectedBuilding.id)}
                                            trigger={
                                                <Button className="flex-1 rounded-xl bg-stone-900 h-14 font-bold uppercase tracking-widest text-[10px]">
                                                    Room Control
                                                </Button>
                                            }
                                        />
                                        <Button variant="outline" className="h-14 w-14 rounded-xl border-stone-200 p-0 hover:bg-stone-50">
                                            <MoreHorizontal className="h-5 w-5 text-stone-400" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <AddRoomDialog
                        preselectedBuildingId={selectedBuilding.id}
                        onSuccess={() => fetchRooms(selectedBuilding.id)}
                        trigger={
                            <button className="h-full min-h-[300px] border-2 border-dashed border-stone-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-stone-50/50 transition-all group group-hover:shadow-2xl">
                                <div className="h-14 w-14 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <Plus className="h-7 w-7" />
                                </div>
                                <p className="font-display text-xl font-bold text-stone-400 group-hover:text-stone-900 tracking-tight transition-colors">Add Unit</p>
                            </button>
                        }
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-reveal-up">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="font-display text-5xl font-bold text-stone-900 tracking-tighter">
                        Property Portfolio<span className="text-primary">.</span>
                    </h2>
                    <p className="text-stone-500 text-lg mt-1 font-medium">Manage your buildings and rental units.</p>
                </div>
                <AddBuildingDialog onSuccess={() => fetchBuildings()} trigger={
                    <Button className="rounded-2xl bg-stone-900 text-white h-16 px-8 font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-stone-900/20">
                        <Plus className="h-4 w-4 mr-2" /> Add Building
                    </Button>
                } />
            </div>

            {/* Search */}
            <div className="flex justify-start">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <Input
                        placeholder="Search buildings or locations..."
                        className="pl-10 h-14 rounded-2xl border-stone-100"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {
                loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-80 bg-stone-100 rounded-[2.5rem] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredBuildings.map((building) => (
                            <div
                                key={building.id}
                                onClick={() => handleSelectBuilding(building)}
                                className="group relative bg-white rounded-[2.5rem] border border-stone-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-stone-200/50 transition-all duration-500 cursor-pointer"
                            >
                                {/* Cover Image */}
                                <div className="h-52 relative overflow-hidden">
                                    <img
                                        src={building.cover_image_url || "/placeholder.svg"}
                                        alt={building.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <Badge className="absolute top-6 left-6 bg-white/20 backdrop-blur-md text-white border-none font-bold uppercase tracking-widest text-[9px] px-3 py-1.5 rounded-full">
                                        {building.rooms?.length || 0} Units
                                    </Badge>
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <h3 className="font-display text-2xl font-bold text-white tracking-tight">{building.name}</h3>
                                        <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">
                                            <MapPin className="h-3 w-3" /> {building.address}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 text-center">Occupancy</p>
                                            <p className="text-xl font-bold text-stone-900 text-center tracking-tight">
                                                {building.rooms?.length > 0
                                                    ? Math.round((building.rooms.filter((r: any) => r.status === "occupied").length / building.rooms.length) * 100)
                                                    : 0}%
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1 text-center">Status</p>
                                            <p className="text-xl font-bold text-emerald-600 text-center tracking-tight uppercase tracking-wider text-xs">{building.status}</p>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex gap-3">
                                        <Button className="flex-1 rounded-xl bg-stone-900 h-14 font-bold uppercase tracking-widest text-[10px]">
                                            Explore Assets
                                        </Button>
                                        <Button variant="outline" className="h-14 w-14 rounded-xl border-stone-200 p-0 hover:bg-stone-50 transition-colors">
                                            <ChevronRight className="h-5 w-5 text-stone-400" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* New Building Ghost Card */}
                        <AddBuildingDialog onSuccess={() => fetchBuildings()} trigger={
                            <button className="h-full min-h-[400px] border-2 border-dashed border-stone-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-stone-50/50 transition-all group group-hover:shadow-2xl">
                                <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <Plus className="h-8 w-8" />
                                </div>
                                <p className="font-display text-xl font-bold text-stone-400 group-hover:text-stone-900 tracking-tight transition-colors">Expand Portfolio</p>
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
