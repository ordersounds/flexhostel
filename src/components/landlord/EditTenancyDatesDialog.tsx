import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface EditTenancyDatesDialogProps {
    tenancyId: string;
    currentStartDate: string;
    currentEndDate: string;
    onUpdate?: () => void;
}

const EditTenancyDatesDialog = ({ 
    tenancyId, 
    currentStartDate, 
    currentEndDate, 
    onUpdate 
}: EditTenancyDatesDialogProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState<Date | undefined>(
        currentStartDate ? new Date(currentStartDate) : undefined
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
        currentEndDate ? new Date(currentEndDate) : undefined
    );

    const handleSave = async () => {
        if (!startDate || !endDate) {
            toast.error("Please select both start and end dates");
            return;
        }

        if (startDate >= endDate) {
            toast.error("Start date must be before end date");
            return;
        }

        setLoading(true);

        const { error } = await supabase
            .from("tenancies")
            .update({
                start_date: format(startDate, "yyyy-MM-dd"),
                end_date: format(endDate, "yyyy-MM-dd"),
            })
            .eq("id", tenancyId);

        if (error) {
            toast.error("Failed to update tenancy dates: " + error.message);
        } else {
            toast.success("Tenancy dates updated successfully");
            onUpdate?.();
            setOpen(false);
        }

        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-stone-200 text-stone-600 font-bold text-[9px] uppercase tracking-widest"
                onClick={() => setOpen(true)}
            >
                <Pencil className="h-3 w-3 mr-1.5" />
                Edit Dates
            </Button>
            <DialogContent className="max-w-md bg-white rounded-[2rem] border-stone-100 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="font-display text-xl font-bold text-stone-900 tracking-tight">
                        Edit Tenancy Dates
                    </DialogTitle>
                    <DialogDescription className="text-stone-500 text-sm">
                        Adjust the start and end dates for this tenancy. Changes will cascade to all related calculations.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                            Start Date
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-medium rounded-xl h-12 border-stone-200",
                                        !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-stone-400" />
                                    {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
                                    initialFocus
                                    className={cn("p-3 pointer-events-auto")}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                            End Date
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-medium rounded-xl h-12 border-stone-200",
                                        !endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-stone-400" />
                                    {endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={setEndDate}
                                    disabled={(date) => startDate ? date <= startDate : false}
                                    initialFocus
                                    className={cn("p-3 pointer-events-auto")}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {startDate && endDate && (
                        <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                                Duration Preview
                            </p>
                            <p className="font-bold text-stone-900">
                                {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                            </p>
                            <p className="text-sm text-stone-500">
                                {format(startDate, "MMM d, yyyy")} → {format(endDate, "MMM d, yyyy")}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 pt-0 gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="flex-1 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || !startDate || !endDate}
                        className="flex-1 rounded-xl h-12 bg-stone-900 text-white font-bold uppercase tracking-widest text-[10px]"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditTenancyDatesDialog;
