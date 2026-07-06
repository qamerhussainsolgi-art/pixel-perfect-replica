import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/lib/admin-auth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Mail, Phone, Save, Edit3, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin/profile")({ component: ProfilePage });

function ProfilePage() {
  const { admin, loading } = useAdmin();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (admin) {
      setName(admin.name || "");
      setPhone(admin.phone || "");
      setEmail(admin.email || "");
    }
  }, [admin]);

  if (loading || !admin) {
    return <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4 py-10 text-sm text-muted-foreground">Loading profile details...</div>;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!admin) return;
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = { data: { name: name.trim(), phone: phone.trim() } };

      // FIX: only send email if it actually changed
      if (email.trim() !== admin.email) {
        updateData.email = email.trim();
      }

      if (password.trim()) {
        if (password.length < 8) throw new Error("Password must be at least 8 characters long.");
        updateData.password = password;
      }

      const { error: authError } = await supabase.auth.updateUser(updateData);
      if (authError) throw authError;

      const { error: tableError } = await supabase
        .from("admin_users")
        .update({ name: name.trim(), phone: phone.trim(), email: email.trim() })
        .eq("id", admin.id);
      if (tableError) throw tableError;

      toast.success("Profile details successfully updated.");
      setPassword("");
      setEditing(false);
    } catch (error: any) {
      console.error("Profile save error:", error);
      toast.error(error.message || "An error occurred while saving profile changes.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-serif text-3xl text-primary md:text-4xl">My Profile</h1>
      <hr className="stitch-divider my-6" />
      <div className="stitch-border rounded-lg bg-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs uppercase tracking-wider text-accent">{admin.role} Access</p>
          {!editing && (
            <button onClick={() => setEditing(true)} className="inline-flex touch-min items-center gap-1.5 text-xs text-primary underline font-medium cursor-pointer">
              <Edit3 className="h-3.5 w-3.5" /> Edit Profile
            </button>
          )}
        </div>

        {!editing ? (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3"><User className="h-4 w-4 text-accent" /><p><span className="text-muted-foreground">Name:</span> <strong className="text-foreground">{name}</strong></p></div>
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-accent" /><p><span className="text-muted-foreground">Email:</span> <strong className="text-foreground">{email}</strong></p></div>
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-accent" /><p><span className="text-muted-foreground">Phone:</span> <strong className="text-foreground">{phone}</strong></p></div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="touch-min w-full rounded-md border border-input bg-background px-3 text-sm" disabled={isSaving} />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="touch-min w-full rounded-md border border-input bg-background px-3 text-sm" disabled={isSaving} />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Phone Number</label>
              <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="touch-min w-full rounded-md border border-input bg-background px-3 text-sm" disabled={isSaving} />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">New Password (Optional)</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Leave blank to keep current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="touch-min w-full rounded-md border border-input bg-background px-3 pr-10 text-sm"
                  disabled={isSaving}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="pt-2 flex gap-3">
              <button type="submit" disabled={isSaving} className="inline-flex touch-min flex-1 items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50 cursor-pointer">
                <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" onClick={() => { setName(admin.name || ""); setPhone(admin.phone || ""); setEmail(admin.email || ""); setPassword(""); setEditing(false); }} disabled={isSaving} className="touch-min flex-1 rounded-md border border-input bg-background text-sm font-medium hover:bg-secondary cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}