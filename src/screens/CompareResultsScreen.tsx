import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/Button';
import { ProductCard } from '@/components/ProductCard';
import { EcoScoreBadge } from '@/components/EcoScoreBadge';
import { Mascot, MascotMessage } from '@/components/Mascot';
import { Product, Alternative, calculatePoints } from '@/types/ecoscore';
import { ArrowLeft, Check, Share2, Sparkles } from 'lucide-react';
import { speakText } from '@/services/elevenLabsService';

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const [choseGreener, setChoseGreener] = useState<boolean | null>(null);

  const handleConfirm = () => {
    if (!selectedId) return;

    const isScannedProduct = selectedId === scannedProduct.id;
    const chosen = isScannedProduct
      ? scannedProduct
      : alternatives.find((a) => a.id === selectedId);

    if (chosen) {
      const isGreenerChoice = !isScannedProduct;
      setChoseGreener(isGreenerChoice);
      const points = calculatePoints(scannedProduct.ecoScore, chosen.ecoScore);
      setEarnedPoints(points);
      setShowCelebration(true);
    }
  };

  // Play voice effect when celebration screen appears - reads the text displayed on screen
  useEffect(() => {
    console.log('🔍 Voice effect useEffect triggered:', { showCelebration, choseGreener, earnedPoints });
    
    if (showCelebration && choseGreener !== null) {
      console.log('✅ Conditions met for voice playback');
      const apiKey = import.meta.env.VITE_ELEVEN_LABS_API_KEY;
      
      console.log('🔑 API Key check:', { 
        hasKey: !!apiKey, 
        keyLength: apiKey?.length || 0,
        keyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'missing'
      });
      
      if (!apiKey) {
        console.warn('⚠️ Eleven Labs API key not found. Voice feature disabled.');
        console.log('Please add VITE_ELEVEN_LABS_API_KEY to your .env file and restart the dev server');
        return;
      }

      // Build the text that's displayed on screen (matching exactly what user sees)
      const pickedLessEco = !choseGreener;
      let textToSpeak = '';
      let voiceId: string | undefined = undefined;

      if (pickedLessEco) {
        // Text for less eco-friendly choice - matches screen text
        textToSpeak = "that's okay! next time try a greener pick — your leaf friend believes in you!";
        // Use specific voice ID for original choice
        voiceId = '5f9yB2oppQMBp00ATIIr';
      } else {
        // Text for greener choice - matches screen text including points badge
        textToSpeak = `nice swap! you earned ${earnedPoints} points. you just boosted your impact. your eco score is improving!`;
        // Use default voice (Antoni) for greener choice
      }

      console.log('🎤 Playing voice:', textToSpeak);
      if (voiceId) {
        console.log('🎙️ Using custom voice ID:', voiceId);
      }

      // Small delay to ensure screen is rendered and handle browser autoplay
      const playVoice = async () => {
        try {
          console.log('🚀 Starting voice playback...');
          await speakText(textToSpeak, apiKey, voiceId);
          console.log('✅ Voice played successfully');
        } catch (error) {
          console.error('❌ Error playing voice:', error);
          if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
          }
        }
      };

      // Delay slightly to ensure UI is ready and handle autoplay restrictions
      setTimeout(() => {
        playVoice();
      }, 500);
    } else {
      console.log('⏸️ Voice effect conditions not met:', { 
        showCelebration, 
        choseGreener, 
        reason: !showCelebration ? 'showCelebration is false' : 'choseGreener is null'
      });
    }
  }, [showCelebration, choseGreener, earnedPoints]);

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
        
        {/* Clouds and pollution background for sad choice */}
        {pickedLessEco && (
          <>
            {/* Pollution background - bigger and more intense */}
            <div className="absolute inset-0 opacity-30 overflow-hidden">
              {/* Large factory silhouettes across bottom */}
              <svg className="absolute bottom-0 left-0 w-full h-64" viewBox="0 0 1200 250" preserveAspectRatio="xMidYMax slice">
                {/* Left factory */}
                <rect x="50" y="100" width="140" height="150" fill="hsl(0, 0%, 35%)" />
                <rect x="20" y="120" width="60" height="130" fill="hsl(0, 0%, 30%)" />
                <rect x="160" y="130" width="50" height="120" fill="hsl(0, 0%, 30%)" />
                {/* Tall smokestacks */}
                <rect x="80" y="30" width="25" height="70" fill="hsl(0, 0%, 25%)" />
                <rect x="120" y="20" width="25" height="80" fill="hsl(0, 0%, 25%)" />
                {/* Abstract smoke - each unique shape, taller, centered at x=92.5 and x=132.5 */}
                <path d="M85 35 Q78 28 80 20 Q82 14 88 16 Q92.5 8 97 16 Q100 22 102 28 Q102 34 98 38 Q92 40 86 38 Q85 36 85 35 Z" fill="hsl(0, 0%, 45%)" opacity="0.6" />
                <path d="M122 28 Q118 22 120 12 Q124 4 128 8 Q132.5 0 137 10 Q142 16 143 24 Q143 30 140 34 Q135 36 128 34 Q122 30 122 28 Z" fill="hsl(0, 0%, 45%)" opacity="0.6" />
                <path d="M86 26 Q88 20 92.5 22 Q97 20 98 26 Q98 32 94 34 Q90 32 86 28 Q86 27 86 26 Z" fill="hsl(0, 0%, 50%)" opacity="0.5" />
                
                {/* Middle factory complex */}
                <rect x="350" y="90" width="180" height="160" fill="hsl(0, 0%, 38%)" />
                <rect x="300" y="120" width="70" height="130" fill="hsl(0, 0%, 32%)" />
                <rect x="510" y="110" width="80" height="140" fill="hsl(0, 0%, 32%)" />
                {/* Cooling towers */}
                <path d="M420 20 Q430 45 425 90 L445 90 Q440 45 450 20 Z" fill="hsl(200, 15%, 60%)" />
                <path d="M470 30 Q480 50 475 90 L495 90 Q490 50 500 30 Z" fill="hsl(200, 15%, 60%)" />
                {/* Big abstract smoke - unique wavy shapes, taller, centered at x=435 and x=485 */}
                <path d="M418 35 Q415 25 418 12 Q422 2 428 8 Q435 -5 442 10 Q448 18 450 26 Q452 34 450 42 Q446 48 440 50 Q435 48 428 44 Q422 40 418 35 Z" fill="hsl(0, 0%, 45%)" opacity="0.6" />
                <path d="M468 45 Q465 35 467 22 Q470 10 476 16 Q485 5 492 20 Q498 30 502 38 Q504 48 500 54 Q494 60 488 58 Q485 54 478 50 Q472 48 468 45 Z" fill="hsl(0, 0%, 45%)" opacity="0.6" />
                <path d="M426 24 Q430 18 435 20 Q440 18 444 24 Q448 30 444 36 Q438 38 435 36 Q430 32 426 28 Q426 26 426 24 Z" fill="hsl(0, 0%, 50%)" opacity="0.5" />
                
                {/* Right factory */}
                <rect x="750" y="105" width="160" height="145" fill="hsl(0, 0%, 36%)" />
                <rect x="720" y="130" width="60" height="120" fill="hsl(0, 0%, 31%)" />
                <rect x="890" y="115" width="70" height="135" fill="hsl(0, 0%, 31%)" />
                {/* Tall stacks */}
                <rect x="790" y="35" width="28" height="70" fill="hsl(0, 0%, 26%)" />
                <rect x="840" y="25" width="28" height="80" fill="hsl(0, 0%, 26%)" />
                {/* Abstract smoke - unique puffy shapes, taller, centered at x=804 and x=854 */}
                <path d="M790 46 Q786 38 788 28 Q792 20 798 22 Q804 14 810 24 Q816 32 820 38 Q820 44 818 50 Q812 54 806 52 Q804 48 796 46 Q790 46 790 46 Z" fill="hsl(0, 0%, 45%)" opacity="0.6" />
                <path d="M840 38 Q836 30 838 18 Q842 8 848 14 Q854 6 860 18 Q866 26 870 34 Q870 42 866 48 Q860 52 854 50 Q850 46 844 42 Q840 40 840 38 Z" fill="hsl(0, 0%, 45%)" opacity="0.6" />
                <path d="M798 36 Q800 30 804 32 Q808 30 810 36 Q812 42 808 46 Q804 46 800 42 Q798 40 798 36 Z" fill="hsl(0, 0%, 50%)" opacity="0.5" />
                
                {/* Far right factory */}
                <rect x="1000" y="115" width="130" height="135" fill="hsl(0, 0%, 40%)" />
                <rect x="1080" y="135" width="55" height="115" fill="hsl(0, 0%, 35%)" />
                <rect x="1020" y="45" width="22" height="70" fill="hsl(0, 0%, 28%)" />
                {/* Abstract smoke - unique billowy shape, taller, centered at x=1031 */}
                <path d="M1016 56 Q1012 48 1014 36 Q1018 26 1024 30 Q1031 22 1038 32 Q1044 40 1048 48 Q1048 56 1044 62 Q1038 66 1032 64 Q1031 60 1024 58 Q1018 56 1016 56 Z" fill="hsl(0, 0%, 45%)" opacity="0.6" />
              </svg>
              
              {/* Oil spills on ground - larger and more visible */}
              <div className="absolute bottom-0 left-0 right-0 h-20">
                <svg width="100%" height="100%" viewBox="0 0 1200 80" preserveAspectRatio="none">
                  <ellipse cx="200" cy="60" rx="150" ry="25" fill="hsl(270, 25%, 15%)" opacity="0.5" />
                  <ellipse cx="600" cy="55" rx="200" ry="30" fill="hsl(270, 25%, 12%)" opacity="0.5" />
                  <ellipse cx="950" cy="58" rx="160" ry="28" fill="hsl(270, 25%, 14%)" opacity="0.5" />
                  <ellipse cx="400" cy="62" rx="120" ry="22" fill="hsl(270, 25%, 16%)" opacity="0.5" />
                </svg>
              </div>
            </div>
            
            {/* Clouds - only at the top (sky) - spaced apart */}
            {[
              { left: 10, top: 5, size: 90 },
              { left: 35, top: 12, size: 100 },
              { left: 60, top: 8, size: 85 },
              { left: 20, top: 18, size: 95 },
              { left: 75, top: 15, size: 110 },
              { left: 50, top: 22, size: 80 },
            ].map((cloud, i) => (
              <div
                key={`cloud-${i}`}
                className="absolute opacity-30"
                style={{
                  left: `${cloud.left}%`,
                  top: `${cloud.top}%`,
                }}
              >
                <svg width={cloud.size} height={cloud.size * 0.5} viewBox="0 0 80 40">
                  <ellipse cx="20" cy="25" rx="15" ry="12" fill="hsl(200, 10%, 55%)" />
                  <ellipse cx="40" cy="20" rx="20" ry="15" fill="hsl(200, 10%, 55%)" />
                  <ellipse cx="60" cy="25" rx="15" ry="12" fill="hsl(200, 10%, 55%)" />
                </svg>
              </div>
            ))}
          </>
        )}
        
        <div className="w-full max-w-sm text-center space-y-8 animate-slide-up relative z-10">
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
