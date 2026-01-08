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
import { Building2, MapPin, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUpload from "@/components/ui/image-upload";

interface EditBuildingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    buildingId: string;
    buildingName: string;
    currentName: string;
    currentAddress: string;
    currentImageUrl: string;
    onSuccess: () => void;
}

const EditBuildingDialog = ({
    open,
    onOpenChange,
    buildingId,
    buildingName,
    currentName,
    currentAddress,
    currentImageUrl,
    onSuccess
}: EditBuildingDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: currentName || "",
        address: currentAddress || "",
        cover_image_url: currentImageUrl || "",
    });

    useEffect(() => {
        if (open) {
            setFormData({
                name: currentName || "",
                address: currentAddress || "",
                cover_image_url: currentImageUrl || "",
            });
        }
    }, [open, currentName, currentAddress, currentImageUrl]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const slug = formData.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

        const { error } = await supabase
            .from("buildings")
            .update({
                name: formData.name,
                slug,
                address: formData.address,
                cover_image_url: formData.cover_image_url || null
            })
            .eq("id", buildingId);

        if (error) {
            toast.error("Failed to update building: " + error.message);
        } else {
            toast.success("Building details updated successfully");
            onOpenChange(false);
            onSuccess();
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white rounded-[3rem] border-stone-100 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Edit Building Details</DialogTitle>
                    <DialogDescription>
                        Update the name and address for {buildingName}.
                    </DialogDescription>
                </DialogHeader>

                <div className="h-32 bg-stone-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(25,180,180,0.4),transparent_70%)]" />
                    </div>
                    <div className="relative z-10 text-center">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-display text-lg font-bold text-white tracking-tight">Edit Building Details</h3>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Building Name</Label>
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
                            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Address</Label>
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
                            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Building Image</Label>
                            <ImageUpload
                                value={formData.cover_image_url}
                                onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                                placeholder="Upload building image"
                            />
                        </div>
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
                                    Updating...
                                </>
                            ) : (
                                <>
                                    Update Details
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

export default EditBuildingDialog;