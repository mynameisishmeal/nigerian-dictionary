import Link from 'next/link';
import prisma from '@/lib/prisma';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface ArchivePageProps {
  searchParams: Promise<{
    letter?: string;
    lang?: string;
    q?: string;
  }>;
}

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const resolvedParams = await searchParams;
  const activeLetter = (resolvedParams.letter || (resolvedParams.lang || resolvedParams.q ? '' : 'A')).toUpperCase();
  const activeLang = resolvedParams.lang || '';
  const searchQuery = resolvedParams.q || '';

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Build query filters
  const whereFilter: any = {};

  if (activeLetter) {
    whereFilter.normalizedTerm = {
      startsWith: activeLetter.toLowerCase(),
    };
  }

  if (activeLang) {
    whereFilter.languageFamily = {
      equals: activeLang,
      mode: 'insensitive',
    };
  }

  if (searchQuery) {
    whereFilter.normalizedTerm = {
      contains: searchQuery.toLowerCase().trim(),
      mode: 'insensitive',
    };
  }

  // Fetch words matching filter from live database
  const words = await prisma.word.findMany({
    where: Object.keys(whereFilter).length > 0 ? whereFilter : undefined,
    include: {
      definitions: {
        orderBy: { netScore: 'desc' },
        take: 1,
      },
    },
    orderBy: { displayTerm: 'asc' },
    take: 100,
  });

  return (
    <div className="min-h-screen text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-sm pb-2">
            The Archive
          </h1>
          <p className="text-base md:text-lg font-medium tracking-widest text-muted-foreground max-w-2xl mx-auto">
            BROWSE THE ENTIRE REGISTRY OF THE NIGERIAN DICTIONARY FROM A TO Z.
          </p>

          {activeLang && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
              Filtering by Language: {activeLang}
              <Link href="/archive" className="ml-2 underline hover:opacity-80">
                Clear
              </Link>
            </div>
          )}
        </header>

        {/* A-Z Filter Bar */}
        <div className="glass-panel rounded-3xl p-5 md:p-6 mb-12 flex flex-wrap justify-center gap-2 md:gap-3 shadow-2xl border border-white/10">
          {alphabet.map((letter) => {
            const isSelected = activeLetter === letter && !activeLang && !searchQuery;
            return (
              <Link
                key={letter}
                href={`/archive?letter=${letter}${activeLang ? `&lang=${encodeURIComponent(activeLang)}` : ''}`}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-all duration-300 hover:scale-110 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)] shadow-primary/40'
                    : 'bg-muted/30 text-foreground hover:bg-primary/20 border border-white/5'
                }`}
              >
                {letter}
              </Link>
            );
          })}
        </div>

        {/* Words List */}
        <section className="animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300 fill-mode-both">
          <div className="flex items-center gap-6 mb-8 border-b border-white/10 pb-4">
            <h2 className="text-4xl lg:text-5xl font-black text-primary uppercase tracking-tighter">
              {activeLetter || (activeLang ? activeLang.toUpperCase() : 'ALL')}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {words.length} {words.length === 1 ? 'Word' : 'Words'}
            </span>
          </div>

          {words.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {words.map((word) => (
                <Link href={`/?q=${encodeURIComponent(word.displayTerm)}`} key={word.id}>
                  <div className="glass-panel p-6 rounded-[1.5rem] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2 group border border-white/5 flex flex-col justify-between h-full min-h-[160px]">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-black uppercase tracking-tight text-foreground group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-secondary transition-all">
                          {word.displayTerm}
                        </h3>
                        {word.languageFamily && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                            {word.languageFamily}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground font-medium text-sm leading-relaxed line-clamp-3">
                        {word.definitions[0]?.meaning || 'No definition provided yet.'}
                      </p>
                    </div>
                    {word.definitions[0]?.example && (
                      <p className="text-xs text-muted-foreground/60 italic mt-3 line-clamp-1 border-l-2 border-primary/20 pl-2">
                        &quot;{word.definitions[0].example}&quot;
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center text-muted-foreground space-y-4">
              <BookOpen className="w-12 h-12 mx-auto text-primary/40" />
              <h3 className="text-xl font-bold uppercase tracking-tight text-foreground">
                No words recorded under &quot;{activeLetter || activeLang}&quot; yet
              </h3>
              <p className="text-sm font-medium tracking-wide max-w-md mx-auto">
                Be the first to contribute a definition to this section!
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs hover:bg-primary/90 transition-all hover:scale-105"
                >
                  <ArrowLeft className="w-4 h-4" /> Go to Home & Add Word
                </Link>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

