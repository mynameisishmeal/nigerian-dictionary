import { HeroWordCardSkeleton, StatsGridSkeleton } from "@/components/skeletons";

export default function GlobalLoading() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="w-full max-w-xl mx-auto space-y-4 text-center">
        <div className="h-10 w-3/4 mx-auto shimmer-container rounded-2xl bg-muted/60" />
        <div className="h-4 w-1/2 mx-auto shimmer-container rounded-lg bg-muted/40" />
      </div>

      <div className="w-full max-w-2xl">
        <StatsGridSkeleton />
      </div>

      <div className="w-full max-w-3xl">
        <HeroWordCardSkeleton />
      </div>
    </main>
  );
}
