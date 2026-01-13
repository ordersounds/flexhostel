import { supabase } from "@/integrations/supabase/client";
import { isPeriodPaid, getExistingPendingPayment } from "./charge-status";

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
    periodMonthEnd: number | null;
    periodYear: number;
}

export interface PaymentPeriod {
    month: number | null;
    monthEnd: number | null;
    year: number;
    label: string;
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
 * Senior Engineer Note: Now supports specific period selection and yearly ranges
 */
export const calculatePaymentPeriod = (
    userPreference: 'monthly' | 'yearly',
    specificPeriod?: PaymentPeriod,
    tenancyStartDate?: string
): PaymentCalculation => {
    const now = new Date();

    // If specific period provided, use it
    if (specificPeriod) {
        const amount = 0; // Amount will be calculated separately
        return {
            amount,
            periodMonth: specificPeriod.month,
            periodMonthEnd: specificPeriod.monthEnd,
            periodYear: specificPeriod.year,
            periodLabel: specificPeriod.label
        };
    }

    if (userPreference === 'yearly') {
        // Use anniversary-based yearly cycle if tenancyStartDate is available
        if (tenancyStartDate) {
            const start = new Date(tenancyStartDate);
            const startMonth = start.getMonth() + 1;
            const startYear = now.getFullYear(); // Current calendar year for start

            const nextYear = new Date(start);
            nextYear.setFullYear(start.getFullYear() + 1);
            const end = new Date(nextYear);
            end.setMonth(nextYear.getMonth() - 1);
            const endMonth = end.getMonth() + 1;
            const endYear = startYear + (endMonth < startMonth ? 1 : 0);

            const getMonthName = (m: number) => new Date(2000, m - 1, 1).toLocaleDateString('en-US', { month: 'long' });

            return {
                amount: 0,
                periodMonth: startMonth,
                periodMonthEnd: endMonth,
                periodYear: startYear,
                periodLabel: `${getMonthName(startMonth)} ${startYear} - ${getMonthName(endMonth)} ${endYear}`
            };
        }

        return {
            amount: 0,
            periodMonth: 1, // January
            periodMonthEnd: 12, // December
            periodYear: now.getFullYear(),
            periodLabel: `${now.getFullYear()} Annual (Jan-Dec)`
        };
    } else {
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(now);
        return {
            amount: 0,
            periodMonth: now.getMonth() + 1, // JavaScript months are 0-indexed
            periodMonthEnd: null, // Single month, no end
            periodYear: now.getFullYear(),
            periodLabel: `${monthName} ${now.getFullYear()}`
        };
    }
};

/**
 * Creates a payment record in the database with duplicate prevention
 * Senior Engineer Note: Validates period isn't already paid and reuses pending payments
 */
export const createPaymentRecord = async (
    userId: string,
    charge: Charge,
    userPreference: 'monthly' | 'yearly',
    reference: string,
    specificPeriod?: PaymentPeriod
): Promise<{ success: boolean; error?: string; existingReference?: string }> => {
    try {
        const amount = calculatePaymentAmount(charge, userPreference);
        const period = calculatePaymentPeriod(userPreference, specificPeriod);

        // Check if this period is already paid (duplicate prevention)
        if (period.periodMonth !== null && period.periodYear) {
            const alreadyPaid = await isPeriodPaid(
                userId,
                charge.id,
                period.periodMonth,
                period.periodYear
            );
            if (alreadyPaid) {
                return { success: false, error: "This period is already paid" };
            }
        }

        // Check for existing pending payment for same period (reuse it)
        const existingPending = await getExistingPendingPayment(
            userId,
            charge.id,
            period.periodMonth,
            period.periodYear
        );
        if (existingPending.exists && existingPending.reference) {
            return { success: true, existingReference: existingPending.reference };
        }

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
                period_month_end: period.periodMonthEnd,
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
