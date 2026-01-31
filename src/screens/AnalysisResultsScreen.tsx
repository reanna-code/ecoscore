import { useState } from 'react';
import { Button } from '@/components/Button';
import { EcoScoreBadge } from '@/components/EcoScoreBadge';
import { Mascot } from '@/components/Mascot';
import {
  GeminiAnalysisResult,
  getEcoScoreLevel,
  calculatePoints,
} from '@/types/ecoscore';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Leaf,
  Package,
  Droplets,
  Recycle,
  Heart,
  TrendingUp,
  ExternalLink,
  Sparkles,
  Share2,
  DollarSign,
} from 'lucide-react';

interface AnalysisResultsScreenProps {
  analysis: GeminiAnalysisResult;
  capturedImages: string[];
  onBack: () => void;
  onScanAgain: () => void;
}

// Helper to format price display
function formatPrice(price: { min: number; max: number; currency: string } | null): string {
  if (!price) return '';
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency || 'USD',
    minimumFractionDigits: 2,
  });
  if (price.min === price.max) {
    return formatter.format(price.min);
  }
  return `${formatter.format(price.min)} - ${formatter.format(price.max)}`;
}

export function AnalysisResultsScreen({
  analysis,
  capturedImages,
  onBack,
  onScanAgain,
}: AnalysisResultsScreenProps) {
  const [selectedAlternative, setSelectedAlternative] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const handleConfirmSwap = () => {
    if (selectedAlternative === null) return;
    const alt = analysis.alternatives[selectedAlternative];
    const points = calculatePoints(analysis.ecoScore, alt.estimatedEcoScore);
    setEarnedPoints(points);
    setShowCelebration(true);
  };

  const scoreLevel = getEcoScoreLevel(analysis.ecoScore);
  const scoreColors = {
    excellent: 'text-green-500 bg-green-500/10',
    good: 'text-emerald-500 bg-emerald-500/10',
    moderate: 'text-yellow-500 bg-yellow-500/10',
    poor: 'text-orange-500 bg-orange-500/10',
    bad: 'text-red-500 bg-red-500/10',
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
              you just made a greener choice. your eco score is improving!
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              share
            </Button>
            <Button onClick={onScanAgain} className="flex-1">
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
          <h1 className="font-semibold text-lg">analysis results</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* product identification */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            {capturedImages[0] && (
              <img
                src={capturedImages[0]}
                alt="Scanned product"
                className="w-20 h-20 rounded-xl object-cover"
              />
            )}
            <div className="flex-1">
              <h2 className="font-bold text-xl text-foreground">
                {analysis.productName}
              </h2>
              {analysis.brand && (
                <p className="text-muted-foreground">{analysis.brand}</p>
              )}
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                {analysis.category}
              </span>
            </div>
          </div>
        </section>

        {/* eco score */}
        <section className="space-y-4">
          <div className="p-4 rounded-2xl bg-muted/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">eco score</h3>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${scoreColors[scoreLevel]}`}>
                <EcoScoreBadge score={analysis.ecoScore} size="sm" />
                <span className="font-bold">{analysis.ecoScore}/100</span>
              </div>
            </div>

            {/* score breakdown */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'packaging', value: analysis.ecoScoreBreakdown.packaging, icon: Package },
                { label: 'materials', value: analysis.ecoScoreBreakdown.materials, icon: Leaf },
                { label: 'carbon', value: analysis.ecoScoreBreakdown.carbonFootprint, icon: TrendingUp },
                { label: 'water', value: analysis.ecoScoreBreakdown.waterUse, icon: Droplets },
                { label: 'ethics', value: analysis.ecoScoreBreakdown.ethics, icon: Heart },
                { label: 'recyclability', value: analysis.ecoScoreBreakdown.recyclability, icon: Recycle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground flex-1">{label}</span>
                  <span className="text-sm font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* summary */}
        <section className="space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {analysis.summary}
          </p>
        </section>

        {/* concerns */}
        {analysis.concerns.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              environmental concerns
            </h3>
            <ul className="space-y-2">
              {analysis.concerns.map((concern, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-orange-500 mt-1">•</span>
                  {concern}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* positives */}
        {analysis.positives.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              eco-friendly aspects
            </h3>
            <ul className="space-y-2">
              {analysis.positives.map((positive, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-green-500 mt-1">•</span>
                  {positive}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* materials/ingredients */}
        {(analysis.materials.length > 0 || analysis.ingredients.length > 0) && (
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">
              {analysis.ingredients.length > 0 ? 'ingredients' : 'materials'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(analysis.ingredients.length > 0 ? analysis.ingredients : analysis.materials).map(
                (item, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-lg bg-muted text-xs text-muted-foreground"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </section>
        )}

        {/* greener alternatives */}
        <section className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Leaf className="w-4 h-4 text-primary" />
            greener alternatives
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {analysis.alternatives.length} found
            </span>
          </h3>

          <div className="space-y-3">
            {analysis.alternatives.map((alt, i) => (
              <button
                key={i}
                onClick={() => setSelectedAlternative(selectedAlternative === i ? null : i)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedAlternative === i
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-muted/30 hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground">{alt.name}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold">
                        +{Math.max(0, alt.estimatedEcoScore - analysis.ecoScore)} pts
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alt.brand}</p>
                    
                    {/* Price display */}
                    {alt.estimatedPrice && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-600">
                          {formatPrice(alt.estimatedPrice)}
                        </span>
                        <span className="text-xs text-muted-foreground">(est.)</span>
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground mt-2">{alt.reason}</p>

                    {alt.whereToBuy.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {alt.whereToBuy.map((store, j) => (
                          <span
                            key={j}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-xs text-muted-foreground"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {store}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <EcoScoreBadge score={alt.estimatedEcoScore} size="md" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* confirm button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={handleConfirmSwap}
          disabled={selectedAlternative === null}
          className="w-full"
        >
          <Leaf className="w-5 h-5 mr-2" />
          {selectedAlternative !== null
            ? `swap to ${analysis.alternatives[selectedAlternative].name}`
            : 'select an alternative'}
        </Button>
      </div>
    </div>
  );
}
