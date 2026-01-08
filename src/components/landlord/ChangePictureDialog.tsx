import { useState } from "react";
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
import { Image as ImageIcon, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChangePictureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    buildingId: string;
    buildingName: string;
    currentImageUrl: string;
    onSuccess: () => void;
}

const ChangePictureDialog = ({
    open,
    onOpenChange,
    buildingId,
    buildingName,
    currentImageUrl,
    onSuccess
}: ChangePictureDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState(currentImageUrl || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from("buildings")
            .update({ cover_image_url: imageUrl || null })
            .eq("id", buildingId);

        if (error) {
            toast.error("Failed to update building image: " + error.message);
        } else {
            toast.success("Building image updated successfully");
            onOpenChange(false);
            onSuccess();
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white rounded-[3rem] border-stone-100 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Change Building Picture</DialogTitle>
                    <DialogDescription>
                        Update the cover image for {buildingName}.
                    </DialogDescription>
                </DialogHeader>

                <div className="h-32 bg-stone-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(25,180,180,0.4),transparent_70%)]" />
                    </div>
                    <div className="relative z-10 text-center">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20">
                            <ImageIcon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-display text-lg font-bold text-white tracking-tight">Update Cover Image</h3>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Image URL</Label>
                        <div className="relative group">
                            <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="https://images.unsplash.com/..."
                                className="pl-12 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all shadow-inner"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                required
                            />
                        </div>
                        <p className="text-[10px] text-stone-400 font-medium">Enter a URL for the building's cover image</p>
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
                            {loading ? "Updating..." : "Update Image"}
                            <Sparkles className="h-3.5 w-3.5 ml-2" />
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ChangePictureDialog;