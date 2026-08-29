'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSession } from '@/lib/auth-client';
import { MiniKeyboard } from './mini-keyboard';
import { NIGERIAN_LANGUAGES } from '@/lib/languages';

export function AddWordDialog({
  triggerClassName = "fixed bottom-8 right-8 h-20 w-20 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 text-4xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] shadow-primary/50 flex items-center justify-center font-light border border-white/20 transition-all hover:scale-110 hover:rotate-90 duration-500 z-50 cursor-pointer",
  triggerChildren = "+",
  onSuccess,
}: {
  triggerClassName?: string;
  triggerChildren?: React.ReactNode;
  onSuccess?: () => void;
} = {}) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [languageFamily, setLanguageFamily] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [customLanguage, setCustomLanguage] = useState('');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  
  const [meaningSuggestions, setMeaningSuggestions] = useState<string[]>([]);
  const [exampleSuggestions, setExampleSuggestions] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeInput, setActiveInput] = useState<'word' | 'meaning' | 'example' | 'language' | 'customLanguage'>('word');

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleGenerateAI = async () => {
    if (!word) {
      setError("Please type a word first before using AI Auto-Fill.");
      return;
    }
    
    setIsGeneratingAI(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, language: languageFamily }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate AI suggestion');
      }
      
      if (data.meanings && Array.isArray(data.meanings)) {
         setMeaningSuggestions(data.meanings);
      }
      if (data.examples && Array.isArray(data.examples)) {
         setExampleSuggestions(data.examples);
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleInsertChar = (char: string) => {
    if (activeInput === 'word') setWord(prev => prev + char);
    if (activeInput === 'meaning') setMeaning(prev => prev + char);
    if (activeInput === 'example') setExample(prev => prev + char);
    if (activeInput === 'customLanguage') setCustomLanguage(prev => prev + char);
    if (activeInput === 'language') {
      if (languageFamily) {
         setLanguageFamily('');
         setLanguageSearch(char);
      } else {
         setLanguageSearch(prev => prev + char);
      }
    }
  };
  
  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className={triggerClassName}>
        {triggerChildren}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/10 glass-panel shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-center">
            Submit Word
          </DialogTitle>
          <DialogDescription className="text-sm uppercase tracking-widest font-semibold text-muted-foreground mt-3 text-center">
            Contribute to the registry. Your submission will be voted on by the community.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm font-semibold p-4 border border-destructive/30 rounded-lg uppercase tracking-wider">
            {error}
          </div>
        )}

        <form className="space-y-6 pt-6" onSubmit={async (e) => { 
          e.preventDefault(); 
          setIsSubmitting(true);
          setError(null);
          
          try {
            const isOther = languageFamily === 'Other' || languageSearch.toLowerCase() === 'other';
            const finalOrigin = isOther ? customLanguage : languageFamily;
            
            const res = await fetch('/api/words', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ word, meaning, origin: finalOrigin, example }),
            });
            
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || 'Failed to submit word');
            }
            
            setIsOpen(false);
            setWord('');
            setMeaning('');
            setExample('');
            setLanguageFamily('');
            setCustomLanguage('');
            setMeaningSuggestions([]);
            setExampleSuggestions([]);
            
            if (onSuccess) {
              onSuccess();
            } else {
              window.location.reload();
            }
          } catch (err: any) {
            setError(err.message);
          } finally {
            setIsSubmitting(false);
          }
        }}>
          
          {/* Global Mini Keyboard for the active input */}
          <div className="mb-4">
             <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                Quick Special Characters
             </label>
             <MiniKeyboard onInsert={handleInsertChar} />
          </div>

          <div className="space-y-3 group/input">
            <label htmlFor="language" className="text-sm font-bold uppercase tracking-widest text-primary/80 group-focus-within/input:text-primary transition-colors pl-2 block">
              Language / Category
            </label>
            <div className="relative">
              <Input
                id="language"
                value={languageFamily || languageSearch}
                onChange={(e) => {
                  setLanguageFamily('');
                  setLanguageSearch(e.target.value);
                  setIsLanguageDropdownOpen(true);
                }}
                onFocus={() => {
                  setIsLanguageDropdownOpen(true);
                  setActiveInput('language');
                }}
                onBlur={() => setTimeout(() => setIsLanguageDropdownOpen(false), 200)}
                placeholder="Search for a language..."
                className="rounded-2xl border border-white/5 focus-visible:ring-2 focus-visible:ring-primary/50 font-bold text-lg h-14 bg-muted/20 backdrop-blur-sm px-6 shadow-inner transition-all hover:bg-muted/30"
                required={!languageFamily}
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-muted-foreground">
                🔍
              </div>
              
              {isLanguageDropdownOpen && (
                <ul className="absolute z-50 w-full max-h-64 overflow-auto bg-card border border-white/10 rounded-2xl mt-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] p-2 backdrop-blur-xl">
                  {NIGERIAN_LANGUAGES.filter(lang => 
                    lang.toLowerCase().includes(languageSearch.toLowerCase())
                  ).map(lang => (
                    <li
                      key={lang}
                      onClick={() => {
                        setLanguageFamily(lang);
                        setLanguageSearch('');
                        setIsLanguageDropdownOpen(false);
                      }}
                      className="px-4 py-3 hover:bg-primary/20 hover:text-primary cursor-pointer rounded-xl text-foreground text-sm font-bold tracking-wide transition-colors"
                    >
                      {lang}
                    </li>
                  ))}
                  {NIGERIAN_LANGUAGES.filter(lang => 
                    lang.toLowerCase().includes(languageSearch.toLowerCase())
                  ).length === 0 && (
                    <li className="px-4 py-3 text-muted-foreground text-sm font-semibold">No languages found.</li>
                  )}
                  <div className="h-px bg-white/10 my-1 mx-2" />
                  <li
                    onClick={() => {
                      setLanguageFamily('Other');
                      setLanguageSearch('');
                      setIsLanguageDropdownOpen(false);
                    }}
                    className="px-4 py-3 hover:bg-primary/20 hover:text-primary cursor-pointer rounded-xl text-foreground text-sm font-bold tracking-wide transition-colors"
                  >
                    Other (Specify in definition)
                  </li>
                </ul>
              )}
            </div>
          </div>
          
          {(languageFamily === 'Other' || languageSearch.toLowerCase() === 'other') && (
            <div className="space-y-3 group/input animate-in fade-in slide-in-from-top-2 duration-300">
              <label htmlFor="customLanguage" className="text-sm font-bold uppercase tracking-widest text-primary/80 group-focus-within/input:text-primary transition-colors pl-2 block">
                Specify Language
              </label>
              <Input
                id="customLanguage"
                value={customLanguage}
                onChange={(e) => setCustomLanguage(e.target.value)}
                onFocus={() => setActiveInput('customLanguage')}
                placeholder="e.g. Igala"
                className="rounded-2xl border border-white/5 focus-visible:ring-2 focus-visible:ring-primary/50 font-bold text-lg h-14 bg-muted/20 backdrop-blur-sm px-6 shadow-inner transition-all hover:bg-muted/30"
                required
              />
            </div>
          )}

          <div className="space-y-3 group/input">
            <div className="flex justify-between items-center pl-2">
              <label htmlFor="word" className="text-sm font-bold uppercase tracking-widest text-primary/80 group-focus-within/input:text-primary transition-colors">
                Word / Phrase
              </label>
              {word && (
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI}
                  className="text-xs flex items-center gap-1.5 bg-primary/20 text-primary hover:bg-primary/30 px-3 py-1 rounded-full font-black tracking-widest transition-all hover:scale-105 active:scale-95 animate-pulse"
                >
                  ✨ {isGeneratingAI ? 'Generating...' : 'Auto-Fill with AI'}
                </button>
              )}
            </div>
            <div className="relative">
              <Input 
                id="word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onFocus={() => setActiveInput('word')}
                placeholder="e.g. Wahala"
                className="rounded-2xl border border-white/5 focus-visible:ring-2 focus-visible:ring-primary/50 uppercase font-bold text-xl h-16 bg-muted/20 backdrop-blur-sm px-6 shadow-inner transition-all hover:bg-muted/30"
                required
              />
            </div>
          </div>

          <div className="space-y-3 group/input">
            <label htmlFor="meaning" className="text-sm font-bold uppercase tracking-widest text-primary/80 group-focus-within/input:text-primary transition-colors pl-2">
              Primary Meaning
            </label>
            <Input 
              id="meaning"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              onFocus={() => setActiveInput('meaning')}
              placeholder="e.g. Trouble or problem"
              className="rounded-2xl border border-white/5 focus-visible:ring-2 focus-visible:ring-primary/50 uppercase font-bold text-lg h-14 bg-muted/20 backdrop-blur-sm px-6 shadow-inner transition-all hover:bg-muted/30"
              required
            />
            {meaningSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {meaningSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMeaning(suggestion);
                      setActiveInput('meaning');
                    }}
                    className="text-left text-xs bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-xl transition-colors border border-primary/20 shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 group/input">
            <label htmlFor="example" className="text-sm font-bold uppercase tracking-widest text-primary/80 group-focus-within/input:text-primary transition-colors pl-2">
              Example Sentence (Optional)
            </label>
            <Input 
              id="example"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              onFocus={() => setActiveInput('example')}
              placeholder="e.g. No find my wahala today."
              className="rounded-2xl border border-white/5 focus-visible:ring-2 focus-visible:ring-primary/50 uppercase font-bold text-lg h-14 bg-muted/20 backdrop-blur-sm px-6 shadow-inner transition-all hover:bg-muted/30"
            />
            {exampleSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {exampleSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setExample(suggestion);
                      setActiveInput('example');
                    }}
                    className="text-left text-xs bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-xl transition-colors border border-primary/20 shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full rounded-2xl h-16 mt-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 font-black uppercase tracking-widest text-lg disabled:opacity-50 transition-all hover:scale-[1.02] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] shadow-primary/40 active:scale-95">
            {isSubmitting ? "Submitting..." : "Submit Entry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
