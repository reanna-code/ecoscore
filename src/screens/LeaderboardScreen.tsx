import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BadgeRow } from '@/components/BadgeDisplay';
import { Mascot } from '@/components/Mascot';
import { Button } from '@/components/Button';
import { mockLeaderboard, mockUser, getUserById } from '@/data/mockData';
import { UserPlus, Trophy, Crown, Medal, Award, X, Search, Check, Copy, Users } from 'lucide-react';

type TimeFrame = 'weekly' | 'alltime';

export function LeaderboardScreen() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');
  const [showAddFriends, setShowAddFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [addedFriends, setAddedFriends] = useState<string[]>([]);
  
  const hasFriends = mockUser.friendIds.length > 0;
  
  // Mock user's friend code
  const myFriendCode = 'ECO-' + mockUser.id.toUpperCase() + '-2024';

  // Get top 3 for podium and rest for list
  const topThree = mockLeaderboard.slice(0, 3);
  const restOfLeaderboard = mockLeaderboard.slice(3);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myFriendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddByCode = () => {
    if (friendCode.trim()) {
      // In real app, this would call an API
      setAddedFriends([...addedFriends, friendCode]);
      setFriendCode('');
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = topThree.length >= 3 
    ? [topThree[1], topThree[0], topThree[2]] 
    : topThree;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Add Friends Modal */}
      {showAddFriends && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-background rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold">add friends</h2>
              <button
                onClick={() => setShowAddFriends(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6 overflow-auto">
              {/* Your Friend Code */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">your friend code</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-muted rounded-xl font-mono text-sm">
                    {myFriendCode}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="shrink-0"
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  share this code with friends so they can add you
                </p>
              </div>

              {/* Add by Friend Code */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">add by friend code</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="enter friend code (e.g., ECO-ABC-2024)"
                    value={friendCode}
                    onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-3 bg-muted rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <Button onClick={handleAddByCode} disabled={!friendCode.trim()}>
                    add
                  </Button>
                </div>
              </div>

              {/* Search Users */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">search users</h3>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="search by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Search Results */}
                {searchQuery && (
                  <div className="space-y-2 mt-3">
                    {mockLeaderboard
                      .filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 5)
                      .map(user => (
                        <div
                          key={user.userId}
                          className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                        >
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{user.username}</div>
                            <div className="text-xs text-muted-foreground">
                              {user.points.toLocaleString()} pts
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={addedFriends.includes(user.userId) ? "secondary" : "default"}
                            onClick={() => {
                              if (!addedFriends.includes(user.userId)) {
                                setAddedFriends([...addedFriends, user.userId]);
                              }
                            }}
                          >
                            {addedFriends.includes(user.userId) ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                added
                              </>
                            ) : (
                              'add'
                            )}
                          </Button>
                        </div>
                      ))}
                    {mockLeaderboard.filter(u => 
                      u.username.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        no users found
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Recently Added */}
              {addedFriends.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    pending requests ({addedFriends.length})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    friend requests sent! they'll appear on your leaderboard once accepted.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border">
              <Button 
                onClick={() => setShowAddFriends(false)} 
                className="w-full"
              >
                done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            leaderboard
          </h1>
          <Button variant="ghost" size="sm" onClick={() => setShowAddFriends(true)}>
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
          <div className="space-y-6">
            {/* Podium for Top 3 */}
            <div className="relative pt-8 pb-4">
              <div className="flex items-end justify-center gap-2">
                {podiumOrder.map((entry, index) => {
                  const isFirst = entry.rank === 1;
                  const isSecond = entry.rank === 2;
                  const isThird = entry.rank === 3;
                  const isCurrentUser = entry.userId === mockUser.id;
                  
                  // Podium heights: 2nd = medium, 1st = tall, 3rd = short
                  const podiumHeight = isFirst ? 'h-28' : isSecond ? 'h-20' : 'h-14';
                  const podiumColor = isFirst 
                    ? 'bg-gradient-to-t from-yellow-500/20 to-yellow-400/40 border-yellow-500/50' 
                    : isSecond 
                    ? 'bg-gradient-to-t from-gray-400/20 to-gray-300/40 border-gray-400/50'
                    : 'bg-gradient-to-t from-amber-600/20 to-amber-500/40 border-amber-600/50';

                  return (
                    <div 
                      key={entry.userId} 
                      className="flex flex-col items-center animate-slide-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Crown for 1st place */}
                      {isFirst && (
                        <div className="mb-1 animate-bounce">
                          <Crown className="w-8 h-8 text-yellow-500 drop-shadow-lg" />
                        </div>
                      )}
                      
                      {/* Avatar */}
                      <div className={cn(
                        'relative rounded-full flex items-center justify-center text-lg font-bold shadow-lg mb-2',
                        isFirst ? 'w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                        isSecond ? 'w-14 h-14 bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                        'w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 text-white',
                        isCurrentUser && 'ring-4 ring-primary ring-offset-2 ring-offset-background'
                      )}>
                        {entry.username.charAt(0).toUpperCase()}
                        {isCurrentUser && (
                          <span className="absolute -bottom-1 -right-1 text-xs px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                            you
                          </span>
                        )}
                      </div>

                      {/* Username */}
                      <span className={cn(
                        'text-sm font-semibold mb-1 truncate max-w-[80px]',
                        isCurrentUser && 'text-primary'
                      )}>
                        {entry.username}
                      </span>

                      {/* Points */}
                      <span className="text-xs text-muted-foreground mb-2">
                        {entry.points.toLocaleString()} pts
                      </span>

                      {/* Podium */}
                      <div className={cn(
                        'w-24 rounded-t-xl border-t-2 border-x-2 flex items-start justify-center pt-2',
                        podiumHeight,
                        podiumColor
                      )}>
                        <span className={cn(
                          'text-2xl font-black',
                          isFirst ? 'text-yellow-500' : isSecond ? 'text-gray-400' : 'text-amber-600'
                        )}>
                          {entry.rank}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rest of leaderboard */}
            {restOfLeaderboard.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground px-1">
                  rankings
                </h3>
                {restOfLeaderboard.map((entry, i) => {
                  const isCurrentUser = entry.userId === mockUser.id;

                  return (
                    <div
                      key={entry.userId}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-2xl transition-all animate-slide-up',
                        isCurrentUser ? 'bg-primary/10 border-2 border-primary' : 'bg-card',
                      )}
                      style={{ animationDelay: `${(i + 3) * 50}ms` }}
                    >
                      {/* rank */}
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-muted-foreground">
                          {entry.rank}
                        </span>
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

                      {/* points */}
                      <div className="text-right shrink-0">
                        <div className="font-bold text-foreground">{entry.points.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">pts</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Mascot size="lg" mood="waving" />
            <h2 className="mt-6 text-lg font-semibold text-foreground">no friends yet</h2>
            <p className="mt-2 text-muted-foreground max-w-[260px]">
              invite someone so you can flex responsibly. your friends are going to hate how high you are on this leaderboard.
            </p>
            <Button className="mt-6" onClick={() => setShowAddFriends(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              add friends
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
