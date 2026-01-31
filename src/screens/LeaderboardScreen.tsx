import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BadgeRow } from '@/components/BadgeDisplay';
import { EcoScoreBadge } from '@/components/EcoScoreBadge';
import { Mascot } from '@/components/Mascot';
import { Button } from '@/components/Button';
import { mockLeaderboard, mockUser } from '@/data/mockData';
import { UserPlus, Trophy, Crown, Medal, Award } from 'lucide-react';

type TimeFrame = 'weekly' | 'alltime';

export function LeaderboardScreen() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');
  const hasFriends = mockUser.friendIds.length > 0;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            leaderboard
          </h1>
          <Button variant="ghost" size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            add friends
          </Button>
        </div>

        {/* time frame toggle */}
        <div className="flex gap-2 p-4 pt-0">
          <button
            onClick={() => setTimeFrame('weekly')}
            className={cn(
              'flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all',
              timeFrame === 'weekly'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            this week
          </button>
          <button
            onClick={() => setTimeFrame('alltime')}
            className={cn(
              'flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all',
              timeFrame === 'alltime'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            all time
          </button>
        </div>
      </header>

      <div className="p-4">
        {hasFriends ? (
          <div className="space-y-2">
            {mockLeaderboard.map((entry, i) => {
              const isCurrentUser = entry.userId === mockUser.id;

              return (
                <div
                  key={entry.userId}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-2xl transition-all animate-slide-up',
                    isCurrentUser ? 'bg-primary/10 border-2 border-primary' : 'bg-card',
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* rank */}
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    {getRankIcon(entry.rank) || (
                      <span className="text-sm font-bold text-muted-foreground">
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* avatar */}
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg shrink-0">
                    {entry.username.charAt(0).toUpperCase()}
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-semibold truncate',
                        isCurrentUser && 'text-primary'
                      )}>
                        {entry.username}
                      </span>
                      {isCurrentUser && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                          you
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <BadgeRow badges={entry.badges} maxVisible={3} size="sm" />
                    </div>
                  </div>

                  {/* points & eco score */}
                  <div className="text-right shrink-0">
                    <div className="font-bold text-foreground">{entry.points.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">pts</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Mascot size="lg" mood="waving" />
            <h2 className="mt-6 text-lg font-semibold text-foreground">no friends yet</h2>
            <p className="mt-2 text-muted-foreground max-w-[260px]">
              invite someone so you can flex responsibly. your friends are going to hate how high you are on this leaderboard.
            </p>
            <Button className="mt-6">
              <UserPlus className="w-4 h-4 mr-2" />
              add friends
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
