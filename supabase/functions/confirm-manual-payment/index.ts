import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  console.log("🔥 Function called - method:", req.method);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("📝 Processing request...");

  try {
    // Get auth token
    const authHeader = req.headers.get("authorization");
    console.log("🔐 Auth header present:", !!authHeader);

    if (!authHeader) {
      console.log("❌ No auth header");
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
    console.log("🔍 Verifying token...");

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log("👤 User found:", !!user, "Auth error:", !!authError);

    if (authError || !user) {
      console.error("❌ Auth error:", authError);
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

    console.log("🎭 User role:", profile?.role);

    if (profile?.role !== "landlord") {
      console.log("❌ Not a landlord");
      return new Response(
        JSON.stringify({ error: "Only landlords can confirm manual payments" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    console.log("📦 Request body:", body);

    const {
      application_id,      // For creating manual rent payment for approved application
      notes
    } = body;

    console.log("🆔 Application ID:", application_id);

    const now = new Date().toISOString();

    // Create manual rent payment for approved application
    if (application_id) {
      console.log("Creating manual rent payment for application:", application_id);

      // Get application details
      const { data: application } = await supabase
        .from("applications")
        .select(`
          *,
          room:rooms(price, id),
          applicant:profiles(id, name)
        `)
        .eq("id", application_id)
        .single();

      if (!application) {
        return new Response(
          JSON.stringify({ error: "Application not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if rent payment already exists for this user
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("user_id", application.user_id)
        .eq("payment_type", "rent")
        .eq("status", "success")
        .maybeSingle();

      if (existingPayment) {
        return new Response(
          JSON.stringify({ error: "Rent payment already exists for this applicant" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const reference = `MANUAL_RENT_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Create the manual rent payment
      const { data: newPayment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: application.user_id,
          application_id: application.id,
          amount: application.room.price,
          payment_type: "rent",
          paystack_reference: reference,
          status: "success",
          paid_at: now,
          verified_at: now,
          manual_confirmation_by: user.id,
          payment_method: "manual",
          notes: notes || "Manually confirmed rent payment by landlord",
          currency: "NGN",
        })
        .select()
        .single();

      if (paymentError) {
        console.error("Error creating payment:", paymentError);
        return new Response(
          JSON.stringify({ error: "Failed to create payment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if tenancy already exists
      const { data: existingTenancy } = await supabase
        .from("tenancies")
        .select("id")
        .eq("tenant_id", application.user_id)
        .eq("status", "active")
        .maybeSingle();

      if (!existingTenancy) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);

        const { error: tenancyError } = await supabase
          .from("tenancies")
          .insert({
            tenant_id: application.user_id,
            room_id: application.room.id,
            payment_id: newPayment.id,
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            status: "active",
          });

        if (tenancyError) {
          console.error("Error creating tenancy:", tenancyError);
          return new Response(
            JSON.stringify({ error: "Failed to create tenancy" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update room status and user role
        await supabase
          .from("rooms")
          .update({ status: "occupied" })
          .eq("id", application.room.id);

        await supabase
          .from("profiles")
          .update({ role: "tenant" })
          .eq("id", application.user_id);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Manual rent payment recorded and tenancy created" }),
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
