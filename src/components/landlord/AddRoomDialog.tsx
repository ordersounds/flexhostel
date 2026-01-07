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
import { DoorOpen, Hash, CreditCard, User, Box, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddRoomDialogProps {
    onSuccess?: () => void;
    trigger?: React.ReactNode;
    preselectedBuildingId?: string;
}

const AddRoomDialog = ({ onSuccess, trigger, preselectedBuildingId }: AddRoomDialogProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [buildings, setBuildings] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        building_id: preselectedBuildingId || "",
        room_name: "",
        price: "",
        agent_id: "",
        amenities: "",
        cover_image_url: "",
    });

    useEffect(() => {
        if (open) {
            fetchData();
        }
    }, [open]);

    const fetchData = async () => {
        const { data: bData } = await supabase.from("buildings").select("id, name");
        const { data: aData } = await supabase.from("profiles").select("id, name").eq("role", "agent");
        setBuildings(bData || []);
        setAgents(aData || []);
        if (preselectedBuildingId) {
            setFormData(prev => ({ ...prev, building_id: preselectedBuildingId }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from("rooms")
            .insert({
                building_id: formData.building_id,
                room_name: formData.room_name,
                price: Number(formData.price),
                agent_id: formData.agent_id || null,
                amenities: formData.amenities.split(",").map(s => s.trim()).filter(Boolean),
                cover_image_url: formData.cover_image_url || null,
                status: "available",
            });

        if (error) {
            toast.error("Failed to add room: " + error.message);
        } else {
            toast.success("Unit added to inventory");
            setOpen(false);
            setFormData({
                building_id: preselectedBuildingId || "",
                room_name: "",
                price: "",
                agent_id: "",
                amenities: "",
                cover_image_url: "",
            });
            onSuccess?.();
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Add Unit</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-white rounded-[3rem] border-stone-100 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Add New Unit</DialogTitle>
                    <DialogDescription>
                        Create a new room in your property portfolio.
                    </DialogDescription>
                </DialogHeader>
                <div className="h-40 bg-stone-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(25,180,180,0.4),transparent_70%)]" />
                    </div>
                    <div className="relative z-10 text-center">
                        <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/20">
                            <DoorOpen className="h-7 w-7 text-white" />
                        </div>
                        <h3 className="font-display text-2xl font-bold text-white tracking-tight">Expand Unit Inventory</h3>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="col-span-2 space-y-3">
                            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Parent Building</Label>
                            <select
                                className="w-full h-14 rounded-2xl border-stone-100 bg-stone-50/50 px-4 text-sm font-medium focus:ring-primary focus:bg-white transition-all shadow-inner outline-none appearance-none"
                                value={formData.building_id}
                                onChange={(e) => setFormData({ ...formData, building_id: e.target.value })}
                                required
                            >
                                <option value="">Select Building</option>
                                {buildings.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Room Designation</Label>
                            <div className="relative group">
                                <Box className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="e.g. California"
                                    className="pl-12 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all shadow-inner"
                                    value={formData.room_name}
                                    onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Annual Rent (₦)</Label>
                            <div className="relative group">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300 group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="number"
                                    placeholder="450000"
                                    className="pl-12 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all shadow-inner"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="col-span-2 space-y-3">
                            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Amenities (Comma separated)</Label>
                            <Input
                                placeholder="WiFi, AC, Bed, Study Desk"
                                className="h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all shadow-inner"
                                value={formData.amenities}
                                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 space-y-3">
                            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Room Image URL</Label>
                            <Input
                                placeholder="https://images.unsplash.com/..."
                                className="h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all shadow-inner"
                                value={formData.cover_image_url}
                                onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 space-y-3">
                            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Assigned Operational Agent</Label>
                            <div className="relative group">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300 group-focus-within:text-primary transition-colors z-10" />
                                <select
                                    className="w-full h-14 rounded-2xl border-stone-100 bg-stone-50/50 pl-12 pr-4 text-sm font-medium focus:ring-primary focus:bg-white transition-all shadow-inner outline-none appearance-none"
                                    value={formData.agent_id}
                                    onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                                >
                                    <option value="">No Agent Assigned</option>
                                    {agents.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 gap-3 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 rounded-2xl h-14 font-bold uppercase tracking-widest text-[10px]"
                            onClick={() => setOpen(false)}
                        >
                            Discard
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 rounded-2xl bg-stone-900 text-white h-14 font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-stone-900/20"
                            disabled={loading}
                        >
                            {loading ? "Registering..." : "Add to Portfolio"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddRoomDialog;
