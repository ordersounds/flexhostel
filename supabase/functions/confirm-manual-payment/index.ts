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
    // Get auth token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is a landlord
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is landlord
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "landlord") {
      return new Response(
        JSON.stringify({ error: "Only landlords can confirm manual payments" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { 
      payment_id,          // For marking existing payment as paid
      tenant_id,           // For creating new manual payment
      payment_type,        // 'rent' | 'charge' | 'manual'
      amount,
      charge_id,
      application_id,
      tenancy_id,
      notes
    } = body;

    const now = new Date().toISOString();

    // Case 1: Mark existing payment as paid
    if (payment_id) {
      console.log("Marking payment as paid:", payment_id);

      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "success",
          paid_at: now,
          verified_at: now,
          manual_confirmation_by: user.id,
          payment_method: "manual",
          notes: notes || "Manually confirmed by landlord",
        })
        .eq("id", payment_id);

      if (updateError) {
        console.error("Error updating payment:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update payment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the payment to check if tenancy needs to be created
      const { data: payment } = await supabase
        .from("payments")
        .select("*")
        .eq("id", payment_id)
        .single();

      if (payment?.payment_type === "rent" && payment.application_id) {
        const { data: application } = await supabase
          .from("applications")
          .select("*")
          .eq("id", payment.application_id)
          .single();

        if (application) {
          // Check if tenancy already exists
          const { data: existingTenancy } = await supabase
            .from("tenancies")
            .select("id")
            .eq("tenant_id", payment.user_id)
            .eq("status", "active")
            .maybeSingle();

          if (!existingTenancy) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);

            await supabase
              .from("tenancies")
              .insert({
                tenant_id: payment.user_id,
                room_id: application.room_id,
                payment_id: payment.id,
                start_date: startDate.toISOString().split("T")[0],
                end_date: endDate.toISOString().split("T")[0],
                status: "active",
              });

            await supabase
              .from("rooms")
              .update({ status: "occupied" })
              .eq("id", application.room_id);

            await supabase
              .from("profiles")
              .update({ role: "tenant" })
              .eq("id", payment.user_id);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Payment marked as paid" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Case 2: Create new manual payment record
    if (tenant_id && amount) {
      console.log("Creating manual payment for tenant:", tenant_id);

      const reference = `MANUAL_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const { data: newPayment, error: insertError } = await supabase
        .from("payments")
        .insert({
          user_id: tenant_id,
          amount: amount,
          payment_type: payment_type || "manual",
          charge_id: charge_id || null,
          application_id: application_id || null,
          tenancy_id: tenancy_id || null,
          paystack_reference: reference,
          status: "success",
          paid_at: now,
          verified_at: now,
          manual_confirmation_by: user.id,
          payment_method: "manual",
          notes: notes || "Manual payment recorded",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating payment:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create payment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Manual payment created:", newPayment.id);

      return new Response(
        JSON.stringify({ success: true, payment: newPayment }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Missing required parameters" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Manual payment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
