import { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Wallet, Lock, Sparkles, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    calculatePaymentAmount,
    createPaymentRecord,
    finalizeSuccessfulPayment,
    loadPaystackScript,
    generatePaymentReference,
    type Charge,
    type PaymentPeriod
} from "@/lib/payment-utils";
import {
    getChargePaymentStatus,
    type ChargePaymentStatus,
    type UnpaidPeriod
} from "@/lib/charge-status";

interface ChargePaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    charge: Charge;
    userId: string;
    userEmail: string;
    tenancyStartDate?: string;
    onPaymentComplete?: () => void;
}

type PaymentStep = 'loading' | 'select_frequency' | 'select_period' | 'confirm' | 'processing';

const ChargePaymentDialog = ({
    open,
    onOpenChange,
    charge,
    userId,
    userEmail,
    tenancyStartDate,
    onPaymentComplete,
}: ChargePaymentDialogProps) => {
    // Core state
    const [step, setStep] = useState<PaymentStep>('loading');
    const [chargeStatus, setChargeStatus] = useState<ChargePaymentStatus | null>(null);

    // Selection state
    const [selectedFrequency, setSelectedFrequency] = useState<"monthly" | "yearly" | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<UnpaidPeriod | null>(null);

    // UI state
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset all state when dialog closes
    const resetState = useCallback(() => {
        setStep('loading');
        setChargeStatus(null);
        setSelectedFrequency(null);
        setSelectedPeriod(null);
        setIsProcessing(false);
        setError(null);
    }, []);

    // Handle dialog open/close with proper state reset
    const handleOpenChange = useCallback((newOpen: boolean) => {
        if (!newOpen) {
            // Reset state before closing
            resetState();
        }
        onOpenChange(newOpen);
    }, [onOpenChange, resetState]);

    // Fetch charge status when dialog opens
    useEffect(() => {
        if (open && charge?.id && userId) {
            fetchChargeStatus();
        }
    }, [open, charge?.id, userId]);

    const fetchChargeStatus = async (overrideFreq?: 'monthly' | 'yearly') => {
        setStep('loading');
        setError(null);

        try {
            const effectiveTenancyStart = tenancyStartDate || new Date().toISOString().split('T')[0];

            const status = await getChargePaymentStatus(
                userId,
                charge.id,
                charge.name,
                charge.amount,
                charge.frequency,
                effectiveTenancyStart,
                overrideFreq
            );

            setChargeStatus(status);

            // Determine if we should auto-advance to confirm
            const currentFreq = overrideFreq || status.chosenFrequency || status.chargeFrequency;
            setSelectedFrequency(currentFreq);

            if (status.isLocked && status.chosenFrequency) {
                if (status.chosenFrequency === 'monthly' && status.unpaidPeriods.length > 1) {
                    setStep('select_period');
                } else if (status.nextPaymentDue) {
                    setSelectedPeriod(status.nextPaymentDue);
                    setStep('confirm');
                } else {
                    setStep('confirm');
                }
            } else if (overrideFreq) {
                if (overrideFreq === 'monthly' && status.unpaidPeriods.length > 1) {
                    setStep('select_period');
                } else if (status.nextPaymentDue) {
                    setSelectedPeriod(status.nextPaymentDue);
                    setStep('confirm');
                } else {
                    setStep('confirm');
                }
            } else {
                setStep('select_frequency');
            }
        } catch (err) {
            console.error("Error fetching charge status:", err);
            setError("Failed to load payment information");
            setStep('select_frequency');
        }
    };

    const handleSelectFrequency = (freq: "monthly" | "yearly") => {
        if (chargeStatus?.isLocked) return;
        fetchChargeStatus(freq);
    };

    const handleSelectPeriod = (period: UnpaidPeriod) => {
        setSelectedPeriod(period);
        setStep('confirm');
    };

    const handlePayment = async () => {
        if (!selectedFrequency || !selectedPeriod) {
            toast.error("Please select a payment period");
            return;
        }

        const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder";
        const reference = generatePaymentReference();

        setIsProcessing(true);
        setError(null);

        try {
            // Convert selected period to PaymentPeriod format
            const paymentPeriod: PaymentPeriod = {
                month: selectedPeriod.month,
                monthEnd: selectedPeriod.monthEnd || null,
                year: selectedPeriod.year,
                label: selectedPeriod.label
            };

            // Create pending payment record using utility (with duplicate prevention)
            const createResult = await createPaymentRecord(
                userId,
                charge,
                selectedFrequency,
                reference,
                paymentPeriod
            );

            if (!createResult.success) {
                if (createResult.error === "This period is already paid") {
                    toast.info("This period is already paid. Refreshing...");
                    await fetchChargeStatus();
                    setIsProcessing(false);
                    return;
                }
                throw new Error(createResult.error);
            }

            // Use existing reference if one exists
            const paymentReference = createResult.existingReference || reference;

            // Load Paystack script if not already loaded
            await loadPaystackScript();

            // Close dialog BEFORE Paystack opens
            handleOpenChange(false);

            // Initialize Paystack payment
            initiatePaystack(paystackKey, paymentReference);

        } catch (error) {
            console.error("Payment initiation error:", error);
            setError((error as Error).message);
            toast.error("Failed to initiate payment: " + (error as Error).message);
            setIsProcessing(false);
        }
    };

    const initiatePaystack = (key: string, reference: string) => {
        if (!selectedFrequency || !selectedPeriod) return;

        const amount = calculatePaymentAmount(charge, selectedFrequency);

        const handler = (window as any).PaystackPop.setup({
            key: key,
            email: userEmail,
            amount: amount * 100,
            currency: "NGN",
            ref: reference,
            callback: (response: any) => {
                // Finalize payment
                finalizeSuccessfulPayment(userId, charge.id, selectedFrequency, reference)
                    .then((finalizeResult) => {
                        if (finalizeResult.success) {
                            toast.success("Payment successful! Your payment plan has been locked.");
                            onPaymentComplete?.();
                        } else {
                            toast.error(finalizeResult.error || "Payment completed but there was an error processing it");
                        }
                    })
                    .catch((error) => {
                        console.error("Payment callback error:", error);
                        toast.error("Payment completed but there was an error processing it");
                    });
            },
            onClose: () => {
                toast.info("Payment cancelled");
                // Note: State is already reset when dialog closed
            },
        });

        handler.openIframe();
    };

    const getPaymentAmount = () => {
        if (!selectedFrequency) return 0;
        return calculatePaymentAmount(charge, selectedFrequency);
    };

    // All periods paid view
    const renderAllPaidView = () => (
        <div className="p-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="font-display text-xl font-bold text-stone-900">All Paid!</h3>
            <p className="text-stone-500 text-sm">
                You're all caught up on {charge.name}. No payments due.
            </p>
            <Button
                onClick={() => handleOpenChange(false)}
                variant="outline"
                className="mt-4"
            >
                Close
            </Button>
        </div>
    );

    // Frequency selection view
    const renderFrequencySelection = () => (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Payment Plan
                    </label>
                    {chargeStatus?.isLocked && (
                        <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] tracking-widest font-bold uppercase">
                            <Lock className="h-2.5 w-2.5 mr-1" /> Locked
                        </Badge>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Monthly Option */}
                    <button
                        onClick={() => handleSelectFrequency("monthly")}
                        disabled={chargeStatus?.isLocked}
                        className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all",
                            selectedFrequency === "monthly"
                                ? "border-primary bg-primary/5"
                                : "border-stone-100 hover:border-stone-200",
                            chargeStatus?.isLocked && selectedFrequency !== "monthly" && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-stone-400" />
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                Monthly
                            </span>
                        </div>
                        <p className="font-display text-xl font-bold text-stone-900">
                            ₦{calculatePaymentAmount(charge, 'monthly').toLocaleString()}
                        </p>
                        <p className="text-xs text-stone-500">per month</p>
                    </button>

                    {/* Yearly Option */}
                    <button
                        onClick={() => handleSelectFrequency("yearly")}
                        disabled={chargeStatus?.isLocked}
                        className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden",
                            selectedFrequency === "yearly"
                                ? "border-primary bg-primary/5"
                                : "border-stone-100 hover:border-stone-200",
                            chargeStatus?.isLocked && selectedFrequency !== "yearly" && "opacity-50 cursor-not-allowed"
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
                            ₦{calculatePaymentAmount(charge, 'yearly').toLocaleString()}
                        </p>
                        <p className="text-xs text-stone-500">one-time payment</p>
                    </button>
                </div>
            </div>

            {/* Paid periods summary */}
            {chargeStatus && chargeStatus.paidPeriods.length > 0 && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">
                            Paid Periods
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {chargeStatus.paidPeriods.slice(-3).map((period, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                {period.label}
                            </Badge>
                        ))}
                        {chargeStatus.paidPeriods.length > 3 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                +{chargeStatus.paidPeriods.length - 3} more
                            </Badge>
                        )}
                    </div>
                </div>
            )}

            {/* Unpaid periods warning */}
            {chargeStatus && chargeStatus.unpaidPeriods.length > 1 && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
                            {chargeStatus.unpaidPeriods.length} Periods Due
                        </span>
                    </div>
                    <p className="text-xs text-amber-600">
                        Total arrears: ₦{chargeStatus.totalArrears.toLocaleString()}
                    </p>
                </div>
            )}
        </div>
    );

    // Period selection view (for monthly with multiple unpaid)
    const renderPeriodSelection = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    Select Month to Pay
                </label>
                {!chargeStatus?.isLocked && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStep('select_frequency')}
                        className="text-xs"
                    >
                        Back
                    </Button>
                )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
                {chargeStatus?.unpaidPeriods.map((period, idx) => (
                    <button
                        key={`${period.year}-${period.month}`}
                        onClick={() => handleSelectPeriod(period)}
                        className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center",
                            selectedPeriod?.month === period.month && selectedPeriod?.year === period.year
                                ? "border-primary bg-primary/5"
                                : "border-stone-100 hover:border-stone-200"
                        )}
                    >
                        <div>
                            <p className="font-bold text-stone-900">{period.label}</p>
                            {idx === 0 && (
                                <Badge variant="secondary" className="mt-1 text-[8px]">
                                    Oldest Due
                                </Badge>
                            )}
                        </div>
                        <span className="font-display text-lg font-bold text-stone-900">
                            ₦{period.amount.toLocaleString()}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );

    // Confirm and pay view
    const renderConfirmView = () => (
        <div className="space-y-6">
            {/* Payment Summary */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Charge
                    </span>
                    <span className="font-bold text-stone-700">
                        {charge.name}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Frequency
                    </span>
                    <Badge className={cn(
                        "text-[8px] tracking-widest font-bold uppercase",
                        selectedFrequency === 'yearly'
                            ? "bg-blue-50 text-blue-600"
                            : "bg-purple-50 text-purple-600"
                    )}>
                        {selectedFrequency}
                    </Badge>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Period
                    </span>
                    <span className="font-bold text-stone-700">
                        {selectedPeriod?.label}
                    </span>
                </div>
                <div className="border-t border-stone-200 pt-3 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Amount Due
                    </span>
                    <span className="font-display text-2xl font-bold text-stone-900">
                        ₦{getPaymentAmount().toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Warning for first-time lock */}
            {!chargeStatus?.isLocked && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2">
                    <Lock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                        Your payment frequency will be locked to <strong>{selectedFrequency}</strong> after this payment.
                    </p>
                </div>
            )}

            {/* Error display */}
            {error && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-700">{error}</p>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
                <Button
                    variant="outline"
                    onClick={() => {
                        if (chargeStatus?.isLocked) {
                            if (chargeStatus.chosenFrequency === 'monthly' && chargeStatus.unpaidPeriods.length > 1) {
                                setStep('select_period');
                            } else {
                                handleOpenChange(false);
                            }
                        } else {
                            setStep('select_frequency');
                        }
                    }}
                    disabled={isProcessing}
                    className="flex-1"
                >
                    Back
                </Button>
                <Button
                    onClick={handlePayment}
                    disabled={isProcessing || !selectedPeriod}
                    className="flex-1 h-12 bg-stone-900 text-white font-bold uppercase tracking-widest text-[10px]"
                >
                    {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Wallet className="h-4 w-4 mr-2" />
                            Pay ₦{getPaymentAmount().toLocaleString()}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md bg-white rounded-[2rem] border-stone-100 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="font-display text-xl font-bold text-stone-900 tracking-tight">
                        Pay {charge.name}
                    </DialogTitle>
                    <DialogDescription className="text-stone-500 text-sm">
                        {chargeStatus?.isLocked
                            ? `Your payment plan is locked to ${chargeStatus.chosenFrequency}.`
                            : "Choose your preferred payment frequency. This choice will be locked for future payments."
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6">
                    {step === 'loading' && (
                        <div className="p-12 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}

                    {step === 'select_frequency' && (
                        chargeStatus?.isUpToDate
                            ? renderAllPaidView()
                            : renderFrequencySelection()
                    )}

                    {step === 'select_period' && renderPeriodSelection()}

                    {step === 'confirm' && renderConfirmView()}

                    {step === 'processing' && (
                        <div className="p-12 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-stone-500 text-sm">Processing payment...</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ChargePaymentDialog;
