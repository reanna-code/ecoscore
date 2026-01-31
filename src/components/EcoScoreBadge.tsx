import { cn } from '@/lib/utils';
import { getEcoScoreLevel, EcoScoreLevel } from '@/types/ecoscore';

interface EcoScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function EcoScoreBadge({ score, size = 'md', showLabel = false, className }: EcoScoreBadgeProps) {
  const level = getEcoScoreLevel(score);

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-lg',
    lg: 'w-20 h-20 text-2xl',
  };

  const bgClasses: Record<EcoScoreLevel, string> = {
    excellent: 'bg-eco-excellent',
    good: 'bg-eco-good',
    moderate: 'bg-eco-moderate',
    poor: 'bg-eco-poor',
    bad: 'bg-eco-bad',
  };

  const ringClasses: Record<EcoScoreLevel, string> = {
    excellent: 'ring-eco-excellent/30',
    good: 'ring-eco-good/30',
    moderate: 'ring-eco-moderate/30',
    poor: 'ring-eco-poor/30',
    bad: 'ring-eco-bad/30',
  };

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold text-white ring-4',
          sizeClasses[size],
          bgClasses[level],
          ringClasses[level]
        )}
      >
        {score}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground capitalize">{level}</span>
      )}
    </div>
  );
}

interface EcoScoreBarProps {
  score: number;
  className?: string;
}

export function EcoScoreBar({ score, className }: EcoScoreBarProps) {
  const level = getEcoScoreLevel(score);

  const bgClasses: Record<EcoScoreLevel, string> = {
    excellent: 'bg-eco-excellent',
    good: 'bg-eco-good',
    moderate: 'bg-eco-moderate',
    poor: 'bg-eco-poor',
    bad: 'bg-eco-bad',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">eco score</span>
        <span className={cn('text-sm font-bold', `text-${bgClasses[level].replace('bg-', '')}`)}>{score}/100</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', bgClasses[level])}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
