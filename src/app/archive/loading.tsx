import { ArchiveTableSkeleton } from "@/components/skeletons";

export default function ArchiveLoading() {
  return (
    <div className="min-h-screen w-full max-w-5xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-300">
      <div className="space-y-3 text-center">
        <div className="h-10 w-64 mx-auto shimmer-container rounded-2xl bg-muted/60" />
        <div className="h-4 w-96 mx-auto shimmer-container rounded-lg bg-muted/40" />
      </div>

      <ArchiveTableSkeleton />
    </div>
  );
}
