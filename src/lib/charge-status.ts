import { supabase } from "@/integrations/supabase/client";

/**
 * Professional Charge Payment Status System
 * Senior Engineer Implementation: Period-aware payment tracking with comprehensive status
 */

export interface PaidPeriod {
    month: number;
    monthEnd?: number | null;
    year: number;
    label: string;
    paymentId: string;
    paidAt: string;
}

export interface UnpaidPeriod {
    month: number;
    year: number;
    label: string;
    amount: number;
}

export interface ChargePaymentStatus {
    chargeId: string;
    chargeName: string;
    chargeAmount: number;
    chargeFrequency: 'monthly' | 'yearly';
    chosenFrequency: 'monthly' | 'yearly' | null;
    isLocked: boolean;
    lockedAt: string | null;
    currentPeriodPaid: boolean;
    paidPeriods: PaidPeriod[];
    unpaidPeriods: UnpaidPeriod[];
    nextPaymentDue: UnpaidPeriod | null;
    totalArrears: number;
}

export interface PaymentRecord {
    id: string;
    charge_id: string;
    user_id: string;
    status: string;
    period_month: number | null;
    period_month_end: number | null;
    period_year: number | null;
    period_label: string | null;
    paid_at: string | null;
    amount: number;
}

/**
 * Get the month name for a given month number (1-12)
 */
const getMonthName = (month: number): string => {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long' });
};

/**
 * Check if a specific month/year is covered by existing payments
 */
const isMonthCovered = (
    month: number,
    year: number,
    payments: PaymentRecord[]
): PaymentRecord | null => {
    for (const payment of payments) {
        if (payment.status !== 'success' || payment.period_year !== year) continue;

        // Yearly payment covers all months
        if (payment.period_month_end !== null && payment.period_month !== null) {
            if (month >= payment.period_month && month <= payment.period_month_end) {
                return payment;
            }
        }
        // Monthly payment covers single month
        else if (payment.period_month === month) {
            return payment;
        }
    }
    return null;
};

/**
 * Get comprehensive charge payment status for a tenant
 */
