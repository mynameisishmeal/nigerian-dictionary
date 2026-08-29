import { ThumbsUp, ThumbsDown } from 'lucide-react';

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval === 1 ? "1 year ago" : `${interval} years ago`;
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval === 1 ? "1 month ago" : `${interval} months ago`;
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval === 1 ? "1 day ago" : `${interval} days ago`;
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval === 1 ? "1 hour ago" : `${interval} hours ago`;
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval === 1 ? "1 minute ago" : `${interval} minutes ago`;
  
  return "just now";
}

type ActivityProps = {
  definitions: {
    id: string;
    meaning: string;
    example: string | null;
    netScore: number;
    createdAt: Date;
    word: {
      displayTerm: string;
    };
  }[];
};

export function ProfileActivity({ definitions }: ActivityProps) {
  if (definitions.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-xl text-center text-muted-foreground">
        This user hasn't added any definitions yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-6">Recent Contributions</h2>
      <div className="grid gap-4">
        {definitions.map((def) => (
          <div key={def.id} className="glass-panel p-6 rounded-xl space-y-3">
            <div className="flex justify-between items-start gap-4">
              <h3 className="text-xl font-bold text-primary">
                {def.word.displayTerm}
              </h3>
              <span className="text-xs text-muted-foreground shrink-0">
                {timeAgo(new Date(def.createdAt))}
              </span>
            </div>
            
            <p className="text-lg text-foreground">{def.meaning}</p>
            
            {def.example && (
              <div className="p-3 bg-secondary/30 rounded-lg italic text-muted-foreground border border-primary/10 text-sm">
                "{def.example}"
              </div>
            )}
            
            <div className="flex items-center gap-4 pt-2">
              <div className={`font-semibold flex items-center gap-1.5 text-sm ${def.netScore > 0 ? 'text-green-500' : def.netScore < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {def.netScore > 0 ? <ThumbsUp className="w-4 h-4" /> : def.netScore < 0 ? <ThumbsDown className="w-4 h-4" /> : <ThumbsUp className="w-4 h-4" />}
                {def.netScore} points
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
