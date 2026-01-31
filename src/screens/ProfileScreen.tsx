import { useState } from 'react';
import { EcoScoreBar } from '@/components/EcoScoreBadge';
import { BadgeDisplay } from '@/components/BadgeDisplay';
import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { useAuth } from '@/contexts/AuthContext';
import {
  Settings,
  Flame,
  Gift,
  ChevronRight,
  TrendingUp,
  Check,
  ArrowLeft,
  LogOut,
  Copy
} from 'lucide-react';

export function ProfileScreen() {
  const { userData, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Use real user data or fallback
  const user = userData || {
    username: 'guest',
    displayName: 'Guest User',
    pointsBalance: 0,
    ecoScore: 50,
    streakCount: 0,
    badges: [],
    friendCode: 'ECO-XXXX-XXXX',
  };

  const handleCopyFriendCode = () => {
    navigator.clipboard.writeText(user.friendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Settings modal
  if (showSettings) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-lg">settings</h1>
          </div>
        </header>

        <div className="p-4 space-y-4">
          {/* Account section */}
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground px-1">account</h2>
            
            <div className="p-4 rounded-2xl bg-card space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">email</span>
                <span className="text-sm font-medium">{userData?.email || 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">username</span>
                <span className="text-sm font-medium">{user.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">friend code</span>
                <button 
                  onClick={handleCopyFriendCode}
                  className="flex items-center gap-2 text-sm font-medium text-primary"
                >
                  {user.friendCode}
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Sign out */}
          <Button 
            variant="destructive" 
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">profile</h1>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* user card */}
        <section className="p-6 rounded-3xl gradient-nature text-white relative overflow-hidden">
          {/* background decoration */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-5 -left-5 w-20 h-20 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.displayName || user.username}</h2>
                <p className="text-sm opacity-80">@{user.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm">{user.streakCount} day streak</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-3 rounded-xl bg-white/10">
                <p className="text-sm opacity-80">points</p>
                <p className="text-2xl font-bold">{user.pointsBalance.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10">
                <p className="text-sm opacity-80">eco score</p>
                <p className="text-2xl font-bold">{user.ecoScore}</p>
              </div>
            </div>
          </div>
        </section>

        {/* quick actions */}
        <div className="grid grid-cols-1 gap-3">
          <Button variant="secondary" className="justify-start">
            <Gift className="w-4 h-4 mr-2" />
            share progress
          </Button>
        </div>

        {/* eco score trend */}
        <section className="p-4 rounded-2xl bg-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              your eco score trend
            </h3>
          </div>
          <EcoScoreBar score={user.ecoScore} />
          <p className="text-sm text-muted-foreground mt-2">
            keep scanning and swapping to improve your score!
          </p>
        </section>

        {/* badges */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">badges earned</h3>
            <button className="text-sm text-primary font-medium flex items-center gap-1">
              see all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {user.badges && user.badges.length > 0 ? (
            <div className="grid grid-cols-4 gap-4">
              {user.badges.slice(0, 4).map((badge) => (
                <BadgeDisplay 
                  key={badge.badgeId} 
                  badge={{
                    id: badge.badgeId,
                    name: badge.name,
                    description: badge.description || '',
                    icon: badge.icon || '🏆',
                    earnedAt: new Date(badge.earnedAt),
                    category: badge.category as any,
                  }} 
                  size="md" 
                  showDetails 
                />
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-card text-center">
              <Mascot size="md" mood="thinking" />
              <p className="mt-4 text-muted-foreground">
                no badges yet. start scanning and swapping to earn badges!
              </p>
            </div>
          )}
        </section>

        {/* friend code */}
        <section className="p-4 rounded-2xl bg-card">
          <h3 className="font-semibold mb-2">your friend code</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 bg-muted rounded-xl font-mono text-sm">
              {user.friendCode}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyFriendCode}
              className="shrink-0"
            >
              {copiedCode ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            share this code with friends to add each other
          </p>
        </section>
      </div>
    </div>
  );
}
