import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/Button';
import { ProductCard } from '@/components/ProductCard';
import { EcoScoreBadge } from '@/components/EcoScoreBadge';
import { Mascot, MascotMessage } from '@/components/Mascot';
import { Product, Alternative, calculatePoints } from '@/types/ecoscore';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Check, Share2, Sparkles } from 'lucide-react';

interface CompareResultsScreenProps {
  scannedProduct: Product;
  alternatives: Alternative[];
  onBack: () => void;
}

export function CompareResultsScreen({
  scannedProduct,
  alternatives,
  onBack,
}: CompareResultsScreenProps) {
  const { addPoints, refreshUserData } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const [choseGreener, setChoseGreener] = useState<boolean | null>(null);

  const handleConfirm = async () => {
    if (!selectedId) return;

    const isScannedProduct = selectedId === scannedProduct.id;
    const chosen = isScannedProduct
      ? scannedProduct
      : alternatives.find((a) => a.id === selectedId);

    if (chosen) {
      const choseGreenerOption = !isScannedProduct;
      setChoseGreener(choseGreenerOption);
      
      // Calculate points earned
      const points = calculatePoints(scannedProduct.ecoScore, chosen.ecoScore);
      setEarnedPoints(points);
      
      // If user chose a greener alternative, add points and track the swap
      if (choseGreenerOption && points > 0) {
        try {
          // Add points via API (this also updates swapsThisMonth on the backend)
          await addPoints(points, 'swap');
          // Refresh user data to get updated stats
          await refreshUserData();
          console.log(`Added ${points} points for eco swap!`);
        } catch (error) {
          console.error('Failed to add points:', error);
        }
      }
      
      setShowCelebration(true);
    }
  };

  const handleShare = async () => {
    console.log('Share button clicked!', { earnedPoints });
    const shareData = {
      title: 'EcoScore - Nice Swap!',
      text: `I just earned +${earnedPoints} points by making a greener choice! 🌿 Join me on EcoScore to track your eco-friendly swaps.`,
      url: window.location.origin,
    };

    try {
      // Check if Web Share API is available
      if (navigator.share) {
        console.log('Using Web Share API');
        await navigator.share(shareData);
      } else {
        console.log('Using clipboard fallback');
        // Fallback: copy to clipboard
        const textToCopy = `${shareData.text}\n${shareData.url}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy);
          alert('✅ Copied to clipboard!\n\nShare this with your friends to spread the eco-love! 🌿');
        } else {
          // Final fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = textToCopy;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('✅ Copied to clipboard!\n\nShare this with your friends to spread the eco-love! 🌿');
        }
      }
    } catch (err) {
      // User cancelled or error occurred
      console.error('Share error:', err);
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err);
        alert('❌ Could not share. Please try again.');
      }
    }
  };

  const handleBackToCompare = () => {
    setShowCelebration(false);
    setSelectedId(null);
  };

  if (showCelebration && choseGreener !== null) {
    const pickedLessEco = !choseGreener;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 pb-40 relative overflow-hidden">
        {/* Confetti and sun for greener choice */}
        {!pickedLessEco && (
          <>
            {/* Sunny sky - realistic sun with gradients */}
            <div className="absolute top-8 right-8">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <defs>
                  {/* Radial gradient for sun body */}
                  <radialGradient id="sunGradient">
                    <stop offset="0%" stopColor="hsl(50, 100%, 95%)" />
                    <stop offset="30%" stopColor="hsl(48, 100%, 80%)" />
                    <stop offset="60%" stopColor="hsl(45, 100%, 60%)" />
                    <stop offset="100%" stopColor="hsl(40, 100%, 50%)" />
                  </radialGradient>
                  {/* Glow filter */}
                  <filter id="sunGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  {/* Gradient for rays */}
                  <linearGradient id="rayGradient">
                    <stop offset="0%" stopColor="hsl(45, 100%, 70%)" stopOpacity="0" />
                    <stop offset="100%" stopColor="hsl(45, 100%, 60%)" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                
                {/* Outer glow */}
                <circle cx="70" cy="70" r="40" fill="hsl(45, 100%, 65%)" opacity="0.3" filter="url(#sunGlow)" />
                <circle cx="70" cy="70" r="32" fill="hsl(45, 100%, 70%)" opacity="0.4" />
                
                {/* Sun rays - tapered triangular shapes, thicker */}
                <g fill="url(#rayGradient)">
                  {/* Top ray */}
                  <polygon points="70,5 65,40 75,40" />
                  {/* Bottom ray */}
                  <polygon points="70,135 65,100 75,100" />
                  {/* Left ray */}
                  <polygon points="5,70 40,65 40,75" />
                  {/* Right ray */}
                  <polygon points="135,70 100,65 100,75" />
                  {/* Top-left ray */}
                  <polygon points="20,20 43,43 50,38 38,50" />
                  {/* Top-right ray */}
                  <polygon points="120,20 97,43 90,38 102,50" />
                  {/* Bottom-left ray */}
                  <polygon points="20,120 43,97 50,102 38,90" />
                  {/* Bottom-right ray */}
                  <polygon points="120,120 97,97 90,102 102,90" />
                </g>
                
                {/* Sun body with gradient */}
                <circle cx="70" cy="70" r="26" fill="url(#sunGradient)" filter="url(#sunGlow)" />
              </svg>
            </div>
            
            {/* Confetti */}
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-${Math.random() * 20}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                <div
                  className="w-2 h-2 rotate-45"
                  style={{
                    backgroundColor: [
                      'hsl(152, 60%, 50%)',
                      'hsl(90, 60%, 55%)',
                      'hsl(45, 70%, 60%)',
                      'hsl(160, 55%, 50%)',
                      'hsl(200, 60%, 60%)',
                    ][i % 5],
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                />
              </div>
            ))}
          </>
        )}
        
        {/* Pollution background is now handled by the Mascot component via portal */}
        
        <div className="w-full max-w-sm text-center space-y-8 animate-slide-up relative" style={{ zIndex: 20 }}>
          <div className={cn('flex justify-center', !pickedLessEco && 'animate-celebrate')}>
            <Mascot size="xl" mood={pickedLessEco ? 'sad' : 'excited'} />
          </div>

          <div className="space-y-3">
            {pickedLessEco ? (
              <>
                <h1 className="text-2xl font-bold text-foreground">that&apos;s okay!</h1>
                <p className="text-muted-foreground">
                  next time try a greener pick — your leaf friend believes in you!
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-celebration text-white font-bold text-lg">
                  <Sparkles className="w-5 h-5" />
                  +{earnedPoints} points
                </div>
                <h1 className="text-2xl font-bold text-foreground">nice swap!</h1>
                <p className="text-muted-foreground">
                  you just boosted your impact. your eco score is improving!
                </p>
              </>
            )}
          </div>

          <div className="space-y-3">
            {!pickedLessEco && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                share
              </Button>
            )}
            <Button onClick={onBack} className="w-full">
              scan again
            </Button>
            <Button variant="ghost" onClick={handleBackToCompare} className="w-full">
              back to alternatives
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-32">
      {/* header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-lg">compare results</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* scanned product */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            scanned product
          </h2>
          <ProductCard
            product={scannedProduct}
            variant="scanned"
            selected={selectedId === scannedProduct.id}
            onSelect={() => setSelectedId(scannedProduct.id)}
          />

          {/* impact summary */}
          <div className="mt-3 p-3 rounded-xl bg-muted/50 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">impact summary: </span>
            high plastic packaging, long transport, limited recyclability
          </div>
        </section>

        {/* alternatives */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            greener alternatives
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {alternatives.length} found
            </span>
          </h2>

          <div className="space-y-3">
            {alternatives.map((alt, i) => (
              <div
                key={alt.id}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <ProductCard
                  product={alt}
                  variant="alternative"
                  selected={selectedId === alt.id}
                  onSelect={() => setSelectedId(alt.id)}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* confirm button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={handleConfirm}
          disabled={!selectedId}
          className="w-full"
        >
          <Check className="w-5 h-5 mr-2" />
          confirm what you bought
        </Button>
      </div>
    </div>
  );
}
