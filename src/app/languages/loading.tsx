import { Skeleton } from "@/components/ui/skeleton";

export default function LanguagesLoading() {
  return (
    <div className="min-h-screen w-full max-w-6xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-300">
      <div className="text-center space-y-3">
        <Skeleton className="h-10 w-72 mx-auto rounded-2xl" />
        <Skeleton className="h-4 w-96 mx-auto rounded-lg" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="glass-panel p-4 rounded-2xl border border-border/40 space-y-2">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-3 w-12 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
