import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — Eshaal's Gulkari" }, { name: "robots", content: "noindex" }] }),
  component: LoginPage,
});

function LoginPage() {
  const search = useSearch({ from: "/login" });
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("Login error:", error);
        setBusy(false);
        const msg = typeof error.message === "string" && error.message.trim() && error.message.trim() !== "{}"
          ? error.message
          : "Sign in failed. Please check your credentials and try again.";
        toast.error(msg);
        return;
      }
      console.log("Login success:", data.user?.email);
      const { data: isAdmin, error: rpcErr } = await supabase.rpc("current_is_admin", {});
      if (rpcErr) console.error("current_is_admin RPC error:", rpcErr);
      setBusy(false);
      toast.success("Welcome back");
      if (isAdmin) {
        navigate({ to: "/admin/dashboard" });
      } else {
        navigate({ to: (search.redirect as any) || "/account" });
      }
    } catch (err: any) {
      console.error("Login exception:", err);
      setBusy(false);
      toast.error(err?.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <div className="w-full">
        <div className="stitch-border rounded-lg bg-card p-6 md:p-8">
          <h1 className="text-center font-serif text-3xl text-primary">Welcome back</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">Sign in to continue.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-foreground/80">Email</span>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="touch-min w-full rounded-md border border-input bg-background px-3" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-foreground/80">Password</span>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="touch-min w-full rounded-md border border-input bg-background px-3" />
            </label>
            <button disabled={busy} className="touch-min w-full rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-60">
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/signup" search={{ redirect: search.redirect }} className="text-primary underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
