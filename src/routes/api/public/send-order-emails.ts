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

        const orderRef = String(order.id).slice(0, 8).toUpperCase();
        const fmtPKR = (n: number) => "PKR " + new Intl.NumberFormat("en-PK").format(Math.round(n));
        const orderItems = (order.items as any[]) ?? [];

        const customerRows = orderItems
          .map(
            (i: any) => `
              <tr>
                <td style="padding:10px 8px;border-bottom:1px solid #E8DFD1;font-family:Georgia,serif;color:#4A2545">${i.name}</td>
                <td style="padding:10px 8px;border-bottom:1px solid #E8DFD1;text-align:center;font-family:Georgia,serif;color:#4A2545">${i.qty}</td>
                <td style="padding:10px 8px;border-bottom:1px solid #E8DFD1;text-align:right;font-family:Georgia,serif;color:#4A2545">${fmtPKR(i.price * i.qty)}</td>
              </tr>`
          )
          .join("");

        const customerEmail = order.customers?.email;
        const customerHtml = `
          <div style="background:#F5F0E8;padding:32px 16px;font-family:Georgia,serif;color:#4A2545">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E8DFD1;border-radius:8px;overflow:hidden">
              <div style="padding:28px 32px;border-bottom:1px solid #E8DFD1;text-align:center">
                <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;color:#4A2545">Eshaal's Gulkari</h1>
                <p style="margin:6px 0 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#9B7FB8">Order confirmed</p>
              </div>
              <div style="padding:28px 32px">
                <p style="margin:0 0 12px;font-size:16px">Dear ${order.shipping_name},</p>
                <p style="margin:0 0 16px;line-height:1.6">Thank you for your order. We're delighted to be crafting these pieces for you and will be in touch as soon as they're ready to ship.</p>
                <p style="margin:0 0 20px;font-size:13px;color:#7A5A73">Order reference: <strong>#${orderRef}</strong></p>
                <table style="width:100%;border-collapse:collapse;margin:12px 0 20px">
                  <thead>
                    <tr style="background:#F5F0E8">
                      <th style="padding:10px 8px;text-align:left;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7A5A73">Item</th>
                      <th style="padding:10px 8px;text-align:center;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7A5A73">Qty</th>
                      <th style="padding:10px 8px;text-align:right;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7A5A73">Price</th>
                    </tr>
                  </thead>
                  <tbody>${customerRows}</tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" style="padding:14px 8px;text-align:right;font-weight:bold;color:#4A2545">Total</td>
                      <td style="padding:14px 8px;text-align:right;font-weight:bold;color:#4A2545">${fmtPKR(Number(order.total_price))}</td>
                    </tr>
                  </tfoot>
                </table>
                <p style="margin:24px 0 8px;line-height:1.6">Questions about your order? Reach us on WhatsApp:</p>
                <p style="margin:0 0 24px"><a href="https://wa.me/923164349900" style="display:inline-block;padding:10px 20px;background:#4A2545;color:#F5F0E8;text-decoration:none;border-radius:4px">Message on WhatsApp</a></p>
                <p style="margin:28px 0 4px;line-height:1.6">Warmly,</p>
                <p style="margin:0;font-family:Georgia,serif;color:#4A2545"><strong>Tazeen Faisal Khan</strong><br/><span style="font-size:13px;color:#7A5A73">Eshaal's Gulkari</span></p>
              </div>
            </div>
          </div>
        `;

        const notesBlock = order.order_notes
          ? `<p style="margin:8px 0"><strong>Notes:</strong> ${order.order_notes}</p>`
          : "";
        const adminRows = orderItems
          .map(
            (i: any) => `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #ddd">${i.name}</td>
                <td style="padding:8px;border-bottom:1px solid #ddd;text-align:center">${i.qty}</td>
                <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${fmtPKR(i.price)}</td>
                <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${fmtPKR(i.price * i.qty)}</td>
              </tr>`
          )
          .join("");
        const adminHtml = `
          <div style="font-family:Arial,sans-serif;color:#222;max-width:640px;margin:0 auto;padding:20px">
            <h2 style="color:#4A2545;margin:0 0 4px">New order #${orderRef}</h2>
            <p style="margin:0 0 20px;color:#666">Total: <strong>${fmtPKR(Number(order.total_price))}</strong></p>
            <h3 style="margin:16px 0 8px;color:#4A2545">Customer</h3>
            <p style="margin:4px 0"><strong>Name:</strong> ${order.shipping_name}</p>
            <p style="margin:4px 0"><strong>Phone:</strong> <a href="tel:${order.shipping_phone}">${order.shipping_phone}</a></p>
            ${order.customers?.email ? `<p style="margin:4px 0"><strong>Email:</strong> <a href="mailto:${order.customers.email}">${order.customers.email}</a></p>` : ""}
            <p style="margin:4px 0"><strong>Address:</strong> ${order.shipping_address}</p>
            ${notesBlock}
            <h3 style="margin:20px 0 8px;color:#4A2545">Items</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <thead>
                <tr style="background:#f5f0e8">
                  <th style="padding:8px;text-align:left">Product</th>
                  <th style="padding:8px;text-align:center">Qty</th>
                  <th style="padding:8px;text-align:right">Unit</th>
                  <th style="padding:8px;text-align:right">Subtotal</th>
                </tr>
              </thead>
              <tbody>${adminRows}</tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding:10px 8px;text-align:right;font-weight:bold">Total</td>
                  <td style="padding:10px 8px;text-align:right;font-weight:bold">${fmtPKR(Number(order.total_price))}</td>
                </tr>
              </tfoot>
            </table>
            <p style="margin:24px 0"><a href="https://eshaalsgulkari.com/admin/orders" style="display:inline-block;padding:10px 20px;background:#4A2545;color:#F5F0E8;text-decoration:none;border-radius:4px">Open admin orders</a></p>
          </div>
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
        if (customerEmail) {
          results.customer = (await send([customerEmail], "Your order is confirmed — Eshaal's Gulkari", customerHtml)).status;
        }
        if (adminEmails.length > 0) {
          results.admin = (await send(adminEmails, `New order #${orderRef} — ${fmtPKR(Number(order.total_price))}`, adminHtml)).status;
        }
        return Response.json({ ok: true, results });
      },
    },
  },
});
