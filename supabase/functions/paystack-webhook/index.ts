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
          .select("*, rooms(room_name, building:buildings(name))")
          .eq("id", payment.application_id)
          .single();

        if (application) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setFullYear(endDate.getFullYear() + 1);

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

          if (!tenancyError && tenancy) {
            // Update payment with tenancy_id
            const { error: paymentUpdateError } = await supabase
              .from("payments")
              .update({ tenancy_id: tenancy.id })
              .eq("id", payment.id);

            if (paymentUpdateError) {
              console.error("Error updating payment tenancy_id:", paymentUpdateError);
              // Continue with other updates even if this fails
            }

            await supabase
              .from("rooms")
              .update({ status: "occupied" })
              .eq("id", application.room_id);

            // Update user role to tenant (including phone number sync)
            const profileUpdates: any = { role: "tenant" };
            const submittedPhone = (application.submitted_data as any)?.personal?.phone;
            if (submittedPhone) {
              profileUpdates.phone_number = submittedPhone;
            }

            await supabase
              .from("profiles")
              .update(profileUpdates)
              .eq("id", payment.user_id);

            // Get user email and send rent payment success email
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, name")
              .eq("id", payment.user_id)
              .single();

            if (profile?.email) {
              try {
                const emailUrl = `${supabaseUrl}/functions/v1/send-email`;
                await fetch(emailUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${supabaseServiceKey}`,
                  },
                  body: JSON.stringify({
                    type: "rent_payment_success",
                    to: profile.email,
                    data: {
                      name: profile.name || "Resident",
                      roomName: application.rooms?.room_name || "N/A",
                      buildingName: application.rooms?.building?.name || "Flex Hostel",
                      amount: payment.amount,
                      startDate: startDate.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }),
                      endDate: endDate.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }),
                      reference: reference,
                    },
                  }),
                });
                console.log("Rent payment success email sent");
              } catch (emailError) {
                console.error("Failed to send rent payment email:", emailError);
              }
            }
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
