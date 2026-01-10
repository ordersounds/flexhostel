import { useState, useRef } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
    value?: string;
    onChange: (url: string) => void;
    className?: string;
    placeholder?: string;
    bucket?: string;
    folder?: string;
    fileTypes?: string[];
    maxSizeMB?: number;
}

const DocumentUpload = ({
    value,
    onChange,
    className,
    placeholder = "Click to upload document",
    bucket = "images",
    folder = "documents",
    fileTypes = ["application/pdf", "image/jpeg", "image/png"],
    maxSizeMB = 5
}: DocumentUploadProps) => {
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!fileTypes.includes(file.type)) {
            toast.error(`Please select a valid document (${fileTypes.join(", ")})`);
            return;
        }

        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(`Document must be less than ${maxSizeMB}MB`);
            return;
        }

        setUploading(true);
        setFileName(file.name);

        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const uniqueFileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

            // Upload to Supabase storage
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(uniqueFileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(uniqueFileName);

            const publicUrl = urlData.publicUrl;

            setPreviewUrl(publicUrl);
            onChange(publicUrl);
            toast.success("Document uploaded successfully");

        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error("Failed to upload document: " + error.message);
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
        setFileName(null);
        onChange("");
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const getFileExtension = (url: string) => {
        return url.split('.').pop()?.toUpperCase() || 'FILE';
    };

    const isImage = (url: string) => {
        return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
    };

    return (
        <div className={cn("space-y-3", className)}>
            <input
                ref={fileInputRef}
                type="file"
                accept={fileTypes.join(",")}
                onChange={handleFileSelect}
                className="hidden"
            />

            {previewUrl ? (
                <div className="relative group">
                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center">
                        {isImage(previewUrl) ? (
                            <img
                                src={previewUrl}
                                alt="Document preview"
                                className="w-full h-full object-contain p-4"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 p-4">
                                <FileText className="h-12 w-12 text-primary" />
                                <p className="text-sm font-medium text-stone-900 truncate max-w-[200px]">{fileName}</p>
                                <p className="text-xs text-stone-500">{getFileExtension(previewUrl)} Document</p>
                            </div>
                        )}
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
                            <FileText className="h-8 w-8 text-stone-400" />
                            <p className="text-sm text-stone-500 font-medium">{placeholder}</p>
                            <p className="text-xs text-stone-400">PDF, JPG, PNG up to {maxSizeMB}MB</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default DocumentUpload;
