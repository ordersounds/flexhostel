import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email template types
type EmailType = 
  | "welcome"
  | "application_approved"
  | "application_rejected"
  | "rent_payment_success"
  | "charge_payment_success"
  | "new_announcement";

interface EmailRequest {
  type: EmailType;
  to: string;
  data: Record<string, any>;
}

// Base email styles
const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafaf9; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
  .logo { font-size: 24px; font-weight: bold; color: #1c1917; margin-bottom: 32px; }
  .logo span { color: #ea580c; }
  h1 { color: #1c1917; font-size: 28px; margin: 0 0 16px 0; font-weight: 700; }
  p { color: #57534e; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; }
  .highlight { background: #fff7ed; border-radius: 16px; padding: 24px; margin: 24px 0; }
  .highlight-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #a8a29e; margin-bottom: 8px; }
  .highlight-value { font-size: 20px; font-weight: 700; color: #1c1917; }
  .button { display: inline-block; background: #ea580c; color: white !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 24px 0; }
  .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e7e5e4; }
  .footer p { font-size: 12px; color: #a8a29e; }
  .grid { display: flex; gap: 16px; margin: 16px 0; }
  .grid-item { flex: 1; background: #fafaf9; padding: 16px; border-radius: 12px; }
  .success-icon { width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
  .success-icon svg { width: 32px; height: 32px; color: #16a34a; }
`;

// Email templates
function getWelcomeEmail(data: { name: string; email: string }) {
  return `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">Flex<span>.</span></div>
          <h1>Welcome to Flex Hostel! 🎉</h1>
          <p>Hi ${data.name},</p>
          <p>Thank you for creating an account with Flex Hostel. You're now part of Okitipupa's premier student residence community.</p>
          
          <div class="highlight">
            <div class="highlight-label">Your Next Steps</div>
            <p style="margin: 0; color: #1c1917;">
              1. Browse available rooms<br>
              2. Submit your application<br>
              3. Complete payment upon approval
            </p>
          </div>
          
          <a href="https://flexhostel.lovable.app/dashboard" class="button">Go to Dashboard</a>
          
          <p>If you have any questions, don't hesitate to reach out to our team.</p>
          
          <div class="footer">
            <p>© 2026 Flex Hostel — Okitipupa, Nigeria</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getApplicationApprovedEmail(data: { 
  name: string; 
  roomName: string; 
  buildingName: string; 
  price: number;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">Flex<span>.</span></div>
          
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          
          <h1 style="text-align: center;">Application Approved! 🎊</h1>
          <p style="text-align: center;">Congratulations ${data.name}! Your application has been approved.</p>
          
          <div class="highlight">
            <div class="highlight-label">Your Room</div>
            <div class="highlight-value">Room ${data.roomName}</div>
            <p style="margin: 8px 0 0 0; color: #57534e;">${data.buildingName}</p>
          </div>
          
          <div class="highlight" style="background: #fef3c7;">
            <div class="highlight-label">Rent Amount</div>
            <div class="highlight-value">₦${data.price.toLocaleString()}/year</div>
            <p style="margin: 8px 0 0 0; color: #92400e; font-weight: 600;">⏰ Please complete payment within 7 days</p>
          </div>
          
          <a href="https://flexhostel.lovable.app/dashboard" class="button" style="display: block; text-align: center;">Complete Payment Now</a>
          
          <p style="text-align: center; font-size: 14px;">Your room is reserved for 7 days. After this period, it may be offered to other applicants.</p>
          
          <div class="footer">
            <p>© 2026 Flex Hostel — Okitipupa, Nigeria</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getApplicationRejectedEmail(data: { 
  name: string; 
  roomName: string; 
  buildingName: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">Flex<span>.</span></div>
          
          <h1>Application Update</h1>
          <p>Hi ${data.name},</p>
          <p>Thank you for your interest in Flex Hostel. After careful review, we regret to inform you that we are unable to approve your application for Room ${data.roomName} at ${data.buildingName} at this time.</p>
          
          <div class="highlight">
            <p style="margin: 0; color: #1c1917;">
              This decision does not reflect on you personally. We encourage you to:
            </p>
            <ul style="color: #57534e; margin: 16px 0 0 0; padding-left: 20px;">
              <li>Apply for other available rooms</li>
              <li>Contact our support team for feedback</li>
              <li>Reapply in the future</li>
            </ul>
          </div>
          
          <a href="https://flexhostel.lovable.app" class="button">Browse Other Rooms</a>
          
          <p>We wish you the best in finding suitable accommodation.</p>
          
          <div class="footer">
            <p>© 2026 Flex Hostel — Okitipupa, Nigeria</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getRentPaymentSuccessEmail(data: { 
  name: string; 
  roomName: string; 
  buildingName: string; 
  amount: number;
  startDate: string;
  endDate: string;
  reference: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">Flex<span>.</span></div>
          
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          
          <h1 style="text-align: center;">Payment Successful! 🎉</h1>
          <p style="text-align: center;">Welcome to your new home, ${data.name}!</p>
          
          <div class="highlight" style="background: #dcfce7;">
            <div class="highlight-label">Amount Paid</div>
            <div class="highlight-value" style="color: #16a34a;">₦${data.amount.toLocaleString()}</div>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #57534e;">Reference: ${data.reference}</p>
          </div>
          
          <div style="display: flex; gap: 16px; margin: 24px 0;">
            <div style="flex: 1; background: #fafaf9; padding: 16px; border-radius: 12px;">
              <div class="highlight-label">Room</div>
              <p style="margin: 4px 0 0 0; font-weight: 600; color: #1c1917;">Room ${data.roomName}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #57534e;">${data.buildingName}</p>
            </div>
            <div style="flex: 1; background: #fafaf9; padding: 16px; border-radius: 12px;">
              <div class="highlight-label">Tenancy Period</div>
              <p style="margin: 4px 0 0 0; font-weight: 600; color: #1c1917;">${data.startDate}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #57534e;">to ${data.endDate}</p>
            </div>
          </div>
          
          <a href="https://flexhostel.lovable.app/dashboard" class="button" style="display: block; text-align: center;">View Your Dashboard</a>
          
          <p style="text-align: center; font-size: 14px;">This email serves as your payment receipt. Keep it for your records.</p>
          
          <div class="footer">
            <p>© 2026 Flex Hostel — Okitipupa, Nigeria</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getChargePaymentSuccessEmail(data: { 
  name: string; 
  chargeName: string; 
  amount: number;
  periodLabel: string;
  reference: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">Flex<span>.</span></div>
          
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          
          <h1 style="text-align: center;">Payment Confirmed ✓</h1>
          <p style="text-align: center;">Your ${data.chargeName} payment has been processed successfully.</p>
          
          <div class="highlight" style="background: #dcfce7;">
            <div class="highlight-label">Amount Paid</div>
            <div class="highlight-value" style="color: #16a34a;">₦${data.amount.toLocaleString()}</div>
          </div>
          
          <div style="background: #fafaf9; padding: 20px; border-radius: 16px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #a8a29e; font-size: 12px;">Charge</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1c1917;">${data.chargeName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #a8a29e; font-size: 12px;">Period</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1c1917;">${data.periodLabel}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #a8a29e; font-size: 12px;">Reference</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1c1917; font-family: monospace;">${data.reference}</td>
              </tr>
            </table>
          </div>
          
          <p style="text-align: center; font-size: 14px;">Thank you for your prompt payment, ${data.name}!</p>
          
          <div class="footer">
            <p>© 2026 Flex Hostel — Okitipupa, Nigeria</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getAnnouncementEmail(data: { 
  name: string; 
  title: string; 
  content: string;
  buildingName: string | null;
  createdBy: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">Flex<span>.</span></div>
          
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
            <div style="background: #ea580c; color: white; padding: 6px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
              📢 Announcement
            </div>
            ${data.buildingName ? `<span style="font-size: 12px; color: #a8a29e;">${data.buildingName}</span>` : '<span style="font-size: 12px; color: #a8a29e;">All Buildings</span>'}
          </div>
          
          <h1>${data.title}</h1>
          <p>Hi ${data.name},</p>
          <p>${data.content}</p>
          
          <div style="background: #fafaf9; padding: 16px; border-radius: 12px; margin-top: 24px;">
            <p style="margin: 0; font-size: 12px; color: #a8a29e;">
              Posted by ${data.createdBy}
            </p>
          </div>
          
          <a href="https://flexhostel.lovable.app/dashboard" class="button" style="display: block; text-align: center;">View in Dashboard</a>
          
          <div class="footer">
            <p>© 2026 Flex Hostel — Okitipupa, Nigeria</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getEmailContent(type: EmailType, data: Record<string, any>): { subject: string; html: string } {
  switch (type) {
    case "welcome":
      return {
        subject: "Welcome to Flex Hostel! 🏠",
        html: getWelcomeEmail(data as any)
      };
    case "application_approved":
      return {
        subject: "🎉 Great News! Your Application is Approved",
        html: getApplicationApprovedEmail(data as any)
      };
    case "application_rejected":
      return {
        subject: "Application Update - Flex Hostel",
        html: getApplicationRejectedEmail(data as any)
      };
    case "rent_payment_success":
      return {
        subject: "✅ Rent Payment Confirmed - Welcome Home!",
        html: getRentPaymentSuccessEmail(data as any)
      };
    case "charge_payment_success":
      return {
        subject: `✅ Payment Confirmed - ${data.chargeName}`,
        html: getChargePaymentSuccessEmail(data as any)
      };
    case "new_announcement":
      return {
        subject: `📢 ${data.title}`,
        html: getAnnouncementEmail(data as any)
      };
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to ${to}`);

    if (!type || !to || !data) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, to, data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, html } = getEmailContent(type, data);

    const emailResponse = await resend.emails.send({
      from: "Flex Hostel <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
