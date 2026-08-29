import { StatsGridSkeleton, ArchiveTableSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto px-4 py-10 space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-6 border-b border-border/40">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>

      <StatsGridSkeleton />

      <ArchiveTableSkeleton />
    </div>
  );
}
