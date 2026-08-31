import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { BackgroundGlow } from "@/components/background-glow";
import { ThemeProvider } from "@/components/theme-provider";
import Link from "next/link";
import NextTopLoader from 'nextjs-toploader';
import { OnboardingGuard } from '@/components/onboarding-guard';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "The Nigerian Dictionary",
  description: "By the people. For the culture.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <NextTopLoader 
            color="#008751" /* Nigeria Green */
            initialPosition={0.08}
            crawlSpeed={200}
            height={4}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 15px #008751,0 0 5px #008751"
          />
          <BackgroundGlow />
          <Navbar />
          <OnboardingGuard>
            <div className="flex-1">
              {children}
            </div>
          </OnboardingGuard>
          <footer className="fixed bottom-2 left-0 right-0 w-full z-10 pointer-events-none pb-2">
            <div className="w-full max-w-6xl mx-auto px-4 md:px-6 flex justify-between items-center text-[10px] md:text-xs font-bold tracking-widest uppercase pointer-events-auto drop-shadow-md">
              <p className="hidden sm:block text-muted-foreground font-bold">
                © {new Date().getFullYear()} <span className="text-primary font-black">The Nigerian Dictionary</span>.
              </p>
              <div className="flex items-center gap-5 mx-auto sm:mx-0 bg-card/85 backdrop-blur-xl px-4 py-1.5 rounded-full border border-border/60 shadow-md text-foreground/80">
                <Link href="/privacy" className="hover:text-primary transition-colors font-bold">Privacy</Link>
                <span className="text-border/80 text-[10px]">•</span>
                <Link href="/terms" className="hover:text-primary transition-colors font-bold">Terms</Link>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
