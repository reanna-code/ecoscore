import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange, logOut, isFirebaseConfigured } from '@/config/firebase';
import { getCurrentUser, registerUser } from '@/services/apiService';

// User data from our MongoDB
export interface UserData {
  id: string;
  firebaseUid: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  friendCode: string;
  ecoScore: number;
  pointsBalance: number;
  totalPointsEarned: number;
  streakCount: number;
  scansThisMonth: number;
  swapsThisMonth: number;
  badges: Badge[];
  friends: UserData[];
  isPublicProfile: boolean;
}

export interface Badge {
  badgeId: string;
  name: string;
  description?: string;
  icon?: string;
  category: string;
  earnedAt: string;
}

interface AuthContextType {
  // Firebase auth user
  firebaseUser: FirebaseUser | null;
  // Our app user data from MongoDB
  userData: UserData | null;
  // Loading states
  isLoading: boolean;
  isRegistering: boolean;
  // Auth status
  isAuthenticated: boolean;
  needsRegistration: boolean;
  // Configuration status
  isConfigured: boolean;
  // Actions
  registerNewUser: (username: string, displayName?: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [needsRegistration, setNeedsRegistration] = useState(false);

  // Listen for Firebase auth state changes
  useEffect(() => {
    // Auto-logout on every refresh for testing
    const initAuth = async () => {
      try {
        await logOut();
      } catch (error) {
        console.log('Auto-logout failed:', error);
      }

      const unsubscribe = onAuthChange(async (user) => {
        setFirebaseUser(user);
        
        if (user) {
          // User is signed in, try to get their data from our API
          try {
            const response = await getCurrentUser();
            setUserData(response.user);
            setNeedsRegistration(false);
          } catch (error) {
            // User exists in Firebase but not in our DB - needs registration
            console.log('User needs to complete registration');
            setNeedsRegistration(true);
            setUserData(null);
          }
        } else {
          // User is signed out
          setUserData(null);
          setNeedsRegistration(false);
        }
        
        setIsLoading(false);
      });

      return unsubscribe;
    };

    const unsubscribePromise = initAuth();
    
    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe());
    };
  }, []);

  // Register a new user in our MongoDB
  const registerNewUser = async (username: string, displayName?: string) => {
    if (!firebaseUser) throw new Error('Not authenticated');
    
    setIsRegistering(true);
    try {
      const response = await registerUser(username, displayName);
      // Set the user data from registration response
      setUserData(response.user);
      setNeedsRegistration(false);
      
      // Also refresh to ensure we have the complete data
      // (in case the registration response is missing any fields)
      try {
        const refreshResponse = await getCurrentUser();
        setUserData(refreshResponse.user);
      } catch (refreshError) {
        // Ignore refresh errors, we already have the registration data
        console.log('Note: Could not refresh user data after registration');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  // Refresh user data from API
  const refreshUserData = async () => {
    if (!firebaseUser) return;
    
    try {
      const response = await getCurrentUser();
      setUserData(response.user);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // Sign out
  const signOut = async () => {
    await logOut();
    setUserData(null);
    setNeedsRegistration(false);
  };

  const value: AuthContextType = {
    firebaseUser,
    userData,
    isLoading,
    isRegistering,
    isAuthenticated: !!firebaseUser && !!userData,
    needsRegistration,
    isConfigured: isFirebaseConfigured,
    registerNewUser,
    refreshUserData,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
