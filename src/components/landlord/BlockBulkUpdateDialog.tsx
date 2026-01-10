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
import {
    Settings2,
    CreditCard,
    Shield,
    Box,
    Loader2,
    Sparkles,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BlockBulkUpdateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    blockId: string;
    blockName: string;
    onSuccess: () => void;
}

const BlockBulkUpdateDialog = ({
    open,
    onOpenChange,
    blockId,
    blockName,
    onSuccess
}: BlockBulkUpdateDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [agents, setAgents] = useState<any[]>([]);
    const [roomCount, setRoomCount] = useState(0);
    const [showConfirmation, setShowConfirmation] = useState(false);
    
    const [formData, setFormData] = useState({
        price: "",
        amenities: "",
        agent_id: ""
    });

    useEffect(() => {
        if (open) {
            fetchData();
            setShowConfirmation(false);
            setFormData({ price: "", amenities: "", agent_id: "" });
        }
    }, [open, blockId]);

    const fetchData = async () => {
        // Fetch agents
        const { data: agentsData } = await supabase
            .from("profiles")
            .select("id, name")
            .eq("role", "agent");
        setAgents(agentsData || []);

        // Fetch room count for this block
        const { count } = await supabase
            .from("rooms")
            .select("*", { count: "exact", head: true })
            .eq("block_id", blockId);
        setRoomCount(count || 0);

        // Fetch current block defaults
        const { data: blockData } = await supabase
            .from("blocks")
            .select("default_price, default_amenities, agent_id")
            .eq("id", blockId)
            .single();

        if (blockData) {
            setFormData({
                price: blockData.default_price?.toString() || "",
                amenities: Array.isArray(blockData.default_amenities) 
                    ? blockData.default_amenities.join(", ") 
                    : "",
                agent_id: blockData.agent_id || ""
            });
        }
    };

    const hasChanges = () => {
        return formData.price || formData.amenities || formData.agent_id;
    };

    const handleProceed = () => {
        if (!hasChanges()) {
            toast.error("Please set at least one value to update");
            return;
        }
        setShowConfirmation(true);
    };

    const handleSubmit = async () => {
        setLoading(true);

        try {
            const priceValue = formData.price ? Number(formData.price) : null;
            const amenitiesArray = formData.amenities 
                ? formData.amenities.split(",").map(s => s.trim()).filter(Boolean)
                : null;
            const agentId = formData.agent_id || null;

            // Call the RPC function to update all rooms in this block
            const { data, error } = await supabase.rpc("update_block_rooms_defaults", {
                block_id_param: blockId,
                new_price_param: priceValue,
                new_amenities_param: amenitiesArray,
                new_agent_id_param: agentId
            });

            if (error) throw error;

            const result = data?.[0];
            if (result?.error_message) {
                throw new Error(result.error_message);
            }

            // Also update the block's default values
            const blockUpdate: any = {};
            if (priceValue !== null) blockUpdate.default_price = priceValue;
            if (amenitiesArray !== null) blockUpdate.default_amenities = amenitiesArray;
            if (agentId !== null) blockUpdate.agent_id = agentId;

            if (Object.keys(blockUpdate).length > 0) {
                const { error: blockError } = await supabase
                    .from("blocks")
                    .update(blockUpdate)
                    .eq("id", blockId);

                if (blockError) throw blockError;
            }

            toast.success(`Updated ${result?.rooms_updated || 0} rooms in ${blockName}`);
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            toast.error("Failed to update: " + error.message);
        }

        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg bg-white rounded-[3rem] border-stone-100 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Bulk Update {blockName}</DialogTitle>
                    <DialogDescription>
                        Update price, amenities, and agent for all rooms in {blockName}.
                    </DialogDescription>
                </DialogHeader>

                {/* Header */}
                <div className="h-32 bg-stone-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(25,180,180,0.4),transparent_70%)]" />
                    </div>
                    <div className="relative z-10 text-center">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20">
                            <Settings2 className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-display text-lg font-bold text-white tracking-tight">
                            Bulk Update Rooms
                        </h3>
                        <p className="text-white/60 text-xs mt-1">{blockName} • {roomCount} rooms</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {showConfirmation ? (
                        <div className="space-y-6">
                            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                                <div className="flex items-start gap-4">
                                    <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-amber-900">Confirm Bulk Update</h4>
                                        <p className="text-amber-700 text-sm mt-1">
                                            This will update <strong>{roomCount} rooms</strong> in {blockName} with the following changes:
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {formData.price && (
                                    <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl">
                                        <CreditCard className="h-5 w-5 text-stone-400" />
                                        <span className="text-stone-600 font-medium">Price:</span>
                                        <span className="font-bold text-stone-900">₦{Number(formData.price).toLocaleString()}/year</span>
                                    </div>
                                )}
                                {formData.amenities && (
                                    <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl">
                                        <Box className="h-5 w-5 text-stone-400" />
                                        <span className="text-stone-600 font-medium">Amenities:</span>
                                        <span className="font-bold text-stone-900">{formData.amenities}</span>
                                    </div>
                                )}
                                {formData.agent_id && (
                                    <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl">
                                        <Shield className="h-5 w-5 text-stone-400" />
                                        <span className="text-stone-600 font-medium">Agent:</span>
                                        <span className="font-bold text-stone-900">
                                            {agents.find(a => a.id === formData.agent_id)?.name || "Selected"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-stone-500 text-sm text-center">
                                Set values below to update all rooms in this block. Leave fields empty to keep current values.
                            </p>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                                        Annual Rent (₦)
                                    </Label>
                                    <div className="relative group">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            type="number"
                                            placeholder="Leave empty to keep current"
                                            className="pl-12 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                                        Amenities (Comma separated)
                                    </Label>
                                    <div className="relative group">
                                        <Box className="absolute left-4 top-4 h-5 w-5 text-stone-300 group-focus-within:text-primary transition-colors" />
                                        <textarea
                                            placeholder="WiFi, AC, Bed, Study Desk..."
                                            className="w-full pl-12 pr-4 py-4 h-24 rounded-2xl border border-stone-100 bg-stone-50/50 focus:bg-white transition-all text-sm outline-none resize-none"
                                            value={formData.amenities}
                                            onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                                        Assign Agent
                                    </Label>
                                    <div className="relative group">
                                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300 group-focus-within:text-primary transition-colors z-10" />
                                        <Select 
                                            value={formData.agent_id || "none"} 
                                            onValueChange={(value) => setFormData({ ...formData, agent_id: value === "none" ? "" : value })}
                                        >
                                            <SelectTrigger className="pl-12 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all">
                                                <SelectValue placeholder="Keep current assignment" />
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
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t border-stone-100 gap-3">
                    {showConfirmation ? (
                        <>
                            <Button
                                variant="ghost"
                                className="flex-1 rounded-2xl h-14 font-bold uppercase tracking-widest text-[10px]"
                                onClick={() => setShowConfirmation(false)}
                            >
                                Go Back
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 rounded-2xl bg-stone-900 text-white h-14 font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-stone-900/20"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Confirm Update
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                className="flex-1 rounded-2xl h-14 font-bold uppercase tracking-widest text-[10px]"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleProceed}
                                disabled={!hasChanges()}
                                className="flex-1 rounded-2xl bg-stone-900 text-white h-14 font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-stone-900/20"
                            >
                                Preview Changes
                                <Sparkles className="h-4 w-4 ml-2" />
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BlockBulkUpdateDialog;
