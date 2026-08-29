import { Skeleton } from "@/components/ui/skeleton";

export function HeroWordCardSkeleton() {
  return (
    <div className="w-full glass-panel rounded-[2.5rem] p-6 md:p-10 border border-emerald-500/20 bg-card/75 shadow-2xl relative overflow-hidden space-y-6 animate-in fade-in duration-300">
      {/* Top Gradient bar placeholder */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500/30 via-primary/30 to-secondary/30" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between pb-6 border-b border-border/40 gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-12 w-3/5 rounded-2xl" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-4 w-10 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>

      {/* Definition Sense 1 */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-8 rounded-md" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <Skeleton className="h-5 w-full rounded-lg" />
        <Skeleton className="h-5 w-4/5 rounded-lg" />

        {/* Examples */}
        <div className="space-y-2 pt-3 pl-4 border-l-2 border-primary/20">
          <Skeleton className="h-4 w-3/4 rounded-md italic" />
          <Skeleton className="h-4 w-2/3 rounded-md italic" />
        </div>
      </div>

      {/* Definition Sense 2 */}
      <div className="space-y-3 pt-4 border-t border-border/30">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-8 rounded-md" />
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
        <Skeleton className="h-5 w-11/12 rounded-lg" />
        <div className="space-y-2 pt-2 pl-4 border-l-2 border-border/30">
          <Skeleton className="h-4 w-4/5 rounded-md italic" />
        </div>
      </div>
    </div>
  );
}

export function VariationCardSkeleton() {
  return (
    <div className="w-full glass-panel rounded-3xl p-6 md:p-8 border border-border/50 bg-card/75 shadow-xl relative overflow-hidden space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/30 gap-3">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-8 w-2/5 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
      </div>

      <div className="pt-2 pl-4 border-l-2 border-border/30 space-y-1.5">
        <Skeleton className="h-3.5 w-3/4 rounded-md italic" />
      </div>
    </div>
  );
}

export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4 w-full">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-panel rounded-2xl p-4 flex flex-col items-center text-center shadow-lg space-y-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-7 w-14 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function ArchiveTableSkeleton() {
  return (
    <div className="w-full glass-panel rounded-3xl p-6 border border-border/50 bg-card/75 shadow-2xl space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-border/30">
        <Skeleton className="h-7 w-48 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 rounded-2xl bg-muted/20 border border-border/30 flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-28 rounded-md font-bold" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-4/5 rounded-md" />
            </div>
            <Skeleton className="h-8 w-16 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SubmissionsListSkeleton() {
  return (
    <div className="space-y-4 w-full">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-panel rounded-3xl p-6 border border-border/50 bg-card/75 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-32 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <div className="flex items-center justify-between pt-2 border-t border-border/20">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeOverviewSkeleton() {
  return (
    <div className="flex flex-col w-full mt-4 md:mt-8 space-y-8 animate-in fade-in duration-300">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        {/* Word of the Day Skeleton */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
          <div className="w-full glass-panel rounded-3xl p-6 md:p-8 border border-border/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-44 rounded-xl" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-5 w-full rounded-lg" />
            <Skeleton className="h-5 w-4/5 rounded-lg" />
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/30">
              <Skeleton className="h-4 w-3/4 rounded-md" />
            </div>
          </div>
        </section>

        {/* Community Words Grid Skeleton */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          <div className="flex items-center gap-2 overflow-hidden py-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-panel p-5 rounded-2xl border border-border/40 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-28 rounded-lg" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function DesktopSidebarSkeleton() {
  return (
    <aside className="hidden xl:block absolute top-4 right-4 2xl:right-8 z-50 w-64 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 justify-end">
        <Skeleton className="h-3 w-20 rounded-md" />
        <Skeleton className="w-4 h-4 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-panel rounded-2xl p-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
            <Skeleton className="h-7 w-12 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="glass-panel rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/30">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-3 w-8 rounded-md" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-1">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="w-7 h-7 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-2 w-12 rounded-md" />
            </div>
            <Skeleton className="h-4 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </aside>
  );
}
