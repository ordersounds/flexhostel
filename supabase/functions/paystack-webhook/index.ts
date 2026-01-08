import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("x-paystack-signature");
    const body = await req.text();

    console.log("Webhook received, signature:", signature ? "present" : "missing");

    // Validate webhook signature
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return new Response("Configuration error", { status: 500 });
    }

    // Verify signature
    const hash = createHmac("sha512", paystackSecretKey)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.error("Invalid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const payload = JSON.parse(body);
    console.log("Webhook event:", payload.event);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle charge.success event
    if (payload.event === "charge.success") {
      const { reference, status, channel } = payload.data;

      console.log("Processing charge.success for reference:", reference);

      // Find and update payment
      const { data: payment, error: findError } = await supabase
        .from("payments")
        .select("*")
        .eq("paystack_reference", reference)
        .maybeSingle();

      if (findError || !payment) {
        console.error("Payment not found:", reference, findError);
        return new Response("Payment not found", { status: 404 });
      }

      // Skip if already verified
      if (payment.status === "success" && payment.verified_at) {
        console.log("Payment already verified, skipping");
        return new Response("Already processed", { status: 200 });
      }

      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "success",
          paid_at: now,
          verified_at: now,
          payment_method: channel || "paystack",
        })
        .eq("id", payment.id);

      if (updateError) {
        console.error("Failed to update payment:", updateError);
        return new Response("Update failed", { status: 500 });
      }

      // Handle tenancy creation for rent payments
      if (payment.payment_type === "rent" && payment.application_id) {
        const { data: application } = await supabase
          .from("applications")
          .select("*")
          .eq("id", payment.application_id)
          .single();

        if (application) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setFullYear(endDate.getFullYear() + 1);

          const { error: tenancyError } = await supabase
            .from("tenancies")
            .insert({
              tenant_id: payment.user_id,
              room_id: application.room_id,
              payment_id: payment.id,
              start_date: startDate.toISOString().split("T")[0],
              end_date: endDate.toISOString().split("T")[0],
              status: "active",
            });

          if (!tenancyError) {
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

      console.log("Webhook processed successfully for:", reference);
    }

    // Handle charge.failed event
    if (payload.event === "charge.failed") {
      const { reference } = payload.data;
      
      console.log("Processing charge.failed for reference:", reference);

      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("paystack_reference", reference);
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Internal error", { status: 500 });
  }
});
