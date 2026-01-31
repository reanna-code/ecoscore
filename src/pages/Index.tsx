import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { AuthScreen, UsernameScreen } from '@/screens/AuthScreen';
import { ScanScreen } from '@/screens/ScanScreen';
import { DiscoverScreen } from '@/screens/DiscoverScreen';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { DonationsScreen } from '@/screens/DonationsScreen';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type TabId = 'scan' | 'discover' | 'leaderboard' | 'donate' | 'profile';

const Index = () => {
  const { 
    isLoading, 
    isAuthenticated, 
    needsRegistration, 
    registerNewUser, 
    isRegistering,
    firebaseUser,
    isConfigured
  } = useAuth();
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('scan');
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // Check if user has seen onboarding (only after they're fully authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      const hasSeenOnboarding = localStorage.getItem('ecoscore_onboarding_complete');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleUsernameSubmit = async (username: string) => {
    setRegistrationError(null);
    try {
      await registerNewUser(username);
    } catch (err) {
      if (err instanceof Error) {
        setRegistrationError(err.message);
      }
      throw err;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">loading...</p>
        </div>
      </div>
    );
  }

  // Firebase not configured - show setup instructions
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto">
            <span className="text-3xl">⚠️</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Firebase Not Configured</h1>
            <p className="text-muted-foreground">
              Please add your Firebase client configuration to the <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm">.env</code> file.
            </p>
          </div>
          <div className="text-left p-4 rounded-xl bg-muted font-mono text-sm overflow-x-auto">
            <p className="text-muted-foreground"># Add these to .env:</p>
            <p>VITE_FIREBASE_API_KEY=...</p>
            <p>VITE_FIREBASE_AUTH_DOMAIN=...</p>
            <p>VITE_FIREBASE_PROJECT_ID=...</p>
            <p>VITE_FIREBASE_STORAGE_BUCKET=...</p>
            <p>VITE_FIREBASE_MESSAGING_SENDER_ID=...</p>
            <p>VITE_FIREBASE_APP_ID=...</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Get these from: <span className="text-primary">Firebase Console → Project Settings → General → Your apps</span>
          </p>
          <p className="text-xs text-muted-foreground">
            After adding the variables, restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated - show auth screen
  if (!firebaseUser) {
    return <AuthScreen onNeedsUsername={() => {}} />;
  }

  // Authenticated but needs to pick username
  if (needsRegistration) {
    return (
      <UsernameScreen 
        onComplete={handleUsernameSubmit}
        isLoading={isRegistering}
        error={registrationError}
      />
    );
  }

  // Show onboarding for new users
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
      case 'donate':
        return <DonationsScreen />;
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
