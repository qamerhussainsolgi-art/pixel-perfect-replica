import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Scissors, ClipboardList, Send, Upload } from "lucide-react";

export const Route = createFileRoute("/custom-orders")({
  head: () => ({
    meta: [
      { title: "Custom Embroidery Orders | Eshaal's Gulkari" },
      { name: "description", content: "Submit a request for bespoke hand embroidery. Select your desired fabrics, patterns, and style designed exactly to your measurements." },
      { property: "og:title", content: "Custom Embroidery Orders | Eshaal's Gulkari" },
      { property: "og:description", content: "Submit a request for bespoke hand embroidery. Select your desired fabrics, patterns, and style designed exactly to your measurements." },
      { property: "og:url", content: "https://eshaalsgulkari.com/custom-orders" },
      { property: "og:image", content: "https://eshaalsgulkari.com/images/craft-story.jpg" },
    ],
    links: [{ rel: "canonical", href: "/custom-orders" }],
  }),
  component: CustomOrdersPage,
});

function CustomOrdersPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    garmentType: "",
    fabricPreference: "",
    budgetRange: "",
    details: "",
  });
  const [referenceUrl, setReferenceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image format (JPG, PNG, or WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Uploading reference image...");
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `references/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("custom-order-references")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("custom-order-references")
        .getPublicUrl(filePath);

      setReferenceUrl(publicUrlData.publicUrl);
      toast.success("Reference image uploaded successfully.", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload file.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim() || !form.garmentType) {
      toast.error("Please fill in your name, contact phone, and selection type.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("custom_order_requests").insert([
        {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          garment_type: form.garmentType,
          fabric_preference: form.fabricPreference.trim() || null,
          budget_range: form.budgetRange,
          reference_image_url: referenceUrl || null,
          details: form.details.trim() || null,
        },
      ]);

      if (error) throw error;

      toast.success("Bespoke custom order request submitted. Our team will contact you shortly.");
      setForm({
        name: "",
        phone: "",
        email: "",
        garmentType: "",
        fabricPreference: "",
        budgetRange: "",
        details: "",
      });
      setReferenceUrl("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-8 md:py-14">
      <section className="relative overflow-hidden text-center py-10 md:py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Exclusive Studio Service</p>
        <h1 className="mt-4 font-serif text-4xl leading-[1.1] text-primary md:text-6xl">
          Custom Embroidery,
          <br />
          <span className="italic text-accent">Made for You</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-foreground/85 md:text-lg">
          Collaborate closely with Tazeen Faisal Khan and our team of heritage artisans to design an entirely unique, handcrafted suit or shawl.
        </p>
      </section>

      <hr className="stitch-divider my-8" />

      <section className="py-8 md:py-12">
        <h2 className="text-center font-serif text-3xl text-primary mb-10">Bespoke Process</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="stitch-border p-6 text-center bg-secondary/10">
            <ClipboardList className="mx-auto h-8 w-8 text-accent mb-4" />
            <h3 className="font-serif text-xl text-primary mb-2">1. Request Consult</h3>
            <p className="text-sm text-muted-foreground">
              Provide your details, ideal fabric preferences, budget targets, and design requirements below.
            </p>
          </div>
          <div className="stitch-border p-6 text-center bg-secondary/10">
            <Scissors className="mx-auto h-8 w-8 text-accent mb-4" />
            <h3 className="font-serif text-xl text-primary mb-2">2. Design & Sketch</h3>
            <p className="text-sm text-muted-foreground">
              We discuss options over WhatsApp, mapping out embroidery layouts, colors, and sizing specifics.
            </p>
          </div>
          <div className="stitch-border p-6 text-center bg-secondary/10">
            <Sparkles className="mx-auto h-8 w-8 text-accent mb-4" />
            <h3 className="font-serif text-xl text-primary mb-2">3. Artisan Framing</h3>
            <p className="text-sm text-muted-foreground">
              Our traditional artisans stitch your custom design entirely by hand, bringing the sketch to life.
            </p>
          </div>
        </div>
      </section>

      <hr className="stitch-divider my-10" />

      <div className="grid gap-12 md:grid-cols-12 max-w-4xl mx-auto">
        <div className="md:col-span-12">
          <div className="rounded-lg border border-border bg-card p-6 md:p-8 shadow-sm">
            <h2 className="font-serif text-2xl text-primary text-center mb-2">Custom Request Form</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Submit details of your dream piece, and our studio team will contact you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground/80 mb-1">Full Name *</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="touch-min w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground/80 mb-1">Phone / WhatsApp *</label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    placeholder="e.g. +92 300 1234567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="touch-min w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-1">Email Address (Optional)</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="touch-min w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="garmentType" className="block text-sm font-medium text-foreground/80 mb-1">Garment Type *</label>
                  <select
                    id="garmentType"
                    required
                    value={form.garmentType}
                    onChange={(e) => setForm({ ...form, garmentType: e.target.value })}
                    className="touch-min w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none"
                    disabled={isSubmitting}
                  >
                    <option value="">Select type...</option>
                    <option value="lawn-suit">3-Piece Lawn Suit</option>
                    <option value="chiffon-suit">Luxury Chiffon Suit</option>
                    <option value="silk-suit">Luxury Silk Suit</option>
                    <option value="wool-shawl">Pure Wool Shawl</option>
                    <option value="linen-kurta">Casual Linen Kurta</option>
                    <option value="other">Other / Custom Accessory</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="budgetRange" className="block text-sm font-medium text-foreground/80 mb-1">Budget Range (PKR) *</label>
                  <select
                    id="budgetRange"
                    required
                    value={form.budgetRange}
                    onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}
                    className="touch-min w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none"
                    disabled={isSubmitting}
                  >
                    <option value="">Select budget...</option>
                    <option value="15k-25k">PKR 15,000 – 25,000</option>
                    <option value="25k-40k">PKR 25,000 – 40,000</option>
                    <option value="40k-60k">PKR 40,000 – 60,000</option>
                    <option value="60k+">PKR 60,000 +</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="fabricPreference" className="block text-sm font-medium text-foreground/80 mb-1">Fabric Preference</label>
                <input
                  id="fabricPreference"
                  type="text"
                  placeholder="e.g. Pure Irish Linen, Cotton Net, Chinese Silk"
                  value={form.fabricPreference}
                  onChange={(e) => setForm({ ...form, fabricPreference: e.target.value })}
                  className="touch-min w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Reference Image (Optional)</label>
                <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-lavender/40 rounded bg-background/50">
                  {referenceUrl ? (
                    <div className="text-center">
                      <p className="text-xs text-accent font-semibold mb-2">Image attached successfully</p>
                      <img src={referenceUrl} alt="Bespoke Reference Preview" className="h-28 w-24 object-cover rounded mx-auto border border-border" />
                      <button
                        type="button"
                        onClick={() => setReferenceUrl("")}
                        className="mt-2 text-xs text-destructive hover:underline block mx-auto border-0 bg-transparent cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full cursor-pointer">
                      <Upload className="h-6 w-6 text-accent mb-2" />
                      <span className="text-xs text-muted-foreground">{isUploading ? "Uploading..." : "Click to select JPG, PNG, or WEBP (Max 5MB)"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={isUploading || isSubmitting}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="details" className="block text-sm font-medium text-foreground/80 mb-1">Styling Details & Measurements</label>
                <textarea
                  id="details"
                  rows={4}
                  placeholder="Tell us about your desired color combination, pattern spacing, necklines, sleeves, or exact sizing parameters..."
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  className="w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="inline-flex touch-min w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95 disabled:pointer-events-none disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Submitting Request..." : "Submit Custom Order"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
