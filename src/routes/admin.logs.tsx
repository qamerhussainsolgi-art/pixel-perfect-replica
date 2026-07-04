import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/logs")({
  component: () => {
    const { admin } = useAdmin();
    if (admin?.role !== "developer") return <div className="rounded-md border border-dashed border-destructive/40 p-6 text-sm text-destructive">Developer role required.</div>;
    return (
      <div>
        <h1 className="font-serif text-3xl text-primary">Logs</h1>
        <hr className="stitch-divider my-6" />
        <div className="stitch-border rounded-lg bg-card p-6 text-sm text-muted-foreground">
          Server logs are accessible in your Lovable Cloud dashboard under Backend → Logs.
        </div>
      </div>
    );
  },
});
