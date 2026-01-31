import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/config/firebase';
import { Leaf, Mail, Lock, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';

type AuthMode = 'welcome' | 'login' | 'signup' | 'username';

interface AuthScreenProps {
  onNeedsUsername: () => void;
}

export function AuthScreen({ onNeedsUsername }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      // Auth state change will be handled by AuthContext
      onNeedsUsername();
    } catch (err) {
      console.error('Auth error:', err);
      if (err instanceof Error) {
        // Make Firebase errors more user-friendly
        let message = err.message;
        if (message.includes('auth/email-already-in-use')) {
          message = 'An account with this email already exists';
        } else if (message.includes('auth/invalid-email')) {
          message = 'Please enter a valid email address';
        } else if (message.includes('auth/wrong-password') || message.includes('auth/user-not-found')) {
          message = 'Invalid email or password';
        } else if (message.includes('auth/weak-password')) {
          message = 'Password must be at least 6 characters';
        }
        setError(message);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await signInWithGoogle();
      onNeedsUsername();
    } catch (err) {
      console.error('Google auth error:', err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Welcome screen
  if (mode === 'welcome') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm text-center space-y-8">
            {/* Logo and mascot */}
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-3xl gradient-nature flex items-center justify-center mx-auto shadow-lg">
                <Leaf className="w-10 h-10 text-white" />
              </div>
              <Mascot size="lg" mood="waving" />
            </div>

            {/* Welcome text */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">ecoscore</h1>
              <p className="text-muted-foreground">
                scan products. make greener choices. earn rewards.
              </p>
            </div>

            {/* Auth buttons */}
            <div className="space-y-3 pt-4">
              <Button 
                onClick={handleGoogleAuth} 
                variant="outline" 
                className="w-full h-12"
                loading={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                continue with google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button 
                onClick={() => setMode('signup')} 
                className="w-full h-12"
              >
                <Mail className="w-5 h-5 mr-2" />
                sign up with email
              </Button>

              <Button 
                onClick={() => setMode('login')} 
                variant="ghost" 
                className="w-full"
              >
                already have an account? log in
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-xs text-muted-foreground">
          by continuing, you agree to our terms of service and privacy policy
        </div>
      </div>
    );
  }

  // Login or Signup form
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <button
          onClick={() => setMode('welcome')}
          className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <Mascot size="md" mood={mode === 'signup' ? 'excited' : 'happy'} />
            <h1 className="text-2xl font-bold text-foreground">
              {mode === 'signup' ? 'create account' : 'welcome back'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'signup' 
                ? 'start your eco journey today' 
                : 'log in to continue your eco journey'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full h-12 pl-12 pr-12 rounded-xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (signup only) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}

            {/* Submit button */}
            <Button type="submit" className="w-full h-12" loading={isLoading}>
              {mode === 'signup' ? 'create account' : 'log in'}
            </Button>
          </form>

          {/* Toggle mode */}
          <div className="text-center">
            {mode === 'signup' ? (
              <button
                onClick={() => setMode('login')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                already have an account? <span className="font-medium text-primary">log in</span>
              </button>
            ) : (
              <button
                onClick={() => setMode('signup')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                don't have an account? <span className="font-medium text-primary">sign up</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Username selection screen (shown after first auth)
interface UsernameScreenProps {
  onComplete: (username: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export function UsernameScreen({ onComplete, isLoading, error }: UsernameScreenProps) {
  const [username, setUsername] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validate username
    if (username.length < 3) {
      setLocalError('Username must be at least 3 characters');
      return;
    }
    if (username.length > 20) {
      setLocalError('Username must be 20 characters or less');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setLocalError('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      await onComplete(username);
    } catch (err) {
      if (err instanceof Error) {
        setLocalError(err.message);
      }
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Mascot size="lg" mood="excited" />
          <h1 className="text-2xl font-bold text-foreground">choose your username</h1>
          <p className="text-muted-foreground">
            this is how you'll appear on the leaderboard
          </p>
        </div>

        {/* Error message */}
        {displayError && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
            {displayError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="ecowarrior"
                required
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          <Button type="submit" className="w-full h-12" loading={isLoading}>
            continue
          </Button>
        </form>
      </div>
    </div>
  );
}
