import { cn } from '@/lib/utils';
import { Challenge } from '@/types/ecoscore';
import { Clock, Gift } from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  className?: string;
}

export function ChallengeCard({ challenge, className }: ChallengeCardProps) {
  const progress = (challenge.currentCount / challenge.targetCount) * 100;
  const daysLeft = Math.ceil(
    (challenge.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={cn('bg-card rounded-2xl p-4 shadow-soft', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {daysLeft} days left
        </span>
        <span className="text-xs font-semibold text-primary flex items-center gap-1">
          <Gift className="w-3 h-3" />
          {challenge.rewardPoints} pts
        </span>
      </div>

      <h3 className="font-semibold text-foreground mb-1">{challenge.title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">progress</span>
          <span className="font-medium">{challenge.currentCount}/{challenge.targetCount}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
