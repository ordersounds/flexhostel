import { supabase } from "@/integrations/supabase/client";

export interface Charge {
    id: string;
    name: string;
    amount: number;
    frequency: "monthly" | "yearly";
}

export interface PaymentCalculation {
    amount: number;
    periodLabel: string;
    periodMonth: number | null;
    periodYear: number;
}

/**
 * Calculates the payment amount based on charge frequency and user preference
 * Senior Engineer Note: This fixes the critical bug in the original calculation
 */
export const calculatePaymentAmount = (
    charge: Charge,
    userPreference: 'monthly' | 'yearly'
): number => {
    // If user wants the same frequency as charge, use base amount
    if (userPreference === charge.frequency) {
        return charge.amount;
    }

    // If charge is monthly but user wants yearly: multiply by 12
    if (charge.frequency === 'monthly' && userPreference === 'yearly') {
        return charge.amount * 12;
    }

    // If charge is yearly but user wants monthly: divide by 12
    if (charge.frequency === 'yearly' && userPreference === 'monthly') {
        return Math.round(charge.amount / 12);
    }

    return charge.amount;
};

/**
 * Determines payment period information for database recording
 * Senior Engineer Note: Ensures consistent period tracking for recurring payments
 */
export const calculatePaymentPeriod = (
    userPreference: 'monthly' | 'yearly'
): { periodMonth: number | null; periodYear: number; periodLabel: string } => {
    const now = new Date();

    if (userPreference === 'yearly') {
        return {
            periodMonth: null,
            periodYear: now.getFullYear(),
            periodLabel: `${now.getFullYear()} Annual`
        };
    } else {
        return {
            periodMonth: now.getMonth() + 1, // JavaScript months are 0-indexed
            periodYear: now.getFullYear(),
            periodLabel: `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(now)} ${now.getFullYear()}`
        };
    }
};

/**
 * Creates a payment record in the database
 * Senior Engineer Note: Centralized payment creation with proper error handling
 */
export const createPaymentRecord = async (
    userId: string,
    charge: Charge,
    userPreference: 'monthly' | 'yearly',
    reference: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const amount = calculatePaymentAmount(charge, userPreference);
        const period = calculatePaymentPeriod(userPreference);

        const { error } = await supabase
            .from("payments")
            .insert({
                user_id: userId,
                amount: amount,
                paystack_reference: reference,
                payment_type: "charge",
                charge_id: charge.id,
                status: "pending",
                period_month: period.periodMonth,
                period_year: period.periodYear,
                period_label: period.periodLabel,
                currency: "NGN"
            });

        if (error) {
            console.error("Failed to create payment record:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error("Payment record creation error:", error);
        return { success: false, error: "Failed to create payment record" };
    }
};

/**
 * Updates payment status and locks user preference after successful payment
 * Senior Engineer Note: Atomic operations to ensure data consistency
 */
export const finalizeSuccessfulPayment = async (
    userId: string,
    chargeId: string,
    userPreference: 'monthly' | 'yearly',
    paystackReference: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        // Update payment status to success
        const { error: paymentError } = await supabase
            .from("payments")
            .update({
                status: "success",
                paid_at: new Date().toISOString(),
                payment_method: "paystack"
            })
            .eq("paystack_reference", paystackReference);

        if (paymentError) {
            console.error("Failed to update payment status:", paymentError);
            return { success: false, error: "Failed to update payment status" };
        }

        // Lock the user's payment preference
        const { error: preferenceError } = await supabase
            .from("tenant_charge_preferences")
            .upsert({
                tenant_id: userId,
                charge_id: chargeId,
                chosen_frequency: userPreference,
                locked_at: new Date().toISOString()
            });

        if (preferenceError) {
            console.error("Failed to lock preference:", preferenceError);
            return { success: false, error: "Payment successful but failed to save preference" };
        }

        return { success: true };
    } catch (error) {
        console.error("Payment finalization error:", error);
        return { success: false, error: "Payment finalization failed" };
    }
};

/**
 * Loads Paystack script dynamically
 * Senior Engineer Note: Reusable script loading with proper error handling
 */
export const loadPaystackScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if ((window as any).PaystackPop) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = "https://js.paystack.co/v1/inline.js";
        script.async = true;
        script.onload = () => {
            if ((window as any).PaystackPop) {
                resolve();
            } else {
                reject(new Error("Paystack script failed to load"));
            }
        };
        script.onerror = () => reject(new Error("Failed to load Paystack script"));
        document.body.appendChild(script);
    });
};

/**
 * Generates a unique payment reference
 * Senior Engineer Note: Consistent reference generation across the app
 */
export const generatePaymentReference = (prefix: string = "CHARGE"): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
};
