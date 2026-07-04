import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Mail, Truck, Send } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Eshaal's Gulkari" },
      {
        name: "description",
        content: "Get in touch with Eshaal's Gulkari. Reach out directly via WhatsApp for personal assistance or send us a message through our contact form.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await (supabase.from("contact_submissions" as any) as any).insert([
        {
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        },
      ]);

      if (error) throw error;

      toast.success("Message sent. We'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error("Failed to send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[960px] px-4 py-8 md:px-8 md:py-14">
      <header className="mb-8 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Get in touch</p>
        <h1 className="mt-3 font-serif text-3xl text-primary md:text-5xl">Contact Us</h1>
      </header>

      <hr className="stitch-divider mb-8" />

      <section className="mb-12 rounded-lg bg-primary p-6 text-center text-primary-foreground shadow-md md:p-8">
        <div className="mx-auto max-w-xl">
          <MessageCircle className="mx-auto h-10 w-10 text-accent" />
          <h2 className="mt-4 font-serif text-2xl md:text-3xl">WhatsApp Inquiries</h2>
          <p className="mt-3 text-sm leading-relaxed opacity-90 md:text-base">
            For the fastest response, customized order options, or immediate stock updates, please send us a direct message on WhatsApp.
          </p>
          <div className="mt-6">
            <a
              href="https://wa.me/923164349900"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex touch-min items-center justify-center rounded-md bg-background px-8 py-3 text-sm font-semibold tracking-wide text-primary transition-transform duration-200 hover:scale-[1.02] hover:opacity-95"
            >
              Message us on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <div className="grid gap-10 md:grid-cols-12">
        <section className="md:col-span-7">
          <h2 className="font-serif text-xl text-primary md:text-2xl">Send a message</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Alternatively, fill out the form below and we will receive your details in our system.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground/80">Full name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground/80">Email address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground/80">Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="mt-1 w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex touch-min w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95 disabled:pointer-events-none disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Sending..." : "Submit message"}
            </button>
          </form>
        </section>

        <aside className="space-y-6 md:col-span-5 md:border-l md:border-dashed md:border-lavender/60 md:pl-10">
          <div>
            <h2 className="font-serif text-xl text-primary">Details & support</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Official contact channels and general policy information for our craft boutique.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border border-border bg-card p-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Email support</p>
                <p className="mt-1 text-sm font-medium text-foreground">contact.eshaalsgulkari@gmail.com</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md border border-border bg-card p-4">
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Shipping policy</p>
                <p className="mt-1 text-sm font-medium text-foreground">Shipping across Pakistan</p>
              </div>
            </div>
          </div>

          <div className="stitch-border p-5 bg-secondary/30">
            <p className="font-serif text-sm font-semibold text-primary">Our Promise</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Every garment is designed and hand-embroidered with precision, maintaining traditional craft values. Each order is individually inspected and shipped with utmost care.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