export const getChargePaymentStatus = async (
    userId: string,
    chargeId: string,
    chargeName: string,
    chargeAmount: number,
    chargeFrequency: 'monthly' | 'yearly',
    tenancyStartDate: string
): Promise<ChargePaymentStatus> => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    const tenancyStart = new Date(tenancyStartDate);
    const startMonth = tenancyStart.getMonth() + 1;
    const startYear = tenancyStart.getFullYear();

    // Fetch tenant's preference for this charge
    const { data: preference } = await supabase
        .from("tenant_charge_preferences")
        .select("*")
        .eq("tenant_id", userId)
        .eq("charge_id", chargeId)
        .maybeSingle();

    // Fetch all successful payments for this charge
    const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("charge_id", chargeId)
        .eq("user_id", userId)
        .eq("status", "success")
        .order("period_year", { ascending: true })
        .order("period_month", { ascending: true });

    const paymentRecords = (payments || []) as PaymentRecord[];
    const chosenFrequency = preference?.chosen_frequency as 'monthly' | 'yearly' | null;
    const isLocked = !!preference?.locked_at;

    const paidPeriods: PaidPeriod[] = [];
    const unpaidPeriods: UnpaidPeriod[] = [];

    // Determine effective frequency (chosen or default to charge frequency)
    const effectiveFrequency = chosenFrequency || chargeFrequency;

    if (effectiveFrequency === 'yearly') {
        // For yearly frequency, check each year from tenancy start to current
        for (let year = startYear; year <= currentYear; year++) {
            const yearPayment = paymentRecords.find(p => 
                p.period_year === year && 
                (p.period_month_end !== null || p.period_month === null || p.period_month === 1)
            );

            if (yearPayment) {
                paidPeriods.push({
                    month: yearPayment.period_month || 1,
                    monthEnd: yearPayment.period_month_end || 12,
                    year: year,
                    label: `${year} Annual (Jan-Dec)`,
                    paymentId: yearPayment.id,
                    paidAt: yearPayment.paid_at || ''
                });
            } else {
                // Calculate yearly amount based on charge frequency
                const yearlyAmount = chargeFrequency === 'monthly' 
                    ? chargeAmount * 12 
                    : chargeAmount;
                
                unpaidPeriods.push({
                    month: 1,
                    year: year,
                    label: `${year} Annual`,
                    amount: yearlyAmount
                });
            }
        }
    } else {
        // For monthly frequency, check each month from tenancy start to current
        let checkYear = startYear;
        let checkMonth = startMonth;

        while (checkYear < currentYear || (checkYear === currentYear && checkMonth <= currentMonth)) {
            const monthPayment = isMonthCovered(checkMonth, checkYear, paymentRecords);

            if (monthPayment) {
                paidPeriods.push({
                    month: checkMonth,
                    monthEnd: null,
                    year: checkYear,
                    label: `${getMonthName(checkMonth)} ${checkYear}`,
                    paymentId: monthPayment.id,
                    paidAt: monthPayment.paid_at || ''
                });
            } else {
                // Calculate monthly amount based on charge frequency
                const monthlyAmount = chargeFrequency === 'yearly' 
                    ? Math.round(chargeAmount / 12) 
                    : chargeAmount;

                unpaidPeriods.push({
                    month: checkMonth,
                    year: checkYear,
                    label: `${getMonthName(checkMonth)} ${checkYear}`,
                    amount: monthlyAmount
                });
            }

            // Move to next month
            checkMonth++;
            if (checkMonth > 12) {
                checkMonth = 1;
                checkYear++;
            }
        }
    }

    // Calculate current period status
    const currentPeriodPaid = effectiveFrequency === 'yearly'
        ? paidPeriods.some(p => p.year === currentYear)
        : paidPeriods.some(p => p.month === currentMonth && p.year === currentYear);

    // Calculate total arrears
    const totalArrears = unpaidPeriods.reduce((sum, p) => sum + p.amount, 0);

    // Get next payment due (first unpaid period)
    const nextPaymentDue = unpaidPeriods.length > 0 ? unpaidPeriods[0] : null;

    return {
        chargeId,
        chargeName,
        chargeAmount,
        chargeFrequency,
        chosenFrequency,
        isLocked,
        lockedAt: preference?.locked_at || null,
        currentPeriodPaid,
        paidPeriods,
        unpaidPeriods,
        nextPaymentDue,
        totalArrears
    };
};

/**
 * Check if a specific period is already paid
 */
export const isPeriodPaid = async (
    userId: string,
    chargeId: string,
    periodMonth: number,
    periodYear: number
): Promise<boolean> => {
    const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", userId)
        .eq("charge_id", chargeId)
        .eq("status", "success")
        .eq("period_year", periodYear);

    if (!data || data.length === 0) return false;

    return data.some((payment: any) => {
        // Yearly payment covers all months
        if (payment.period_month_end !== null && payment.period_month !== null) {
            return periodMonth >= payment.period_month && periodMonth <= payment.period_month_end;
        }
        // Monthly payment covers single month
        return payment.period_month === periodMonth;
    });
};

/**
 * Check for existing pending payment for the same period
 */
export const getExistingPendingPayment = async (
    userId: string,
    chargeId: string,
    periodMonth: number | null,
    periodYear: number
): Promise<{ exists: boolean; reference?: string; id?: string }> => {
    const query = supabase
        .from("payments")
        .select("id, paystack_reference")
        .eq("charge_id", chargeId)
        .eq("user_id", userId)
        .eq("period_year", periodYear)
        .eq("status", "pending");

    if (periodMonth !== null) {
        query.eq("period_month", periodMonth);
    }

    const { data } = await query.maybeSingle();

    if (data) {
        return { exists: true, reference: data.paystack_reference, id: data.id };
    }
    return { exists: false };
};
