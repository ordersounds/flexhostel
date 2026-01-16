import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Sparkles, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import ImageUpload from "@/components/ui/image-upload";

interface ChangeRoomPictureDialogProps {
    roomId: string;
    roomName: string;
    currentImageUrl: string;
    onSuccess: () => void;
    trigger?: React.ReactNode;
}

const ChangeRoomPictureDialog = ({
    roomId,
    roomName,
    currentImageUrl,
    onSuccess,
    trigger
}: ChangeRoomPictureDialogProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState(currentImageUrl || "");

    // Synchronize local state with props when currentImageUrl changes
    // This ensures that after a refresh, the local state is updated
    useEffect(() => {
        if (currentImageUrl) {
            setImageUrl(currentImageUrl);
        }
    }, [currentImageUrl]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error, count } = await supabase
                .from("rooms")
                .update({ cover_image_url: imageUrl || null })
                .eq("id", roomId)
                .select(); // Select to verify the update happened

            if (error) {
                toast.error("Failed to update room image: " + error.message);
                console.error("Update error:", error);
            } else if (!data || data.length === 0) {
                toast.error("Update failed: No changes were saved. You might not have permission to edit this room.");
                console.warn("No rows updated. Check RLS policies or room ownership.");
            } else {
                toast.success("Room image updated successfully");
                setOpen(false);
                onSuccess();
            }
        } catch (err) {
            console.error("Unexpected error during update:", err);
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Camera className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white rounded-[3rem] border-stone-100 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Change Room Picture</DialogTitle>
                    <DialogDescription>
                        Update the cover image for {roomName}.
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
                        <h3 className="font-display text-lg font-bold text-white tracking-tight">Update Room Image</h3>
                        <p className="text-white/60 text-xs mt-1">{roomName}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Room Photo</Label>
                        <ImageUpload
                            value={imageUrl}
                            onChange={setImageUrl}
                            bucket="images"
                            folder="rooms"
                            placeholder="Upload room picture"
                        />
                        <p className="text-[10px] text-stone-400 font-medium text-center">Upload a high-quality photo of the room</p>
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
                            disabled={loading || !imageUrl}
                        >
                            {loading ? "Updating..." : "Save Image"}
                            <Sparkles className="h-3.5 w-3.5 ml-2" />
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ChangeRoomPictureDialog;
