import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({ redirect: z.string().optional() });

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(6, "Phone is required").max(30),
  password: z.string().min(8, "Minimum 8 characters").max(72),
  age: z.string().optional(),
});

export const Route = createFileRoute("/signup")({
  validateSearch: searchSchema,
  head: () => ({ 
    meta: [
      { title: "Create account — Eshaal's Gulkari" }, 
      { name: "robots", content: "noindex" }
    ],
    links: [{ rel: "canonical", href: "/signup" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const search = useSearch({ from: "/signup" });
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", age: "" });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: { name: form.name, phone: form.phone, age: form.age || null },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created");
    navigate({ to: (search.redirect as any) || "/account" });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <div className="w-full">
        <div className="stitch-border rounded-lg bg-card p-6 md:p-8">
          <h1 className="text-center font-serif text-3xl text-primary">Create your account</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">So we can send you order updates.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {(["name", "phone", "email", "password", "age"] as const).map((k) => (
              <label key={k} className="block text-sm">
                <span className="mb-1 block capitalize text-foreground/80">
                  {k === "age" ? "Age (optional)" : k === "name" ? "Full name" : k}
                </span>
                <input
                  type={k === "password" ? "password" : k === "email" ? "email" : k === "age" ? "number" : "text"}
                  required={k !== "age"}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="touch-min w-full rounded-md border border-input bg-background px-3"
                />
                {errors[k] && <span className="mt-1 block text-xs text-destructive">{errors[k]}</span>}
              </label>
            ))}
            <button disabled={busy} className="touch-min w-full rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-60">
              {busy ? "Creating…" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have one?{" "}
            <Link to="/login" search={{ redirect: search.redirect }} className="text-primary underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}