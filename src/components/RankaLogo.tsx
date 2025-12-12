import React from 'react';
import { cn } from '@/lib/utils';

interface RankaLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'gold';
  showTagline?: boolean;
}

export const RankaLogo: React.FC<RankaLogoProps> = ({ 
  className, 
  variant = 'gold',
  showTagline = false 
}) => {
  const textColor = {
    light: 'text-foreground',
    dark: 'text-background',
    gold: 'gold-text',
  }[variant];

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative">
        {/* Diamond Icon */}
        <div className={cn(
          "w-8 h-8 rotate-45 border-2 flex items-center justify-center mb-2",
          variant === 'gold' ? 'border-primary' : variant === 'light' ? 'border-foreground' : 'border-background'
        )}>
          <div className={cn(
            "w-4 h-4 rotate-0",
            variant === 'gold' ? 'bg-primary' : variant === 'light' ? 'bg-foreground' : 'bg-background'
          )} />
        </div>
      </div>
      <h1 className={cn(
        'font-display text-2xl font-bold tracking-wider',
        textColor
      )}>
        RANKA
      </h1>
      <span className={cn(
        'text-xs tracking-[0.3em] uppercase',
        variant === 'gold' ? 'text-primary' : 'text-muted-foreground'
      )}>
        Jewellers
      </span>
      {showTagline && (
        <p className="text-xs text-muted-foreground mt-2 tracking-wide">
          Est. 1881 • Legacy of Trust
        </p>
      )}
    </div>
  );
};
