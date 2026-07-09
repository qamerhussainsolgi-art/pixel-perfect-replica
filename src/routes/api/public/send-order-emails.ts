import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({ order_id: z.string().uuid() });

export const Route = createFileRoute("/api/public/send-order-emails")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth: shared-secret header. Rejects unauthenticated enumeration attempts.
        const INTERNAL_TOKEN = process.env.INTERNAL_API_TOKEN;
        if (!INTERNAL_TOKEN) {
          console.error("[send-order-emails] INTERNAL_API_TOKEN not configured");
          return new Response("Server misconfigured", { status: 500 });
        }
        const providedToken = request.headers.get("x-internal-token") ?? "";
        // Constant-time compare
        const a = Buffer.from(providedToken);
        const b = Buffer.from(INTERNAL_TOKEN);
        const { timingSafeEqual } = await import("crypto");
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Unauthorized", { status: 401 });
        }

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
        if (!RESEND_KEY) {
          console.warn("[send-order-emails] RESEND_API_KEY not set; skipping email send");
          return Response.json({ ok: false, skipped: "resend_not_configured" });
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
        const adminEmails = (admins ?? []).map((a: { email: string }) => a.email);

        const send = async (to: string[], subject: string, html: string) => {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_KEY}`,
            },
            body: JSON.stringify({
              from: "Eshaal's Gulkari <orders@eshaalsgulkari.com>",
              to,
              subject,
              html,
            }),
          });
          if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[send-order-emails] Resend API error: ${response.status} ${errorBody}`);
          }
          return response;
        };

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
