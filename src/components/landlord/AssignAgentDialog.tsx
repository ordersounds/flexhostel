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
import { Label } from "@/components/ui/label";
import { Shield, Sparkles, Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AssignAgentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    buildingId: string;
    buildingName: string;
    currentAgentId?: string;
    onSuccess: () => void;
}

const AssignAgentDialog = ({
    open,
    onOpenChange,
    buildingId,
    buildingName,
    currentAgentId,
    onSuccess
}: AssignAgentDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [agents, setAgents] = useState<any[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState(currentAgentId || "");

    useEffect(() => {
        if (open) {
            fetchAgents();
            setSelectedAgentId(currentAgentId || "");
        }
    }, [open, currentAgentId]);

    const fetchAgents = async () => {
        const { data: aData } = await supabase
            .from("profiles")
            .select("id, name")
            .eq("role", "agent");

        setAgents(aData || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Update building with new agent
            const { error: buildingError } = await supabase
                .from("buildings")
                .update({ agent_id: selectedAgentId || null } as any)
                .eq("id", buildingId);

            if (buildingError) throw buildingError;

            // Update all rooms in this building to have the same agent
            // Only update rooms that don't already have an agent assigned (to preserve manual assignments)
            const { error: roomsError } = await supabase
                .from("rooms")
                .update({ agent_id: selectedAgentId || null })
                .eq("building_id", buildingId)
                .is("agent_id", null); // Only update rooms without existing agent assignments

            if (roomsError) throw roomsError;

            toast.success(
                selectedAgentId
                    ? `Agent assigned to building and ${agents.find(a => a.id === selectedAgentId)?.name || 'agent'} will handle unassigned rooms`
                    : "Agent removed from building"
            );
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            toast.error("Failed to assign agent: " + error.message);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white rounded-[3rem] border-stone-100 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Assign Agent to Building</DialogTitle>
                    <DialogDescription>
                        Assign an agent to {buildingName}. This will automatically assign the agent to all unassigned rooms in the building.
                    </DialogDescription>
                </DialogHeader>

                <div className="h-32 bg-stone-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(25,180,180,0.4),transparent_70%)]" />
                    </div>
                    <div className="relative z-10 text-center">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-display text-lg font-bold text-white tracking-tight">Assign Building Agent</h3>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Select Agent</Label>
                        <div className="relative group">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300 group-focus-within:text-primary transition-colors z-10" />
                            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                                <SelectTrigger className="pl-12 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all shadow-inner">
                                    <SelectValue placeholder="Choose an agent..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">No Agent Assigned</SelectItem>
                                    {agents.map(agent => (
                                        <SelectItem key={agent.id} value={agent.id}>
                                            {agent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-[10px] text-stone-400 font-medium">
                            This agent will be automatically assigned to all rooms in {buildingName} that don't already have an agent.
                        </p>
                    </div>

                    <DialogFooter className="pt-4 gap-3 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 rounded-2xl h-14 font-bold uppercase tracking-widest text-[10px]"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 rounded-2xl bg-stone-900 text-white h-14 font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-stone-900/20"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    Assign Agent
                                    <Sparkles className="h-3.5 w-3.5 ml-2" />
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AssignAgentDialog;