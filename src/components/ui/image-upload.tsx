import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    className?: string;
    placeholder?: string;
    bucket?: string;
    folder?: string;
}

const ImageUpload = ({
    value,
    onChange,
    className,
    placeholder = "Click to upload image",
    bucket = "images",
    folder = "buildings"
}: ImageUploadProps) => {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file");
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB");
            return;
        }

        setUploading(true);

        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

            // Upload to Supabase storage
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;

            setPreviewUrl(publicUrl);
            onChange(publicUrl);
            toast.success("Image uploaded successfully");

        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error("Failed to upload image: " + error.message);
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        onChange("");
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={cn("space-y-3", className)}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {previewUrl ? (
                <div className="relative group">
                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                            onClick={handleClick}
                            disabled={uploading}
                        >
                            <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white"
                            onClick={handleRemove}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    className="aspect-video w-full rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3"
                    onClick={handleClick}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-8 w-8 text-stone-400 animate-spin" />
                            <p className="text-sm text-stone-500 font-medium">Uploading...</p>
                        </>
                    ) : (
                        <>
                            <ImageIcon className="h-8 w-8 text-stone-400" />
                            <p className="text-sm text-stone-500 font-medium">{placeholder}</p>
                            <p className="text-xs text-stone-400">PNG, JPG up to 5MB</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ImageUpload;