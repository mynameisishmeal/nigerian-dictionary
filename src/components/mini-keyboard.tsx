import React from 'react';
import { Button } from './ui/button';

const SPECIAL_CHARS = ['ẹ', 'ọ', 'ṣ', 'á', 'à', 'é', 'è', 'í', 'ì', 'ú', 'ù', 'ị', 'ụ', 'ñ'];

interface MiniKeyboardProps {
  onInsert: (char: string) => void;
  className?: string;
}

export function MiniKeyboard({ onInsert, className = '' }: MiniKeyboardProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {SPECIAL_CHARS.map((char) => (
        <Button
          key={char}
          type="button"
          variant="outline"
          onClick={() => onInsert(char)}
          className="h-10 w-10 p-0 text-lg font-bold border-[2px] border-border hover:border-primary hover:text-primary transition-colors rounded-none"
        >
          {char}
        </Button>
      ))}
    </div>
  );
}
