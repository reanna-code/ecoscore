import { cn } from '@/lib/utils';
import { Badge } from '@/types/ecoscore';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export function BadgeDisplay({ badge, size = 'md', showDetails = false, className }: BadgeDisplayProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
  };

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          'rounded-full bg-secondary flex items-center justify-center shadow-soft',
          sizeClasses[size]
        )}
      >
        {badge.icon}
      </div>
      {showDetails && (
        <>
          <span className="text-xs font-medium text-foreground text-center">{badge.name}</span>
          <span className="text-xs text-muted-foreground text-center max-w-[100px]">{badge.description}</span>
        </>
      )}
    </div>
  );
}

interface BadgeRowProps {
  badges: Badge[];
  maxVisible?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function BadgeRow({ badges, maxVisible = 4, size = 'sm', className }: BadgeRowProps) {
  const visible = badges.slice(0, maxVisible);
  const remaining = badges.length - maxVisible;

  return (
    <div className={cn('flex items-center -space-x-1.5', className)}>
      {visible.map((badge) => (
        <BadgeDisplay key={badge.id} badge={badge} size={size} />
      ))}
      {remaining > 0 && (
        <div className={cn(
          'rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground',
          size === 'sm' ? 'w-8 h-8' : 'w-12 h-12'
        )}>
          +{remaining}
        </div>
      )}
    </div>
  );
}
