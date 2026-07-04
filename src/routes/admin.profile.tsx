import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/profile")({ component: ProfilePage });

function ProfilePage() {
  const { admin } = useAdmin();
  if (!admin) return null;
  return (
    <div>
      <h1 className="font-serif text-3xl text-primary md:text-4xl">My profile</h1>
      <hr className="stitch-divider my-6" />
      <div className="stitch-border max-w-md rounded-lg bg-card p-6">
        <p className="text-xs uppercase tracking-wider text-accent">{admin.role}</p>
        <p className="mt-2 font-serif text-2xl text-primary">{admin.name}</p>
        <p className="mt-2 text-sm"><span className="text-muted-foreground">Email:</span> {admin.email}</p>
        <p className="text-sm"><span className="text-muted-foreground">Phone:</span> {admin.phone}</p>
        <p className="mt-4 text-xs text-muted-foreground">To change these details, ask a developer admin to update the admin_users record.</p>
      </div>
    </div>
  );
}
