import { useState, useEffect } from 'react';
import { BadgeDisplay } from '@/components/BadgeDisplay';
import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { useAuth } from '@/contexts/AuthContext';
import { ImpactCertificate } from '@/components/donations/ImpactCertificate';
import { getCertificates, getDonationStats, getPledges, devClearCertificates } from '@/services/apiService';
import {
  Settings,
  Users,
  ChevronRight,
  Check,
  ArrowLeft,
  LogOut,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { SolanaIcon } from '@/components/icons/SolanaIcon';

export function ProfileScreen() {
  const { userData, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showImpactCert, setShowImpactCert] = useState(false);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [totalDonated, setTotalDonated] = useState(0);
  const [donationStats, setDonationStats] = useState<any>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  async function loadCertificates() {
    try {
      const [certRes, statsRes, pledgesRes] = await Promise.all([
        getCertificates().catch(() => ({ certificates: [] })),
        getDonationStats().catch(() => ({ stats: {} })),
        getPledges().catch(() => ({ pledges: [] }))
      ]);
      setCertificates(certRes.certificates || []);
      setDonationStats(statsRes.stats || {});
      // Calculate total donated from user's completed pledges (not just minted NFTs)
      const pledges = pledgesRes.pledges || [];
      const totalFromPledges = pledges
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + (p.estimatedUsd || 0), 0);
      // Also include pending pledges since they represent user's intent to donate
      const totalFromAllPledges = pledges
        .reduce((sum: number, p: any) => sum + (p.estimatedUsd || 0), 0);
      setTotalDonated(totalFromAllPledges);
    } catch (e) {
      console.error('Failed to load certificates:', e);
    }
  }

  // Use real user data or fallback
  const user = userData || {
    username: 'guest',
    displayName: 'Guest User',
    pointsBalance: 0,
    swapsThisMonth: 0,
    friends: [],
    badges: [],
    friendCode: 'ECO-XXXX-XXXX',
    scanHistory: [],
  };

  // Count swaps from scan history (products that were actually swapped to an alternative)
  const swapsFromHistory = (user.scanHistory || []).filter((scan: any) => scan.swappedTo).length;
  const totalSwaps = swapsFromHistory || user.swapsThisMonth || 0;
  const friendsCount = user.friends?.length || 0;

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
      <div className="min-h-screen bg-background pb-32">
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
    <div className="min-h-screen bg-background pb-32">
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
                <button className="flex items-center gap-2 mt-1 opacity-80 hover:opacity-100">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{friendsCount} friends</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-3 rounded-xl bg-white/10">
                <p className="text-sm opacity-80">points</p>
                <p className="text-2xl font-bold">{user.pointsBalance.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10">
                <p className="text-sm opacity-80">items swapped</p>
                <p className="text-2xl font-bold">{totalSwaps}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Share Impact Button */}
        {totalDonated > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowImpactCert(true)}
              className="w-full p-4 rounded-2xl bg-card border-2 border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.3)] hover:shadow-[0_0_25px_rgba(251,146,60,0.5)] transition-all flex items-center justify-center gap-2"
            >
              <SolanaIcon className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-orange-600">Share Your Impact</span>
            </button>
            {/* Dev button to clear certificates for testing */}
            {import.meta.env.DEV && certificates.length > 0 && (
              <button
                onClick={async () => {
                  try {
                    await devClearCertificates();
                    loadCertificates();
                  } catch (e) {
                    console.error('Failed to clear:', e);
                  }
                }}
                className="w-full p-2 text-xs border border-dashed border-red-300 text-red-500 rounded-lg"
              >
                [dev] Clear my NFT certificates ({certificates.length})
              </button>
            )}
          </div>
        )}

        {/* badges / nfts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">badges / nfts</h3>
            <button className="text-sm text-primary font-medium flex items-center gap-1">
              see all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {(user.badges && user.badges.length > 0) || certificates.length > 0 ? (
            <div className="space-y-3">
              {/* NFT Certificates */}
              {certificates.map((cert: any, i: number) => (
                <a
                  key={`nft-${i}`}
                  href={cert.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <SolanaIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">${cert.donationAmount?.toFixed(2)} Impact NFT</p>
                      <p className="text-xs text-muted-foreground">
                        {cert.ngoName || 'Climate Action'} · {new Date(cert.mintedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              ))}

              {/* Traditional Badges */}
              {user.badges && user.badges.length > 0 && (
                <div className="grid grid-cols-4 gap-4 pt-2">
                  {user.badges.slice(0, 4).map((badge: any) => (
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
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-card text-center">
              <Mascot size="md" mood="thinking" />
              <p className="mt-4 text-muted-foreground">
                no badges or nfts yet. donate to mint impact nfts!
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

      {/* Impact Certificate Modal */}
      {showImpactCert && (
        <ImpactCertificate
          userName={user.displayName || user.username}
          totalDonated={totalDonated}
          onClose={() => {
            setShowImpactCert(false);
            // Refresh certificates to get newly minted one
            loadCertificates();
          }}
          existingNft={certificates.length > 0 ? {
            mintAddress: certificates[0].mintAddress,
            explorerUrl: certificates[0].explorerUrl,
            imageUrl: certificates[0].imageUrl
          } : null}
        />
      )}
    </div>
  );
}
