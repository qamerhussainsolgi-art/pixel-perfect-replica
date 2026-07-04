import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/analytics")({
  component: () => {
    const { admin } = useAdmin();
    if (admin?.role !== "developer") return <div className="rounded-md border border-dashed border-destructive/40 p-6 text-sm text-destructive">Developer role required.</div>;
    return (
      <div>
        <h1 className="font-serif text-3xl text-primary">Analytics</h1>
        <hr className="stitch-divider my-6" />
        <div className="stitch-border rounded-lg bg-card p-6 text-sm">
          <p>Add your Google Analytics 4 Measurement ID as an environment variable named <code className="rounded bg-secondary px-1">VITE_GA4_ID</code> to enable tracking.</p>
          <p className="mt-3 text-muted-foreground">Once set, GA4 automatically tracks pageviews. Order events can be sent from checkout success via <code>gtag('event', 'purchase', …)</code>.</p>
        </div>
      </div>
    );
  },
});
