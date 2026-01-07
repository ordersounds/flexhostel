import { useState } from "react";
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
import { Building2, MapPin, Image as ImageIcon, Sparkles, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddBuildingDialogProps {
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

const AddBuildingDialog = ({ onSuccess, trigger }: AddBuildingDialogProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        cover_image_url: "",
        default_rent: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const slug = formData.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

        const { error } = await supabase
            .from("buildings")
            .insert({
                name: formData.name,
                slug,
                address: formData.address,
                cover_image_url: formData.cover_image_url || null,
            });

        if (error) {
            toast.error("Failed to create building: " + error.message);
        } else {
            toast.success("Building created successfully");
            setOpen(false);
            setFormData({ name: "", address: "", cover_image_url: "", default_rent: "" });
            onSuccess?.();
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Add Building</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-white rounded-[3rem] border-stone-100 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Register New Building</DialogTitle>
                    <DialogDescription>
                        Add a new property to your portfolio.
                    </DialogDescription>
                </DialogHeader>

                <div className="h-40 bg-stone-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(25,180,180,0.4),transparent_70%)]" />
                    </div>
                    <div className="relative z-10 text-center">
                        <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/20">
                            <Building2 className="h-7 w-7 text-white" />
                        </div>
                        <h3 className="font-display text-2xl font-bold text-white tracking-tight">Expand Portfolio</h3>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Building Identity</Label>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="e.g. Flagship Okitipupa"
                                    className="pl-12 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all shadow-inner"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Physical Location</Label>
                            <div className="relative group">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Street address, City, State"
                                    className="pl-12 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all shadow-inner"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Default Unit Rent (₦)</Label>
                            <div className="relative group">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300 group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="number"
                                    placeholder="e.g. 350000"
                                    className="pl-12 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all shadow-inner"
                                    value={formData.default_rent}
                                    onChange={(e) => setFormData({ ...formData, default_rent: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Cover Aesthetic (URL)</Label>
                            <div className="relative group">
                                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="https://images.unsplash.com/..."
                                    className="pl-12 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all shadow-inner"
                                    value={formData.cover_image_url}
                                    onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                                />
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
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 rounded-2xl bg-stone-900 text-white h-14 font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-stone-900/20"
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Register Building"}
                            <Sparkles className="h-3.5 w-3.5 ml-2" />
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
};

export default AddBuildingDialog;
