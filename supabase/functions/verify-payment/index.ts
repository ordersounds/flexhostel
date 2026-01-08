import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference, payment_id } = await req.json();

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Missing payment reference" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying payment with reference:", reference);

    // Verify with Paystack
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment verification not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();
    console.log("Paystack verification response:", JSON.stringify(verifyData));

    if (!verifyData.status || verifyData.data?.status !== "success") {
      console.error("Payment verification failed:", verifyData.message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: verifyData.message || "Payment verification failed" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment verified - update database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the payment record by reference
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*, applications(*)")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (paymentError) {
      console.error("Error finding payment:", paymentError);
      return new Response(
        JSON.stringify({ success: false, error: "Payment record not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payment) {
      console.error("Payment not found for reference:", reference);
      return new Response(
        JSON.stringify({ success: false, error: "Payment record not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update payment status
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "success",
        paid_at: now,
        verified_at: now,
        payment_method: verifyData.data?.channel || "paystack",
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Error updating payment:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update payment" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Payment updated successfully:", payment.id);

    // If this is a rent payment (has application_id), create tenancy
    if (payment.payment_type === "rent" && payment.application_id) {
      const { data: application } = await supabase
        .from("applications")
        .select("*, rooms(*)")
        .eq("id", payment.application_id)
        .single();

      if (application) {
        // Calculate tenancy dates (1 year from today)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);

        // Create tenancy record
        const { data: tenancy, error: tenancyError } = await supabase
          .from("tenancies")
          .insert({
            tenant_id: payment.user_id,
            room_id: application.room_id,
            payment_id: payment.id,
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            status: "active",
          })
          .select()
          .single();

        if (tenancyError) {
          console.error("Error creating tenancy:", tenancyError);
        } else {
          console.log("Tenancy created:", tenancy.id);

          // Update room status to occupied
          await supabase
            .from("rooms")
            .update({ status: "occupied" })
            .eq("id", application.room_id);

          // Update user role to tenant
          await supabase
            .from("profiles")
            .update({ role: "tenant" })
            .eq("id", payment.user_id);

          console.log("Room status and user role updated");
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Payment verified successfully",
        payment_type: payment.payment_type
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
