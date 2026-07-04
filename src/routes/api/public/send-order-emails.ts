import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({ order_id: z.string().uuid() });

export const Route = createFileRoute("/api/public/send-order-emails")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const parsed = bodySchema.safeParse(body);
        if (!parsed.success) return new Response("Bad request", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("*, customers(name, email, phone)")
          .eq("id", parsed.data.order_id)
          .maybeSingle();
        if (!order) return new Response("Not found", { status: 404 });

        const RESEND_KEY = process.env.RESEND_API_KEY;
        const LOVABLE_KEY = process.env.LOVABLE_API_KEY;
        if (!RESEND_KEY || !LOVABLE_KEY) {
          // Emails will be enabled when Resend connector is connected.
          return Response.json({ ok: false, skipped: "resend_not_connected" });
        }

        const items = (order.items as any[]).map((i: any) => `<li>${i.name} × ${i.qty} — PKR ${i.price * i.qty}</li>`).join("");
        const customerEmail = order.customers?.email;
        const customerHtml = `
          <h1 style="font-family:serif;color:#4A2545">Thank you for your order</h1>
          <p>Hi ${order.shipping_name}, we've received your order #${String(order.id).slice(0, 8)}.</p>
          <ul>${items}</ul>
          <p><strong>Total: PKR ${order.total_price}</strong></p>
          <p>We'll be in touch as your pieces are prepared.</p>
          <p style="color:#9B7FB8">— Eshaal's Gulkari by Tazeen Faisal</p>
        `;

        const { data: admins } = await supabaseAdmin.from("admin_users").select("email");
        const adminEmails = (admins ?? []).map((a) => a.email);

        const send = (to: string[], subject: string, html: string) =>
          fetch("https://connector-gateway.lovable.dev/resend/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LOVABLE_KEY}`,
              "X-Connection-Api-Key": RESEND_KEY,
            },
            body: JSON.stringify({ from: "Eshaal's Gulkari <onboarding@resend.dev>", to, subject, html }),
          });

        const results: any = {};
        if (customerEmail) results.customer = (await send([customerEmail], "Your Eshaal's Gulkari order", customerHtml)).status;
        if (adminEmails.length > 0) {
          const adminHtml = `<h2>New order</h2><p>${order.shipping_name} · ${order.shipping_phone}</p><p>${order.shipping_address}</p><ul>${items}</ul><p><strong>Total: PKR ${order.total_price}</strong></p>`;
          results.admin = (await send(adminEmails, `New order #${String(order.id).slice(0, 8)}`, adminHtml)).status;
        }
        return Response.json({ ok: true, results });
      },
    },
  },
});
