import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { ScanScreen } from '@/screens/ScanScreen';
import { DiscoverScreen } from '@/screens/DiscoverScreen';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';

type TabId = 'scan' | 'discover' | 'leaderboard' | 'profile';

const Index = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('scan');

  // check if user has seen onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('ecoscore_onboarding_complete');
    if (hasSeenOnboarding) {
      setShowOnboarding(false);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('ecoscore_onboarding_complete', 'true');
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'scan':
        return <ScanScreen />;
      case 'discover':
        return <DiscoverScreen />;
      case 'leaderboard':
        return <LeaderboardScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <ScanScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderActiveTab()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
