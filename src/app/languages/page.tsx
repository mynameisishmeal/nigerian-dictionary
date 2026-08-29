import Link from 'next/link';
import prisma from '@/lib/prisma';
import { NIGERIAN_LANGUAGES } from '@/lib/languages';

export const dynamic = 'force-dynamic';

export default async function LanguagesPage() {
  const countMap = new Map<string, number>();
  let dbCounts: any[] = [];

  try {
    dbCounts = await prisma.$queryRawUnsafe(`
      SELECT "languageFamily", COUNT("id")::int as count
      FROM "word"
      WHERE "languageFamily" IS NOT NULL
      GROUP BY "languageFamily"
      ORDER BY count DESC
    `);

    dbCounts.forEach((item) => {
      if (item.languageFamily) {
        countMap.set(item.languageFamily.toLowerCase(), Number(item.count));
      }
    });
  } catch (err) {
    console.warn('[LANGUAGES PAGE] DB connection pool fallback triggered:', err);
  }

  // Top featured languages list
  const featured = [
    'Nigerian Pidgin',
    'Yoruba',
    'Hausa',
    'Igbo',
    'Edo',
    'Efik',
    'Ibibio',
    'Tiv',
    'Kanuri',
    'Urhobo',
    'Fulfulde',
    'Nupe',
    'Ijaw',
    'Ebira',
    'Itsekiri',
    'Isoko',
  ];

  // Merge database counts with languages
  const languageList = featured.map((name) => ({
    name,
    count: countMap.get(name.toLowerCase()) || 0,
  }));

  // Also include any other languages present in DB that weren't in featured list
  dbCounts.forEach((item) => {
    if (item.languageFamily && !featured.some((f) => f.toLowerCase() === item.languageFamily.toLowerCase())) {
      languageList.push({
        name: item.languageFamily,
        count: Number(item.count),
      });
    }
  });

  // Sort by count descending, then name ascending
  languageList.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="w-full text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground relative overflow-hidden">
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-sm pb-2">
            Languages
          </h1>
          <p className="text-base md:text-lg font-medium tracking-widest text-muted-foreground max-w-2xl mx-auto">
            EXPLORE THE DIVERSE LINGUISTIC HERITAGE OF NIGERIA.
          </p>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300 fill-mode-both">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {languageList.map((lang, idx) => (
              <Link href={`/archive?lang=${encodeURIComponent(lang.name)}`} key={lang.name}>
                <div 
                  className="glass-panel p-6 rounded-[1.5rem] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2 group border border-white/5 flex flex-col justify-between h-full min-h-[160px]"
                  style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                >
                  <h3 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-secondary transition-all">
                    {lang.name}
                  </h3>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Words
                    </span>
                    <span className={`text-lg font-black ${lang.count > 0 ? 'text-primary' : 'text-muted-foreground/40'}`}>
                      {lang.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

