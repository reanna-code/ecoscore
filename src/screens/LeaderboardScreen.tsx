import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { BadgeRow } from '@/components/BadgeDisplay';
import { Mascot } from '@/components/Mascot';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import {
  getFriends,
  getFriendsLeaderboard,
  getLeaderboard,
  sendFriendRequest,
  searchUsers,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  lookupFriendCode,
} from '@/services/apiService';
import {
  UserPlus,
  Trophy,
  Crown,
  Medal,
  Award,
  X,
  Search,
  Check,
  Copy,
  Users,
  RefreshCw,
  Loader2,
  Bell,
  UserCheck,
  UserX,
} from 'lucide-react';

type TimeFrame = 'weekly' | 'alltime';
type LeaderboardView = 'friends' | 'global';

interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  pointsBalance: number;
  ecoScore: number;
  badges: Array<{ badgeId: string; name: string; icon?: string }>;
  streakCount: number;
  isCurrentUser?: boolean;
}

interface FriendRequest {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  ecoScore: number;
}

interface SearchResult {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  pointsBalance: number;
  ecoScore: number;
}

export function LeaderboardScreen() {
  const { userData: user } = useAuth();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');
  const [view, setView] = useState<LeaderboardView>('friends');
  const [showAddFriends, setShowAddFriends] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Data states
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [friendRequests, setFriendRequests] = useState<{ received: FriendRequest[]; sent: FriendRequest[] }>({ received: [], sent: [] });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [lookupResult, setLookupResult] = useState<SearchResult | null>(null);
  
  // Loading/error states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [addingFriend, setAddingFriend] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      let data;
      if (view === 'friends') {
        data = await getFriendsLeaderboard(timeFrame);
      } else {
        data = await getLeaderboard(timeFrame);
      }

      // Transform data to match our interface
      const entries: LeaderboardEntry[] = (data.leaderboard || []).map((entry: any, index: number) => ({
        id: entry.id,
        rank: entry.rank || index + 1,
        username: entry.username,
        displayName: entry.displayName,
        avatarUrl: entry.avatarUrl,
        pointsBalance: entry.pointsBalance || 0,
        ecoScore: entry.ecoScore || 50,
        badges: entry.badges || [],
        streakCount: entry.streakCount || 0,
        isCurrentUser: entry.isCurrentUser || entry.id === user?.id,
      }));

      setLeaderboard(entries);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [view, timeFrame, user]);

  // Fetch friends list
  const fetchFriends = useCallback(async () => {
    try {
      const data = await getFriends();
      setFriends((data.friends || []).map((f: any) => f.id));
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  }, []);

  // Fetch friend requests
  const fetchFriendRequests = useCallback(async () => {
    try {
      const data = await getFriendRequests();
      setFriendRequests({
        received: data.received || [],
        sent: data.sent || [],
      });
    } catch (err) {
      console.error('Failed to fetch friend requests:', err);
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    fetchLeaderboard();
    fetchFriends();
    fetchFriendRequests();

    // Poll every 10 seconds for real-time updates
    const interval = setInterval(() => {
      fetchLeaderboard(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchLeaderboard, fetchFriends, fetchFriendRequests]);

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const data = await searchUsers(searchQuery);
        setSearchResults(data.users || []);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Handle copy friend code
  const handleCopyCode = () => {
    if (user?.friendCode) {
      navigator.clipboard.writeText(user.friendCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Handle lookup by friend code
  const handleLookupCode = async () => {
    if (!friendCode.trim()) return;

    try {
      setLookupLoading(true);
      setLookupError(null);
      setLookupResult(null);
      
      const data = await lookupFriendCode(friendCode.trim());
      if (data.user) {
        setLookupResult(data.user);
      }
    } catch (err: any) {
      setLookupError(err.message || 'User not found with this code');
      setLookupResult(null);
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle add friend
  const handleAddFriend = async (userId?: string, code?: string) => {
    try {
      setAddingFriend(userId || code || 'code');
      setSuccessMessage(null);
      
      const result = await sendFriendRequest(userId, code);
      
      // Check if auto-accepted
      if (result.friend) {
        setSuccessMessage(`You are now friends with ${result.friend.username}!`);
        fetchFriends();
        fetchLeaderboard();
      } else {
        setSuccessMessage('Friend request sent!');
      }
      
      fetchFriendRequests();
      setFriendCode('');
      setLookupResult(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send friend request');
      setTimeout(() => setError(null), 3000);
    } finally {
      setAddingFriend(null);
    }
  };

  // Handle accept friend request
  const handleAcceptRequest = async (userId: string) => {
    try {
      setAddingFriend(userId);
      await acceptFriendRequest(userId);
      setSuccessMessage('Friend request accepted!');
      fetchFriends();
      fetchFriendRequests();
      fetchLeaderboard();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to accept request');
      setTimeout(() => setError(null), 3000);
    } finally {
      setAddingFriend(null);
    }
  };

  // Handle reject friend request
  const handleRejectRequest = async (userId: string) => {
    try {
      await rejectFriendRequest(userId);
      fetchFriendRequests();
    } catch (err: any) {
      setError(err.message || 'Failed to reject request');
      setTimeout(() => setError(null), 3000);
    }
  };

  const hasFriends = friends.length > 0;
  const hasRequests = friendRequests.received.length > 0;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  // Get top 3 for podium and rest for list
  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = topThree.length >= 3 
    ? [topThree[1], topThree[0], topThree[2]] 
    : topThree;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Friend Requests Modal */}
      {showRequests && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-background rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold">friend requests</h2>
              <button
                onClick={() => setShowRequests(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-auto max-h-[60vh]">
              {friendRequests.received.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>no pending friend requests</p>
                </div>
              ) : (
                friendRequests.received.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                  >
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg">
                      {request.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{request.username}</div>
                      <div className="text-xs text-muted-foreground">
                        eco score: {request.ecoScore}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={addingFriend === request.id}
                      >
                        <UserX className="w-4 h-4 text-destructive" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={addingFriend === request.id}
                      >
                        {addingFriend === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-border">
              <Button onClick={() => setShowRequests(false)} className="w-full">
                done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Friends Modal */}
      {showAddFriends && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-background rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold">add friends</h2>
              <button
                onClick={() => {
                  setShowAddFriends(false);
                  setSearchQuery('');
                  setFriendCode('');
                  setLookupResult(null);
                  setLookupError(null);
                }}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6 overflow-auto max-h-[60vh]">
              {/* Success/Error Messages */}
              {successMessage && (
                <div className="p-3 rounded-xl bg-green-500/10 text-green-600 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {successMessage}
                </div>
              )}
              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Your Friend Code */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">your friend code</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-muted rounded-xl font-mono text-sm">
                    {user?.friendCode || 'Loading...'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="shrink-0"
                    disabled={!user?.friendCode}
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
                    placeholder="enter code (e.g., ECO-XXXX-XXXX)"
                    value={friendCode}
                    onChange={(e) => {
                      setFriendCode(e.target.value.toUpperCase());
                      setLookupResult(null);
                      setLookupError(null);
                    }}
                    className="flex-1 px-4 py-3 bg-muted rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <Button 
                    onClick={handleLookupCode} 
                    disabled={!friendCode.trim() || lookupLoading}
                    variant="outline"
                  >
                    {lookupLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'find'
                    )}
                  </Button>
                </div>
                
                {lookupError && (
                  <p className="text-sm text-destructive">{lookupError}</p>
                )}
                
                {lookupResult && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl mt-2">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm">
                      {lookupResult.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{lookupResult.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {lookupResult.pointsBalance.toLocaleString()} pts
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddFriend(lookupResult.id)}
                      disabled={addingFriend === lookupResult.id || friends.includes(lookupResult.id)}
                    >
                      {addingFriend === lookupResult.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : friends.includes(lookupResult.id) ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          friends
                        </>
                      ) : (
                        'add'
                      )}
                    </Button>
                  </div>
                )}
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
                  {searchLoading && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Search Results */}
                {searchQuery && (
                  <div className="space-y-2 mt-3">
                    {searchResults.length > 0 ? (
                      searchResults.slice(0, 5).map((result) => {
                        const isFriend = friends.includes(result.id);
                        const isPending = friendRequests.sent.some(r => r.id === result.id);
                        const isMe = result.id === user?.id;
                        
                        return (
                          <div
                            key={result.id}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                          >
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm">
                              {result.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">
                                {result.username}
                                {isMe && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {result.pointsBalance.toLocaleString()} pts
                              </div>
                            </div>
                            {!isMe && (
                              <Button
                                size="sm"
                                variant={isFriend || isPending ? "secondary" : "default"}
                                onClick={() => handleAddFriend(result.id)}
                                disabled={isFriend || isPending || addingFriend === result.id}
                              >
                                {addingFriend === result.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isFriend ? (
                                  <>
                                    <Check className="w-4 h-4 mr-1" />
                                    friends
                                  </>
                                ) : isPending ? (
                                  'pending'
                                ) : (
                                  'add'
                                )}
                              </Button>
                            )}
                          </div>
                        );
                      })
                    ) : !searchLoading ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        no users found
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border">
              <Button 
                onClick={() => {
                  setShowAddFriends(false);
                  setSearchQuery('');
                  setFriendCode('');
                  setLookupResult(null);
                  setLookupError(null);
                }} 
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
          <div className="flex items-center gap-2">
            {/* Friend requests button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowRequests(true)}
              className="relative"
            >
              <Bell className="w-4 h-4" />
              {hasRequests && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {friendRequests.received.length}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAddFriends(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              add friends
            </Button>
          </div>
        </div>

        {/* View toggle: Friends vs Global */}
        <div className="flex gap-2 px-4 pb-2">
          <button
            onClick={() => setView('friends')}
            className={cn(
              'flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
              view === 'friends'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <Users className="w-4 h-4" />
            friends
          </button>
          <button
            onClick={() => setView('global')}
            className={cn(
              'flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
              view === 'global'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <Trophy className="w-4 h-4" />
            global
          </button>
        </div>

        {/* Time frame toggle */}
        <div className="flex gap-2 p-4 pt-2">
          <button
            onClick={() => setTimeFrame('weekly')}
            className={cn(
              'flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all',
              timeFrame === 'weekly'
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground'
            )}
          >
            this week
          </button>
          <button
            onClick={() => setTimeFrame('alltime')}
            className={cn(
              'flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all',
              timeFrame === 'alltime'
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground'
            )}
          >
            all time
          </button>
          <button
            onClick={() => fetchLeaderboard(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
        </div>
      </header>

      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">loading leaderboard...</p>
          </div>
        ) : error && leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => fetchLeaderboard()} className="mt-4">
              try again
            </Button>
          </div>
        ) : view === 'friends' && !hasFriends ? (
          /* Empty state for friends view */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Mascot size="lg" mood="waving" />
            <h2 className="mt-6 text-lg font-semibold text-foreground">no friends yet</h2>
            <p className="mt-2 text-muted-foreground max-w-[260px]">
              add friends to compete on the leaderboard! share your friend code or search for users.
            </p>
            <Button className="mt-6" onClick={() => setShowAddFriends(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              add friends
            </Button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="w-16 h-16 text-muted-foreground/30" />
            <h2 className="mt-6 text-lg font-semibold text-foreground">no rankings yet</h2>
            <p className="mt-2 text-muted-foreground max-w-[260px]">
              start scanning products and earning points to climb the leaderboard!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Podium for Top 3 */}
            {topThree.length >= 3 && (
              <div className="relative pt-8 pb-4">
                <div className="flex items-end justify-center gap-2">
                  {podiumOrder.map((entry, index) => {
                    const isFirst = entry.rank === 1;
                    const isSecond = entry.rank === 2;
                    const isThird = entry.rank === 3;
                    const isCurrentUser = entry.isCurrentUser || entry.id === user?.id;
                    
                    const podiumHeight = isFirst ? 'h-28' : isSecond ? 'h-20' : 'h-14';
                    const podiumColor = isFirst 
                      ? 'bg-gradient-to-t from-yellow-500/20 to-yellow-400/40 border-yellow-500/50' 
                      : isSecond 
                      ? 'bg-gradient-to-t from-gray-400/20 to-gray-300/40 border-gray-400/50'
                      : 'bg-gradient-to-t from-amber-600/20 to-amber-500/40 border-amber-600/50';

                    return (
                      <div 
                        key={entry.id} 
                        className="flex flex-col items-center animate-slide-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {isFirst && (
                          <div className="mb-1 animate-bounce">
                            <Crown className="w-8 h-8 text-yellow-500 drop-shadow-lg" />
                          </div>
                        )}
                        
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

                        <span className={cn(
                          'text-sm font-semibold mb-1 truncate max-w-[80px]',
                          isCurrentUser && 'text-primary'
                        )}>
                          {entry.username}
                        </span>

                        <span className="text-xs text-muted-foreground mb-2">
                          {entry.pointsBalance.toLocaleString()} pts
                        </span>

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
            )}

            {/* Rest of leaderboard */}
            {restOfLeaderboard.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground px-1">
                  rankings
                </h3>
                {restOfLeaderboard.map((entry, i) => {
                  const isCurrentUser = entry.isCurrentUser || entry.id === user?.id;

                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-2xl transition-all animate-slide-up',
                        isCurrentUser ? 'bg-primary/10 border-2 border-primary' : 'bg-card',
                      )}
                      style={{ animationDelay: `${(i + 3) * 50}ms` }}
                    >
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-muted-foreground">
                          {entry.rank}
                        </span>
                      </div>

                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg shrink-0">
                        {entry.username.charAt(0).toUpperCase()}
                      </div>

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

                      <div className="text-right shrink-0">
                        <div className="font-bold text-foreground">{entry.pointsBalance.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">pts</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Show small list if less than 3 entries */}
            {topThree.length < 3 && leaderboard.length > 0 && (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => {
                  const isCurrentUser = entry.isCurrentUser || entry.id === user?.id;

                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-2xl transition-all animate-slide-up',
                        isCurrentUser ? 'bg-primary/10 border-2 border-primary' : 'bg-card',
                      )}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        {getRankIcon(entry.rank) || (
                          <span className="text-sm font-bold text-muted-foreground">
                            {entry.rank}
                          </span>
                        )}
                      </div>

                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg shrink-0">
                        {entry.username.charAt(0).toUpperCase()}
                      </div>

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
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-foreground">{entry.pointsBalance.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">pts</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
