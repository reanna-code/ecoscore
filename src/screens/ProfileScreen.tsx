import { useState } from 'react';
import { cn } from '@/lib/utils';
import { EcoScoreBadge, EcoScoreBar } from '@/components/EcoScoreBadge';
import { BadgeDisplay } from '@/components/BadgeDisplay';
import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { mockUser, mockOrganizations, mockBadges } from '@/data/mockData';
import { 
  Heart, 
  Settings, 
  Flame, 
  Gift, 
  ChevronRight, 
  TrendingUp,
  Check,
  ArrowLeft
} from 'lucide-react';

type ProfileTab = 'overview' | 'donate' | 'history';

export function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [donationStep, setDonationStep] = useState<'select' | 'org' | 'confirm' | 'success'>('select');
  const [selectedPoints, setSelectedPoints] = useState<number | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  const pointOptions = [100, 250, 500, 1000];
  const pointsToDollars = (points: number) => (points / 100).toFixed(2);

  const handleDonate = () => {
    setActiveTab('donate');
    setDonationStep('select');
  };

  const handleBack = () => {
    if (donationStep === 'org') setDonationStep('select');
    else if (donationStep === 'confirm') setDonationStep('org');
    else setActiveTab('overview');
  };

  const handleConfirmDonation = () => {
    setDonationStep('success');
  };

  if (activeTab === 'donate') {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center gap-3 p-4">
            {donationStep !== 'success' && (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="font-semibold text-lg">
              {donationStep === 'success' ? 'donation complete' : 'donate points'}
            </h1>
          </div>
        </header>

        <div className="p-4">
          {donationStep === 'select' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <p className="text-muted-foreground">you have</p>
                <p className="text-4xl font-bold text-primary">{mockUser.pointsBalance.toLocaleString()}</p>
                <p className="text-muted-foreground">points available</p>
              </div>

              <div>
                <h2 className="font-semibold mb-3">choose amount</h2>
                <div className="grid grid-cols-2 gap-3">
                  {pointOptions.map((pts) => (
                    <button
                      key={pts}
                      onClick={() => {
                        setSelectedPoints(pts);
                        setDonationStep('org');
                      }}
                      disabled={pts > mockUser.pointsBalance}
                      className={cn(
                        'p-4 rounded-2xl border-2 transition-all text-center',
                        pts <= mockUser.pointsBalance
                          ? 'border-border hover:border-primary bg-card'
                          : 'border-border bg-muted opacity-50 cursor-not-allowed'
                      )}
                    >
                      <p className="text-xl font-bold text-foreground">{pts}</p>
                      <p className="text-sm text-muted-foreground">= ${pointsToDollars(pts)}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {donationStep === 'org' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-semibold">choose organization</h2>
              {mockOrganizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setSelectedOrg(org.id);
                    setDonationStep('confirm');
                  }}
                  className="w-full p-4 rounded-2xl bg-card hover:bg-secondary transition-all text-left"
                >
                  <h3 className="font-semibold text-foreground">{org.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{org.description}</p>
                  <div className="flex gap-2 mt-2">
                    {org.trustBadges.map((badge) => (
                      <span
                        key={badge}
                        className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}

          {donationStep === 'confirm' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-2xl bg-card text-center">
                <p className="text-muted-foreground">donating</p>
                <p className="text-4xl font-bold text-primary mt-2">${pointsToDollars(selectedPoints!)}</p>
                <p className="text-sm text-muted-foreground mt-1">({selectedPoints} points)</p>
                <p className="mt-4 font-medium text-foreground">
                  to {mockOrganizations.find((o) => o.id === selectedOrg)?.name}
                </p>
              </div>

              <Button onClick={handleConfirmDonation} className="w-full">
                confirm donation
              </Button>
            </div>
          )}

          {donationStep === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-slide-up">
              <div className="animate-celebrate">
                <Mascot size="xl" mood="excited" />
              </div>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mt-6">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mt-4">thank you!</h2>
              <p className="text-muted-foreground mt-2 max-w-[260px]">
                your donation of ${pointsToDollars(selectedPoints!)} has been sent. donations feel good. do it again soon.
              </p>
              <Button onClick={() => setActiveTab('overview')} className="mt-6">
                back to profile
              </Button>
            </div>
          )}
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
          <button className="p-2 rounded-xl hover:bg-muted transition-colors">
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
                {mockUser.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{mockUser.username}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm">{mockUser.streakCount} day streak</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-3 rounded-xl bg-white/10">
                <p className="text-sm opacity-80">points</p>
                <p className="text-2xl font-bold">{mockUser.pointsBalance.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10">
                <p className="text-sm opacity-80">eco score</p>
                <p className="text-2xl font-bold">{mockUser.personalEcoScore}</p>
              </div>
            </div>
          </div>
        </section>

        {/* quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={handleDonate} className="justify-start">
            <Heart className="w-4 h-4 mr-2" />
            donate points
          </Button>
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
          <EcoScoreBar score={mockUser.personalEcoScore} />
          <p className="text-sm text-muted-foreground mt-2">
            +5 points from last month. keep it up!
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
          <div className="grid grid-cols-4 gap-4">
            {mockBadges.slice(0, 4).map((badge) => (
              <BadgeDisplay key={badge.id} badge={badge} size="md" showDetails />
            ))}
          </div>
        </section>

        {/* donation history */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">donation history</h3>
          </div>
          {mockUser.donationHistory.length > 0 ? (
            <div className="space-y-2">
              {mockUser.donationHistory.map((donation) => {
                const org = mockOrganizations.find((o) => o.id === donation.organizationId);
                return (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-card"
                  >
                    <div>
                      <p className="font-medium text-foreground">{org?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {donation.date.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">${donation.amountDollars}</p>
                      <p className="text-xs text-muted-foreground">{donation.pointsSpent} pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-card text-center">
              <Mascot size="md" mood="thinking" />
              <p className="mt-4 text-muted-foreground">
                no donations yet. turn points into impact when you're ready.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
