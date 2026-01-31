import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/Button';
import { ProductCard } from '@/components/ProductCard';
import { EcoScoreBadge } from '@/components/EcoScoreBadge';
import { Mascot, MascotMessage } from '@/components/Mascot';
import { Product, Alternative, calculatePoints } from '@/types/ecoscore';
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const handleConfirm = () => {
    if (!selectedId) return;

    const chosen = selectedId === scannedProduct.id
      ? scannedProduct
      : alternatives.find((a) => a.id === selectedId);

    if (chosen) {
      const points = calculatePoints(scannedProduct.ecoScore, chosen.ecoScore);
      setEarnedPoints(points);
      setShowCelebration(true);
    }
  };

  if (showCelebration) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-8 animate-slide-up">
          <div className="animate-celebrate">
            <Mascot size="xl" mood="excited" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-celebration text-white font-bold text-lg">
              <Sparkles className="w-5 h-5" />
              +{earnedPoints} points
            </div>
            <h1 className="text-2xl font-bold text-foreground">nice swap!</h1>
            <p className="text-muted-foreground">
              you just boosted your impact. your eco score is improving!
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              share
            </Button>
            <Button onClick={onBack} className="flex-1">
              scan again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
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
