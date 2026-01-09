import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Shield, CheckCircle2, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface BuildingBulkUpdateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    buildingId: string;
    buildingName: string;
    currentAgentId?: string;
    onSuccess: () => void;
}

const BuildingBulkUpdateDialog = ({
    open,
    onOpenChange,
    buildingId,
    buildingName,
    currentAgentId,
    onSuccess
}: BuildingBulkUpdateDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [agents, setAgents] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        price: "",
        amenities: "",
        agent_id: currentAgentId || "",
    });
    const [roomCount, setRoomCount] = useState(0);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        if (open) {
            fetchAgents();
            fetchRoomCount();
            setFormData({
                price: "",
                amenities: "",
                agent_id: currentAgentId || "",
            });
            setShowConfirmation(false);
        }
    }, [open, currentAgentId]);

    const fetchAgents = async () => {
        const { data: aData } = await supabase
            .from("profiles")
            .select("id, name")
            .eq("role", "agent");

        setAgents(aData || []);
    };

    const fetchRoomCount = async () => {
        const { count, error } = await supabase
            .from("rooms")
            .select("*", { count: "exact", head: true })
            .eq("building_id", buildingId);

        if (!error && count) {
            setRoomCount(count);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Prepare amenities array
            const amenitiesArray = formData.amenities
                ? formData.amenities.split(",").map(s => s.trim()).filter(Boolean)
                : [];

            // Call RPC function for atomic bulk update
            const { data, error } = await supabase
                .rpc("update_building_rooms_defaults", {
                    building_id_param: buildingId,
                    new_price_param: formData.price ? Number(formData.price) : null,
                    new_amenities_param: amenitiesArray.length > 0 ? amenitiesArray : null,
                    new_agent_id_param: formData.agent_id || null
                });

            if (error) {
                throw error;
            }

            if (data && data[0] && data[0].error_message) {
                throw new Error(data[0].error_message);
            }

            const roomsUpdated = data && data[0] ? data[0].rooms_updated : 0;

            // Update building defaults
            await supabase
                .from("buildings")
                .update({
                    default_price: formData.price ? Number(formData.price) : null,
                    default_amenities: amenitiesArray.length > 0 ? amenitiesArray : null,
                    agent_id: formData.agent_id || null
                } as any)
                .eq("id", buildingId);

            toast.success(
                `Successfully updated ${roomsUpdated} rooms in ${buildingName}. ` +
                `All rooms now have: ${formData.price ? `₦${Number(formData.price).toLocaleString()}/year` : 'unchanged price'}, ` +
                `${formData.amenities ? `${amenitiesArray.length} amenities` : 'unchanged amenities'}, ` +
                `${formData.agent_id ? 'assigned agent' : 'unchanged agent'}`
            );

            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            toast.error("Failed to update rooms: " + error.message);
        }
        setLoading(false);
    };

    const hasChanges = () => {
        return formData.price !== "" ||
               formData.amenities !== "" ||
               formData.agent_id !== currentAgentId;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white rounded-[3rem] border-stone-100 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Bulk Update Building Rooms</DialogTitle>
                    <DialogDescription>
                        Apply universal settings to all rooms in {buildingName}.
                    </DialogDescription>
                </DialogHeader>

                <div className="h-32 bg-stone-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(25,180,180,0.4),transparent_70%)]" />
                    </div>
                    <div className="relative z-10 text-center">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20">
                            <CreditCard className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-display text-lg font-bold text-white tracking-tight">Bulk Room Update</h3>
                    </div>
                </div>

                {showConfirmation ? (
                    <div className="p-8 space-y-6">
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-stone-900 mb-2">Confirm Bulk Update</h4>
                                    <p className="text-stone-600 text-sm mb-4">
                                        You are about to update <strong>{roomCount} rooms</strong> in <strong>{buildingName}</strong>.
                                        This will override existing room settings.
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        {formData.price && (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                                <span>Set all rooms to <strong>₦{Number(formData.price).toLocaleString()}/year</strong></span>
                                            </div>
                                        )}
                                        {formData.amenities && (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                                <span>Apply {formData.amenities.split(",").filter(Boolean).length} amenities to all rooms</span>
                                            </div>
                                        )}
                                        {formData.agent_id && (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                                <span>Assign agent to all rooms</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 gap-3 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1 rounded-2xl h-14 font-bold uppercase tracking-widest text-[10px]"
                                onClick={() => setShowConfirmation(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="flex-1 rounded-2xl bg-stone-900 text-white h-14 font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-stone-900/20"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        Confirm Update
                                        <Sparkles className="h-3.5 w-3.5 ml-2" />
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); setShowConfirmation(true); }} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Universal Price (₦)</Label>
                                <div className="relative group">
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="number"
                                        placeholder="e.g. 350000"
                                        className="pl-12 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all shadow-inner"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <p className="text-[10px] text-stone-400 font-medium">
                                    Set the same price for all {roomCount} rooms in this building
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Amenities (CSV)</Label>
                                <div className="relative group">
                                    <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300 group-focus-within:text-primary transition-colors" />
                                    <Textarea
                                        placeholder="WiFi, AC, Bed, Wardrobe, Study Desk..."
                                        className="pl-12 h-24 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all shadow-inner resize-none"
                                        value={formData.amenities}
                                        onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                                    />
                                </div>
                                <p className="text-[10px] text-stone-400 font-medium">
                                    Apply these amenities to all rooms (comma-separated)
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Building Agent</Label>
                                <div className="relative group">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300 group-focus-within:text-primary transition-colors z-10" />
                                    <Select value={formData.agent_id || "none"} onValueChange={(value) => setFormData({ ...formData, agent_id: value === "none" ? "" : value })}>
                                        <SelectTrigger className="pl-12 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all shadow-inner">
                                            <SelectValue placeholder="Choose an agent..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Agent Assigned</SelectItem>
                                            {agents.map(agent => (
                                                <SelectItem key={agent.id} value={agent.id}>
                                                    {agent.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="text-[10px] text-stone-400 font-medium">
                                    Assign this agent to all rooms in the building
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 gap-3 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1 rounded-2xl h-14 font-bold uppercase tracking-widest text-[10px]"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 rounded-2xl bg-stone-900 text-white h-14 font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-stone-900/20"
                                disabled={!hasChanges() || loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Apply to All Rooms
                                        <Sparkles className="h-3.5 w-3.5 ml-2" />
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default BuildingBulkUpdateDialog;