import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    DoorOpen,
    Users,
    Shield,
    CreditCard,
    Image as ImageIcon,
    Settings2,
    CheckCircle2,
    XCircle,
    Clock,
    ExternalLink,
    Save,
    Loader2,
    Receipt
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoomControlCenterProps {
    roomId: string;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const RoomControlCenter = ({ roomId, onSuccess, trigger, open: externalOpen, onOpenChange }: RoomControlCenterProps) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [charges, setCharges] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [editMode, setEditMode] = useState(false);

    const [formData, setFormData] = useState({
        price: "",
        amenities: "",
        agent_id: "",
        cover_image_url: "",
        block_id: "",
        floor_level: "ground",
    });
    const [blocks, setBlocks] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            fetchRoomDetails();
            fetchAgents();
        }
    }, [open, roomId]);

    const fetchRoomDetails = async () => {
        setLoading(true);
        const { data: room, error } = await supabase
            .from("rooms")
            .select(`
                *,
                buildings (id, name, address),
                blocks:block_id (id, name),
                tenancies:tenancies (
                    *,
                    profiles:tenant_id (*),
                    payments:payments!tenancy_id (*)
                ),
                applications:applications (
                    *,
                    payments:payments!application_id (*)
                )
            `)
            .eq("id", roomId)
            .single();

        if (error) {
            console.error("Room fetch error:", error);
            toast.error("Failed to load room details");
        } else {
            setData(room);
            setFormData({
                price: room.price.toString(),
                amenities: Array.isArray(room.amenities) ? room.amenities.join(", ") : "",
                agent_id: room.agent_id || "",
                cover_image_url: room.cover_image_url || "",
                block_id: room.block_id || "",
                floor_level: room.floor_level || "ground",
            });

            // Fetch blocks for this building
            if (room.building_id) {
                const { data: blocksData } = await supabase
                    .from("blocks")
                    .select("id, name")
                    .eq("building_id", room.building_id)
                    .order("name");
                setBlocks(blocksData || []);
            }

        }
        setLoading(false);
    };

    const fetchAgents = async () => {
        const { data: aData } = await supabase.from("profiles").select("id, name").eq("role", "agent");
        setAgents(aData || []);
    };

    const handleUpdate = async () => {
        setLoading(true);
        const amenitiesArray = formData.amenities.split(",").map(s => s.trim()).filter(Boolean);

        const { error } = await supabase
            .from("rooms")
            .update({
                price: Number(formData.price),
                amenities: amenitiesArray,
                agent_id: formData.agent_id || null,
                cover_image_url: formData.cover_image_url || null,
                block_id: formData.block_id || null,
                floor_level: formData.floor_level,
            })
            .eq("id", roomId);

        if (error) {
            toast.error("Update failed: " + error.message);
        } else {
            toast.success("Room parameters updated");
            setEditMode(false);
            fetchRoomDetails();
            onSuccess?.();
        }
        setLoading(false);
    };

    // Removed early return to keep Dialog mounted

    const activeTenancy = data?.tenancies?.find((t: any) => t.status === "active");
    const tenant = activeTenancy?.profiles;

    // Flatten all payments across all tenancies and applications for this room
    const tenancyPayments = data?.tenancies?.flatMap((t: any) => t.payments || []) || [];
    const applicationPayments = data?.applications?.flatMap((a: any) => a.payments || []) || [];
    const allPayments = [...tenancyPayments, ...applicationPayments];

    // Calculate total revenue from successful payments
    const totalRevenue = allPayments
        ?.filter((p: any) => p.status === "success")
        ?.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0) || 0;

    // Sort payments by date (newest first)
    const sortedPayments = [...allPayments].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Control Room</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-white rounded-[3rem] border-stone-100 p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <DialogHeader className="sr-only">
                    <DialogTitle>Room Control: {data?.room_name || "Loading..."}</DialogTitle>
                    <DialogDescription>
                        Management dashboard for room {data?.room_name || "..."} in {data?.buildings?.name || "..."}.
                    </DialogDescription>
                </DialogHeader>

                {loading && !data ? (
                    <div className="flex items-center justify-center h-[50vh]">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Header Section */}
                        <div className="h-48 bg-stone-900 relative overflow-hidden flex-shrink-0">
                            <img
                                src={data?.cover_image_url || "/placeholder.svg"}
                                className="w-full h-full object-cover opacity-40"
                                alt="Room Cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent" />
                            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                                <div>
                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{data?.buildings?.name}</p>
                                    <h3 className="text-4xl font-display font-bold text-white tracking-tight mt-1">{data?.room_name}</h3>
                                </div>
                                <Badge className={cn(
                                    "rounded-full px-4 py-1.5 font-bold uppercase tracking-widest text-[9px] border-none shadow-xl",
                                    data?.status === "available" ? "bg-emerald-500 text-white" :
                                        data?.status === "pending" ? "bg-amber-500 text-white" : "bg-stone-700 text-stone-300"
                                )}>
                                    {data?.status}
                                </Badge>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 overflow-y-auto p-10">
                            <div className="grid lg:grid-cols-3 gap-12">
                                {/* Main Info */}
                                <div className="lg:col-span-2 space-y-10">
                                    <section className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Resident Profile</h4>
                                        </div>
                                        {tenant ? (
                                            <div className="bg-stone-50 rounded-3xl p-6 flex items-center gap-6 border border-stone-100">
                                                <div className="h-20 w-20 rounded-2xl bg-stone-200 overflow-hidden">
                                                    <img src={tenant.photo_url || "/placeholder.svg"} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xl font-bold text-stone-900">{tenant.name}</p>
                                                    <p className="text-stone-500 text-sm font-medium">{tenant.email}</p>
                                                    <div className="flex items-center gap-4 mt-3">
                                                        <Badge variant="outline" className="rounded-lg text-[9px] font-bold py-1">Active Tenancy</Badge>
                                                        <span className="text-[10px] text-stone-400 font-bold uppercase">Since {new Date(activeTenancy.start_date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-stone-50 rounded-3xl p-10 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-center">
                                                <Users className="h-8 w-8 text-stone-300 mb-3" />
                                                <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">No Active Tenant</p>
                                            </div>
                                        )}
                                    </section>

                                    <section className="space-y-4">
                                        <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Amenities & Assets</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.isArray(data?.amenities) && data.amenities.length > 0 ? (
                                                data.amenities.map((item: string, i: number) => (
                                                    <div key={i} className="px-4 py-2 bg-white border border-stone-200 rounded-xl flex items-center gap-2 text-xs font-bold text-stone-600">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {item}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-stone-400 text-xs italic">No amenities defined yet.</p>
                                            )}
                                        </div>
                                    </section>


                                    <section className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Recent Unit Transactions</h4>
                                            {allPayments?.length > 3 && (
                                                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest">
                                                    View All <ExternalLink className="h-3 w-3 ml-1" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="bg-white rounded-3xl border border-stone-100 divide-y divide-stone-50">
                                            {sortedPayments?.slice(0, 5).map((p: any) => (
                                                <div key={p.id} className="p-5 flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-stone-50 flex items-center justify-center">
                                                            <CreditCard className="h-5 w-5 text-stone-300" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-stone-900">₦{p.amount.toLocaleString()}</p>
                                                            <p className="text-[10px] font-medium text-stone-400">{new Date(p.created_at).toLocaleDateString()}</p>
                                                            <p className="text-[9px] font-medium text-stone-300 uppercase tracking-wider mt-0.5">
                                                                {p.payment_type || 'Payment'} • {p.payment_method || 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge className={cn(
                                                        "rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest border-none",
                                                        p.status === "success" ? "bg-emerald-50 text-emerald-600" :
                                                        p.status === "pending" ? "bg-amber-50 text-amber-600" :
                                                        p.status === "failed" ? "bg-red-50 text-red-600" : "bg-stone-50 text-stone-600"
                                                    )}>
                                                        {p.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                            {(!allPayments || allPayments.length === 0) && (
                                                <p className="p-8 text-center text-stone-400 text-xs font-medium">No transaction history recorded.</p>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                {/* Config Sidebar */}
                                <div className="lg:col-span-1 space-y-8 h-fit lg:sticky lg:top-0">
                                    <div className="bg-stone-50 rounded-[2rem] p-8 space-y-6">
                                    <div className="flex justify-between items-center gap-3">
                                        <h5 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">Configuration</h5>
                                        {!editMode ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 px-4 rounded-xl border-stone-200 hover:bg-stone-100 text-[10px] font-bold uppercase tracking-widest"
                                                onClick={() => setEditMode(true)}
                                            >
                                                <Settings2 className="h-3.5 w-3.5 mr-2" />
                                                Edit
                                            </Button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-9 px-4 rounded-xl border-stone-200 text-[10px] font-bold uppercase tracking-widest"
                                                    onClick={() => {
                                                        setFormData({
                                                            price: data.price.toString(),
                                                            amenities: Array.isArray(data.amenities) ? data.amenities.join(", ") : "",
                                                            agent_id: data.agent_id || "",
                                                            cover_image_url: data.cover_image_url || "",
                                                            block_id: data.block_id || "",
                                                            floor_level: data.floor_level || "ground",
                                                        });
                                                        setEditMode(false);
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-9 px-4 rounded-xl bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest"
                                                    onClick={handleUpdate}
                                                    disabled={loading}
                                                >
                                                    <Save className="h-3.5 w-3.5 mr-2" />
                                                    Save
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Annual Rent</Label>
                                                <div className="relative">
                                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-300" />
                                                    <Input
                                                        type="number"
                                                        disabled={!editMode}
                                                        className="h-11 pl-9 rounded-xl border-stone-200 bg-white"
                                                        value={formData.price}
                                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Operational Agent</Label>
                                                <div className="relative">
                                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-300" />
                                                    <select
                                                        disabled={!editMode}
                                                        className="w-full h-11 pl-9 pr-4 rounded-xl border border-stone-200 bg-white text-xs font-bold outline-none appearance-none disabled:opacity-50"
                                                        value={formData.agent_id}
                                                        onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                                                    >
                                                        <option value="">No Agent Assigned</option>
                                                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Image URL</Label>
                                                <div className="relative">
                                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-300" />
                                                    <Input
                                                        disabled={!editMode}
                                                        className="h-11 pl-9 rounded-xl border-stone-200 bg-white text-xs"
                                                        value={formData.cover_image_url}
                                                        onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Amenities (CSV)</Label>
                                                <textarea
                                                    disabled={!editMode}
                                                    className="w-full h-24 p-4 rounded-xl border border-stone-200 bg-white text-xs font-medium outline-none resize-none disabled:opacity-50"
                                                    placeholder="WiFi, AC, Bed..."
                                                    value={formData.amenities}
                                                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                                                />
                                            </div>

                                            {blocks.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Block</Label>
                                                    <select
                                                        disabled={!editMode}
                                                        className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-white text-xs font-bold outline-none appearance-none disabled:opacity-50"
                                                        value={formData.block_id}
                                                        onChange={(e) => setFormData({ ...formData, block_id: e.target.value })}
                                                    >
                                                        <option value="">No Block</option>
                                                        {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                    </select>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Floor Level</Label>
                                                <select
                                                    disabled={!editMode}
                                                    className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-white text-xs font-bold outline-none appearance-none disabled:opacity-50"
                                                    value={formData.floor_level}
                                                    onChange={(e) => setFormData({ ...formData, floor_level: e.target.value })}
                                                >
                                                    <option value="ground">Ground Floor</option>
                                                    <option value="upstairs">Upstairs</option>
                                                    <option value="downstairs">Downstairs</option>
                                                </select>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Room Yield - Full Width */}
                            <div className="lg:col-span-3 mt-8">
                                <div className="bg-primary/5 rounded-[2rem] p-8 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Room Yield (Lifetime)</p>
                                            <p className="text-2xl font-display font-bold text-stone-900 mt-1">₦{totalRevenue.toLocaleString()}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                                            <Clock className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div>
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total Transactions</p>
                                            <p className="text-lg font-display font-bold text-stone-900 mt-1">{allPayments?.length || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Success Rate</p>
                                            <p className="text-lg font-display font-bold text-stone-900 mt-1">
                                                {allPayments?.length > 0 ? `${Math.round((allPayments.filter((p: any) => p.status === "success").length / allPayments.length) * 100)}%` : '0%'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-10 border-t border-stone-50 gap-4">
                            <Button variant="ghost" className="rounded-2xl h-14 font-bold uppercase tracking-widest text-[10px] flex-1" onClick={() => setOpen(false)}>Close Control</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default RoomControlCenter;
