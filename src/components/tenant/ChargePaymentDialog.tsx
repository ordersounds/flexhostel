import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Wallet, Lock, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    calculatePaymentAmount,
    calculatePaymentPeriod,
    createPaymentRecord,
    finalizeSuccessfulPayment,
    loadPaystackScript,
    generatePaymentReference,
    type Charge
} from "@/lib/payment-utils";

interface ChargePaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    charge: Charge;
    userId: string;
    userEmail: string;
    onPaymentComplete?: () => void;
}

const ChargePaymentDialog = ({
    open,
    onOpenChange,
    charge,
    userId,
    userEmail,
    onPaymentComplete,
}: ChargePaymentDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [preference, setPreference] = useState<"monthly" | "yearly" | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        if (open && charge?.id) {
            fetchPreference();
        }
    }, [open, charge?.id, userId]);

    const fetchPreference = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("tenant_charge_preferences")
            .select("*")
            .eq("tenant_id", userId)
            .eq("charge_id", charge.id)
            .maybeSingle();

        if (data) {
            setPreference(data.chosen_frequency as "monthly" | "yearly");
            setIsLocked(true);
        } else {
            setPreference(null);
            setIsLocked(false);
        }
        setLoading(false);
    };

    const handleSelectFrequency = (freq: "monthly" | "yearly") => {
        if (isLocked) return;

        // Only set preference, don't lock yet - locking happens after successful payment
        setPreference(freq);
        toast.success(`Payment plan selected: ${freq}`);
    };

    const getPaymentSummary = () => {
        if (!preference) return null;
        const amount = calculatePaymentAmount(charge, preference);
        const period = calculatePaymentPeriod(preference);
        return { amount, ...period };
    };

    const handlePayment = async () => {
        if (!preference) {
            toast.error("Please select a payment plan first");
            return;
        }

        const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder";
        const reference = generatePaymentReference();

        setPaying(true);

        try {
            // Create pending payment record using utility
            const createResult = await createPaymentRecord(userId, charge, preference, reference);
            if (!createResult.success) {
                throw new Error(createResult.error);
            }

            // Load Paystack script if not already loaded
            if (!(window as any).PaystackPop) {
                await loadPaystackScript();
            }

            // Close our dialog BEFORE Paystack opens to prevent modal layering
            onOpenChange(false);

            // Initialize Paystack payment - it will handle its own modal
            initiatePaystack(paystackKey, reference);

        } catch (error) {
            console.error("Payment initiation error:", error);
            toast.error("Failed to initiate payment: " + (error as Error).message);
            setPaying(false);
        }
    };

    const initiatePaystack = (key: string, reference: string) => {
        const amount = calculatePaymentAmount(charge, preference!);

        const handler = (window as any).PaystackPop.setup({
            key: key,
            email: userEmail,
            amount: amount * 100,
            currency: "NGN",
            ref: reference,
            callback: (response: any) => {
                // Finalize payment using utility - Paystack requires synchronous callback
                finalizeSuccessfulPayment(userId, charge.id, preference!, reference)
                    .then((finalizeResult) => {
                        if (finalizeResult.success) {
                            toast.success("Payment successful! Your payment plan has been locked.");
                            onPaymentComplete?.();
                            onOpenChange(false);
                        } else {
                            toast.error(finalizeResult.error || "Payment completed but there was an error processing it");
                            onOpenChange(false);
                        }
                    })
                    .catch((error) => {
                        console.error("Payment callback error:", error);
                        toast.error("Payment completed but there was an error processing it");
                        onOpenChange(false);
                    });
            },
            onClose: () => {
                toast.info("Payment cancelled");
                setPaying(false);
            },
        });

        handler.openIframe();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white rounded-[2rem] border-stone-100 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="font-display text-xl font-bold text-stone-900 tracking-tight">
                        Pay {charge.name}
                    </DialogTitle>
                    <DialogDescription className="text-stone-500 text-sm">
                        {isLocked 
                            ? `Your payment plan is locked to ${preference}.`
                            : "Choose your preferred payment frequency. This choice will be locked for future payments."
                        }
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="p-12 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Payment Plan Selection */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                    Payment Plan
                                </label>
                                {isLocked && (
                                    <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] tracking-widest font-bold uppercase">
                                        <Lock className="h-2.5 w-2.5 mr-1" /> Locked
                                    </Badge>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Monthly Option */}
                                <button
                                    onClick={() => handleSelectFrequency("monthly")}
                                    disabled={isLocked}
                                    className={cn(
                                        "p-4 rounded-xl border-2 text-left transition-all",
                                        preference === "monthly"
                                            ? "border-primary bg-primary/5"
                                            : "border-stone-100 hover:border-stone-200",
                                        isLocked && preference !== "monthly" && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4 text-stone-400" />
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                            Monthly
                                        </span>
                                    </div>
                                    <p className="font-display text-xl font-bold text-stone-900">
                                        ₦{charge.amount.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-stone-500">per month</p>
                                </button>

                                {/* Yearly Option */}
                                <button
                                    onClick={() => handleSelectFrequency("yearly")}
                                    disabled={isLocked}
                                    className={cn(
                                        "p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden",
                                        preference === "yearly"
                                            ? "border-primary bg-primary/5"
                                            : "border-stone-100 hover:border-stone-200",
                                        isLocked && preference !== "yearly" && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className="absolute top-2 right-2">
                                        <Badge className="bg-green-50 text-green-600 border-none text-[7px] tracking-widest font-bold uppercase">
                                            <Sparkles className="h-2 w-2 mr-0.5" /> Save Time
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Wallet className="h-4 w-4 text-stone-400" />
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                            Yearly
                                        </span>
                                    </div>
                                    <p className="font-display text-xl font-bold text-stone-900">
                                        ₦{(charge.amount * 12).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-stone-500">one-time payment</p>
                                </button>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        {(() => {
                            const summary = getPaymentSummary();
                            return summary ? (
                                <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                            Amount Due
                                        </span>
                                        <span className="font-display text-2xl font-bold text-stone-900">
                                            ₦{summary.amount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                            Period
                                        </span>
                                        <span className="font-bold text-stone-700">
                                            {summary.periodLabel}
                                        </span>
                                    </div>
                                </div>
                            ) : null;
                        })()}

                        {/* Pay Button */}
                        <Button
                            onClick={handlePayment}
                            disabled={!preference || paying}
                            className="w-full h-14 rounded-xl bg-stone-900 text-white font-bold uppercase tracking-widest text-[10px]"
                        >
                            {paying ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Wallet className="h-4 w-4 mr-2" />
                                    Pay ₦{getPaymentSummary()?.amount.toLocaleString() || '0'}
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ChargePaymentDialog;
