import { SubmissionsListSkeleton } from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen w-full max-w-4xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 shimmer-container rounded-xl bg-muted/60" />
          <div className="h-4 w-64 shimmer-container rounded-md bg-muted/40" />
        </div>
        <div className="h-10 w-36 shimmer-container rounded-full bg-primary/20" />
      </div>

      <SubmissionsListSkeleton />
    </div>
  );
}
