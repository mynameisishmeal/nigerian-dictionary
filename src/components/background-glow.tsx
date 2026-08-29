'use client';

import { useEffect, useState, useRef } from 'react';

export function BackgroundGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Initial position mirrors the 15% 50% starting location
    setPosition({ x: window.innerWidth * 0.15, y: window.innerHeight * 0.5 });

    const handleMouseMove = (e: MouseEvent) => {
      setIsActive(true);
      setPosition({ x: e.clientX, y: e.clientY });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsActive(false);
      }, 2000); // Revert back to gradient after 2 seconds of inactivity
    };

    const handleClick = () => {
      setIsActive(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleClick);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleClick);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isClient) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden bg-background">
      {/* STATIC ORIGINAL BACKGROUND - Visble on load/idle, fades out when mouse moves */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-out ${isActive ? 'opacity-0' : 'opacity-100'}`}
        style={{
          backgroundImage: `
            radial-gradient(circle at 0% 50%, color-mix(in oklch, var(--primary) 25%, transparent), transparent 50%),
            radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--secondary) 25%, transparent), transparent 60%),
            radial-gradient(circle at 100% 50%, color-mix(in oklch, var(--primary) 25%, transparent), transparent 50%)
          `
        }}
      />

      {/* DYNAMIC TRACKING AURORA - Invisible on load/idle, fades in when mouse moves */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in ${isActive ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Static Secondary Glow (Center) - Remains identical to the original white center wash */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--secondary) 25%, transparent), transparent 60%)`
          }}
        />

        {/* Dynamic Tracking Container */}
        <div
          className="absolute w-0 h-0 transition-transform duration-[4500ms] ease-out"
          style={{
            top: 0,
            left: 0,
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        >
          {/* Glowing Waving Flag */}
          <div
            className="absolute w-[400px] h-[250px] rounded-[60px] blur-[60px] animate-flag-wave opacity-50"
            style={{
              background: `linear-gradient(to right, 
                color-mix(in oklch, var(--primary) 100%, transparent) 0%, 
                color-mix(in oklch, var(--primary) 100%, transparent) 30%, 
                color-mix(in oklch, var(--secondary) 100%, transparent) 40%, 
                color-mix(in oklch, var(--secondary) 100%, transparent) 60%, 
                color-mix(in oklch, var(--primary) 100%, transparent) 70%, 
                color-mix(in oklch, var(--primary) 100%, transparent) 100%
              )`,
              top: '-125px',
              left: '-200px',
            }}
          />
        </div>
      </div>
    </div>
  );
}
