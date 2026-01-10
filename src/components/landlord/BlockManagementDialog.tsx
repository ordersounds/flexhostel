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
import { Badge } from "@/components/ui/badge";
import {
    Layers,
    Plus,
    Trash2,
    Edit3,
    Save,
    X,
    Loader2,
    Shield,
    CreditCard,
    Box,
    Settings2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import BlockBulkUpdateDialog from "./BlockBulkUpdateDialog";

interface BlockManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    buildingId: string;
    buildingName: string;
    onSuccess: () => void;
}

interface Block {
    id: string;
    name: string;
    agent_id: string | null;
    default_price: number | null;
    default_amenities: string[] | null;
    room_count?: number;
    agent_name?: string;
}

const BlockManagementDialog = ({
    open,
    onOpenChange,
    buildingId,
    buildingName,
    onSuccess
}: BlockManagementDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [editingBlock, setEditingBlock] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [newBlockName, setNewBlockName] = useState("");
    const [addingBlock, setAddingBlock] = useState(false);
    const [bulkUpdateBlockId, setBulkUpdateBlockId] = useState<string | null>(null);
    const [bulkUpdateBlockName, setBulkUpdateBlockName] = useState<string>("");

    useEffect(() => {
        if (open) {
            fetchBlocks();
            fetchAgents();
        }
    }, [open, buildingId]);

    const fetchBlocks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("blocks")
            .select(`
                *,
                profiles:agent_id (name)
            `)
            .eq("building_id", buildingId)
            .order("name");

        if (error) {
            toast.error("Failed to load blocks");
        } else {
            // Get room counts for each block
            const blocksWithCounts = await Promise.all(
                (data || []).map(async (block: any) => {
                    const { count } = await supabase
                        .from("rooms")
                        .select("*", { count: "exact", head: true })
                        .eq("block_id", block.id);
                    
                    return {
                        ...block,
                        room_count: count || 0,
                        agent_name: block.profiles?.name || null,
                        default_amenities: block.default_amenities || []
                    };
                })
            );
            setBlocks(blocksWithCounts);
        }
        setLoading(false);
    };

    const fetchAgents = async () => {
        const { data } = await supabase
            .from("profiles")
            .select("id, name")
            .eq("role", "agent");
        setAgents(data || []);
    };

    const handleAddBlock = async () => {
        if (!newBlockName.trim()) {
            toast.error("Block name is required");
            return;
        }

        setAddingBlock(true);
        const { error } = await supabase
            .from("blocks")
            .insert({
                building_id: buildingId,
                name: newBlockName.trim()
            });

        if (error) {
            if (error.code === "23505") {
                toast.error("A block with this name already exists");
            } else {
                toast.error("Failed to add block: " + error.message);
            }
        } else {
            toast.success(`Block "${newBlockName}" created`);
            setNewBlockName("");
            fetchBlocks();
            onSuccess();
        }
        setAddingBlock(false);
    };

    const handleUpdateBlockName = async (blockId: string) => {
        if (!editName.trim()) {
            toast.error("Block name is required");
            return;
        }

        const { error } = await supabase
            .from("blocks")
            .update({ name: editName.trim() })
            .eq("id", blockId);

        if (error) {
            toast.error("Failed to update block: " + error.message);
        } else {
            toast.success("Block name updated");
            setEditingBlock(null);
            fetchBlocks();
            onSuccess();
        }
    };

    const handleDeleteBlock = async (blockId: string, blockName: string) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${blockName}"? Rooms in this block will become unassigned.`
        );
        if (!confirmed) return;

        const { error } = await supabase
            .from("blocks")
            .delete()
            .eq("id", blockId);

        if (error) {
            toast.error("Failed to delete block: " + error.message);
        } else {
            toast.success(`Block "${blockName}" deleted`);
            fetchBlocks();
            onSuccess();
        }
    };

    const openBulkUpdate = (block: Block) => {
        setBulkUpdateBlockId(block.id);
        setBulkUpdateBlockName(block.name);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl bg-white rounded-[3rem] border-stone-100 p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Manage Blocks</DialogTitle>
                        <DialogDescription>
                            Manage blocks for {buildingName}. Blocks allow you to organize rooms and apply bulk updates.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Header */}
                    <div className="h-32 bg-stone-900 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(25,180,180,0.4),transparent_70%)]" />
                        </div>
                        <div className="relative z-10 text-center">
                            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20">
                                <Layers className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="font-display text-lg font-bold text-white tracking-tight">
                                Manage Blocks
                            </h3>
                            <p className="text-white/60 text-xs mt-1">{buildingName}</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                        {/* Add Block Form */}
                        <div className="bg-stone-50 rounded-2xl p-6 space-y-4">
                            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                Add New Block
                            </Label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Box className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                                    <Input
                                        placeholder="e.g. Block A, Wing 1..."
                                        className="pl-11 h-12 rounded-xl border-stone-200 bg-white"
                                        value={newBlockName}
                                        onChange={(e) => setNewBlockName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddBlock()}
                                    />
                                </div>
                                <Button
                                    onClick={handleAddBlock}
                                    disabled={addingBlock || !newBlockName.trim()}
                                    className="h-12 px-6 rounded-xl bg-stone-900 text-white font-bold uppercase tracking-widest text-[10px]"
                                >
                                    {addingBlock ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Blocks List */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                Existing Blocks ({blocks.length})
                            </Label>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 text-stone-300 animate-spin" />
                                </div>
                            ) : blocks.length === 0 ? (
                                <div className="bg-stone-50 rounded-2xl p-10 text-center border-2 border-dashed border-stone-200">
                                    <Layers className="h-10 w-10 text-stone-300 mx-auto mb-3" />
                                    <p className="text-stone-500 font-medium text-sm">
                                        No blocks created yet
                                    </p>
                                    <p className="text-stone-400 text-xs mt-1">
                                        Add a block above to organize your rooms
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {blocks.map((block) => (
                                        <div
                                            key={block.id}
                                            className="bg-white rounded-2xl border border-stone-100 p-5 hover:shadow-lg transition-shadow"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="h-12 w-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 font-bold text-lg">
                                                        {block.name.charAt(0)}
                                                    </div>
                                                    
                                        {editingBlock === block.id ? (
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <Input
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                                className="h-10 rounded-lg"
                                                                autoFocus
                                                            />
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleUpdateBlockName(block.id)}
                                                                className="h-10 px-3 rounded-lg bg-stone-900"
                                                            >
                                                                <Save className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setEditingBlock(null)}
                                                                className="h-10 px-3 rounded-lg"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-stone-900 text-lg truncate">
                                                                {block.name}
                                                            </h4>
                                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                <span className="text-xs text-stone-500 flex items-center gap-1 whitespace-nowrap">
                                                                    <Box className="h-3 w-3" />
                                                                    {block.room_count} rooms
                                                                </span>
                                                                {block.agent_name && (
                                                                    <span className="text-xs text-stone-500 flex items-center gap-1 whitespace-nowrap">
                                                                        <Shield className="h-3 w-3" />
                                                                        {block.agent_name}
                                                                    </span>
                                                                )}
                                                                {block.default_price && (
                                                                    <span className="text-xs text-stone-500 flex items-center gap-1 whitespace-nowrap">
                                                                        <CreditCard className="h-3 w-3" />
                                                                        ₦{block.default_price.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {editingBlock !== block.id && (
                                                    <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openBulkUpdate(block)}
                                                            className="h-9 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest w-full sm:w-auto"
                                                        >
                                                            <Settings2 className="h-3.5 w-3.5 mr-1" />
                                                            Bulk Update
                                                        </Button>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setEditingBlock(block.id);
                                                                    setEditName(block.name);
                                                                }}
                                                                className="h-9 w-9 p-0 rounded-lg"
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteBlock(block.id, block.name)}
                                                                className="h-9 w-9 p-0 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-stone-100">
                        <Button
                            variant="ghost"
                            className="rounded-2xl h-12 font-bold uppercase tracking-widest text-[10px] flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Update Dialog */}
            {bulkUpdateBlockId && (
                <BlockBulkUpdateDialog
                    open={!!bulkUpdateBlockId}
                    onOpenChange={(open) => {
                        if (!open) {
                            setBulkUpdateBlockId(null);
                            setBulkUpdateBlockName("");
                        }
                    }}
                    blockId={bulkUpdateBlockId}
                    blockName={bulkUpdateBlockName}
                    onSuccess={() => {
                        fetchBlocks();
                        onSuccess();
                    }}
                />
            )}
        </>
    );
};

export default BlockManagementDialog;
