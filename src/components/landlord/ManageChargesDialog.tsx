import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Receipt, Trash2, Plus, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ManageChargesDialogProps {
    buildingId: string;
    buildingName: string;
    trigger?: React.ReactNode;
}

const ManageChargesDialog = ({ buildingId, buildingName, trigger }: ManageChargesDialogProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [charges, setCharges] = useState<any[]>([]);
    const [newCharge, setNewCharge] = useState({
        name: "",
        amount: "",
        frequency: "monthly" as "monthly" | "yearly"
    });

    useEffect(() => {
        if (open && buildingId) {
            fetchCharges();
        }
    }, [open, buildingId]);

    const fetchCharges = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("charges")
            .select("*")
            .eq("building_id", buildingId)
            .eq("status", "active");

        if (error) {
            toast.error("Failed to load charges");
        } else {
            setCharges(data || []);
        }
        setLoading(false);
    };

    const handleAddCharge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCharge.name || !newCharge.amount) return;

        setLoading(true);
        const { error } = await supabase
            .from("charges")
            .insert({
                building_id: buildingId,
                name: newCharge.name,
                amount: Number(newCharge.amount),
                frequency: newCharge.frequency,
                status: "active"
            });

        if (error) {
            toast.error("Failed to add charge: " + error.message);
        } else {
            toast.success("Charge added successfully");
            setNewCharge({ name: "", amount: "", frequency: "monthly" });
            fetchCharges();
        }
        setLoading(false);
    };

    const handleDeleteCharge = async (chargeId: string) => {
        const { error } = await supabase
            .from("charges")
            .update({ status: 'inactive' }) // Soft delete
            .eq("id", chargeId);

        if (error) {
            toast.error("Failed to remove charge");
        } else {
            toast.success("Charge removed");
            fetchCharges();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Manage Charges</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-white rounded-[3rem] border-stone-100 p-0 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                <DialogHeader className="sr-only">
                    <DialogTitle>Manage Building Charges</DialogTitle>
                    <DialogDescription>Configure recurring fees for {buildingName}</DialogDescription>
                </DialogHeader>

                <div className="h-32 bg-stone-900 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(25,180,180,0.4),transparent_70%)]" />
                    </div>
                    <div className="relative z-10 text-center">
                        <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20">
                            <Receipt className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-display text-xl font-bold text-white tracking-tight">Recurring Service Charges</h3>
                        <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold mt-1">{buildingName}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Add New Charge Form */}
                    <form onSubmit={handleAddCharge} className="bg-stone-50 rounded-3xl p-6 space-y-4 border border-stone-100">
                        <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Add New Charge</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-stone-500">Charge Name</Label>
                                <Input
                                    placeholder="e.g. Cleaning"
                                    className="bg-white border-stone-200 rounded-xl h-10 text-xs"
                                    value={newCharge.name}
                                    onChange={e => setNewCharge({ ...newCharge, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-stone-500">Amount (₦)</Label>
                                <Input
                                    type="number"
                                    placeholder="5000"
                                    className="bg-white border-stone-200 rounded-xl h-10 text-xs"
                                    value={newCharge.amount}
                                    onChange={e => setNewCharge({ ...newCharge, amount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label className="text-xs font-bold text-stone-500">Frequency</Label>
                                <select
                                    className="w-full h-10 px-3 rounded-xl border border-stone-200 bg-white text-xs outline-none"
                                    value={newCharge.frequency}
                                    onChange={e => setNewCharge({ ...newCharge, frequency: e.target.value as "monthly" | "yearly" })}
                                >
                                    <option value="monthly">Monthly Recurring</option>
                                    <option value="yearly">Yearly Recurring</option>
                                </select>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={loading || !newCharge.name || !newCharge.amount}
                            className="w-full rounded-xl bg-stone-900 h-10 font-bold uppercase tracking-widest text-[9px]"
                        >
                            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Plus className="h-3 w-3 mr-2" /> Add Charge Config</>}
                        </Button>
                    </form>

                    {/* Existing Charges List */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Active Configuration</h4>
                        {charges.length === 0 ? (
                            <div className="text-center py-8 text-stone-400 text-xs italic bg-white border border-dashed border-stone-200 rounded-2xl">
                                No charges configured for this building yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {charges.map(charge => (
                                    <div key={charge.id} className="flex items-center justify-between p-4 bg-white border border-stone-100 rounded-2xl shadow-sm group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Sparkles className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-stone-900 text-sm">{charge.name}</p>
                                                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                                                    ₦{Number(charge.amount).toLocaleString()} / {charge.frequency}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                            onClick={() => handleDeleteCharge(charge.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 border-t border-stone-50 bg-stone-50/50">
                    <Button variant="ghost" className="w-full rounded-2xl h-12 font-bold uppercase tracking-widest text-[10px]" onClick={() => setOpen(false)}>
                        Done Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ManageChargesDialog;
