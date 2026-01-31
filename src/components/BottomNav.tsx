import { cn } from '@/lib/utils';
import { Scan, Compass, Trophy, User, Heart } from 'lucide-react';

type TabId = 'scan' | 'discover' | 'leaderboard' | 'donate' | 'profile';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof Scan }[] = [
  { id: 'scan', label: 'capture', icon: Scan },
  { id: 'discover', label: 'discover', icon: Compass },
  { id: 'leaderboard', label: 'leaderboard', icon: Trophy },
  { id: 'donate', label: 'donate', icon: Heart },
  { id: 'profile', label: 'profile', icon: User },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border safe-area-pb z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-all duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'p-2 rounded-xl transition-all duration-200',
                  isActive && 'bg-primary/10'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-all duration-200',
                    isActive && 'scale-110'
                  )}
                />
              </div>
              <span className={cn(
                'text-xs mt-0.5 font-medium transition-all',
                isActive ? 'opacity-100' : 'opacity-70'
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
