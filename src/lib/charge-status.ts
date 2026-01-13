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
    monthEnd?: number | null;
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
    isUpToDate: boolean;
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
 * Senior Engineer Fix: Correctly handles yearly payments spanning calendar years
 */
const isMonthCovered = (
    month: number,
    year: number,
    payments: PaymentRecord[]
): PaymentRecord | null => {
    const targetVal = year * 12 + month;

    for (const payment of payments) {
        if (payment.status !== 'success') continue;
        if (payment.period_year === null || payment.period_month === null) continue;

        // Yearly payment covers a range of months (possibly spanning calendar years)
        if (payment.period_month_end !== null) {
            const startYear = payment.period_year;
            const startMonth = payment.period_month;
            const endMonth = payment.period_month_end;
            // If end month is less than start month, the period spans into next year
            const endYear = endMonth < startMonth ? startYear + 1 : startYear;

            const startVal = startYear * 12 + startMonth;
            const endVal = endYear * 12 + endMonth;

            if (targetVal >= startVal && targetVal <= endVal) {
                return payment;
            }
        }
        // Monthly payment covers single month
        else if (payment.period_month === month && payment.period_year === year) {
            return payment;
        }
    }
    return null;
};

/**
 * Get comprehensive charge payment status for a tenant
 * Senior Engineer Note: Always fetches fresh data to prevent stale state issues
 */
export const getChargePaymentStatus = async (
    userId: string,
    chargeId: string,
    chargeName: string,
    chargeAmount: number,
    chargeFrequency: 'monthly' | 'yearly',
    tenancyStartDate: string,
    overrideFrequency?: 'monthly' | 'yearly'
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

    // Always fetch fresh payment data to prevent stale state issues
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

    // Determine effective frequency (override > chosen > default)
    const effectiveFrequency = overrideFrequency || chosenFrequency || chargeFrequency;

    if (effectiveFrequency === 'yearly') {
        // For yearly frequency, calculate 12-month blocks starting from tenancy start
        let checkDate = new Date(tenancyStart);

        // We check from start date up to "now" (plus one cycle if we are in it)
        while (checkDate <= now) {
            const cycleStartMonth = checkDate.getMonth() + 1;
            const cycleStartYear = checkDate.getFullYear();

            // End month is 1 month before the next year start
            const nextCycleStart = new Date(checkDate);
            nextCycleStart.setFullYear(nextCycleStart.getFullYear() + 1);

            const tempEnd = new Date(nextCycleStart);
            tempEnd.setMonth(tempEnd.getMonth() - 1);
            const cycleEndMonth = tempEnd.getMonth() + 1;
            const cycleEndYear = tempEnd.getFullYear();

            const yearPayment = paymentRecords.find(p =>
                p.period_year === cycleStartYear &&
                p.period_month === cycleStartMonth &&
                p.period_month_end === cycleEndMonth
            );

            const label = `${getMonthName(cycleStartMonth)} ${cycleStartYear} - ${getMonthName(cycleEndMonth)} ${cycleEndYear}`;

            if (yearPayment) {
                paidPeriods.push({
                    month: cycleStartMonth,
                    monthEnd: cycleEndMonth,
                    year: cycleStartYear,
                    label: label,
                    paymentId: yearPayment.id,
                    paidAt: yearPayment.paid_at || ''
                });
            } else {
                const yearlyAmount = chargeFrequency === 'monthly' ? chargeAmount * 12 : chargeAmount;
                unpaidPeriods.push({
                    month: cycleStartMonth,
                    monthEnd: cycleEndMonth,
                    year: cycleStartYear,
                    label: label,
                    amount: yearlyAmount
                });
            }

            // Move to next 12-month cycle
            checkDate = nextCycleStart;
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
        totalArrears,
        isUpToDate: unpaidPeriods.length === 0
    };
};

/**
 * Check if a specific period is already paid
 * Senior Engineer Fix: Handles cross-year yearly payments correctly
 */
export const isPeriodPaid = async (
    userId: string,
    chargeId: string,
    periodMonth: number,
    periodYear: number
): Promise<boolean> => {
    // Fetch all successful payments for this charge (not just the specific year)
    // because yearly payments can span across calendar years
    const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", userId)
        .eq("charge_id", chargeId)
        .eq("status", "success");

    if (!data || data.length === 0) return false;

    const targetVal = periodYear * 12 + periodMonth;

    return data.some((payment: any) => {
        if (payment.period_year === null || payment.period_month === null) return false;

        // Yearly payment covers a range
        if (payment.period_month_end !== null) {
            const startYear = payment.period_year;
            const startMonth = payment.period_month;
            const endMonth = payment.period_month_end;
            const endYear = endMonth < startMonth ? startYear + 1 : startYear;

            const startVal = startYear * 12 + startMonth;
            const endVal = endYear * 12 + endMonth;

            return targetVal >= startVal && targetVal <= endVal;
        }
        // Monthly payment covers single month
        return payment.period_month === periodMonth && payment.period_year === periodYear;
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
