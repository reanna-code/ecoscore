import { useState } from 'react';
import { Button } from '@/components/Button';
import { EcoScoreBadge } from '@/components/EcoScoreBadge';
import { Mascot } from '@/components/Mascot';
import { useAuth } from '@/contexts/AuthContext';
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
  BadgeCheck,
  ShoppingBag,
  Truck,
  Factory,
  Scale,
  FlaskConical,
  TreePine,
  Eye,
  Award,
  ChevronDown,
  ChevronUp,
  Info,
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

// Helper to get score color
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-emerald-500';
  if (score >= 40) return 'text-yellow-500';
  if (score >= 20) return 'text-orange-500';
  return 'text-red-500';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-emerald-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

export function AnalysisResultsScreen({
  analysis,
  capturedImages,
  onBack,
  onScanAgain,
}: AnalysisResultsScreenProps) {
  const { addPoints } = useAuth();
  const [selectedAlternative, setSelectedAlternative] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showDeclined, setShowDeclined] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleConfirmSwap = async () => {
    if (selectedAlternative === null) return;
    const alt = analysis.alternatives[selectedAlternative];
    const points = calculatePoints(analysis.ecoScore, alt.estimatedEcoScore);
    setEarnedPoints(points);
    
    // Add points to user's balance
    await addPoints(points, `Swapped to ${alt.name} by ${alt.brand}`);
    
    setShowCelebration(true);
  };

  const handleDeclineAll = () => {
    setShowDeclined(true);
  };

  const scoreLevel = getEcoScoreLevel(analysis.ecoScore);
  const scoreColors = {
    excellent: 'text-green-500 bg-green-500/10',
    good: 'text-emerald-500 bg-emerald-500/10',
    moderate: 'text-yellow-500 bg-yellow-500/10',
    poor: 'text-orange-500 bg-orange-500/10',
    bad: 'text-red-500 bg-red-500/10',
  };

  // Show declined screen with sad mascot
  if (showDeclined) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-sm text-center space-y-8 animate-slide-up relative" style={{ zIndex: 20 }}>
          <Mascot size="xl" mood="sad" />

          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground">maybe next time</h1>
            <p className="text-muted-foreground">
              no worries! every small step counts. we'll find more eco-friendly options for you in the future.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDeclined(false)} className="flex-1">
              go back
            </Button>
            <Button onClick={onScanAgain} className="flex-1">
              scan again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show celebration screen when user chooses a greener alternative
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

        {/* Detailed EcoScore Breakdown */}
        {analysis.detailedBreakdown && (
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              how we calculated your score
            </h3>
            
            <div className="space-y-2">
              {/* Packaging & Recyclability */}
              <div className="rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === 'packaging' ? null : 'packaging')}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Package className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-foreground">Packaging & Recyclability</h4>
                      <p className="text-xs text-muted-foreground">Weight: 25%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-2 rounded-full bg-muted overflow-hidden`}>
                        <div 
                          className={`h-full ${getScoreBgColor(analysis.detailedBreakdown.packaging.score)}`}
                          style={{ width: `${analysis.detailedBreakdown.packaging.score}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold ${getScoreColor(analysis.detailedBreakdown.packaging.score)}`}>
                        {analysis.detailedBreakdown.packaging.score}
                      </span>
                    </div>
                    {expandedCategory === 'packaging' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {expandedCategory === 'packaging' && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Recycle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Recyclability</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${getScoreColor(analysis.detailedBreakdown.packaging.recyclability.score)}`}>
                          {analysis.detailedBreakdown.packaging.recyclability.score}/100
                        </span>
                        <p className="text-xs text-muted-foreground">{analysis.detailedBreakdown.packaging.recyclability.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Material Type</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${getScoreColor(analysis.detailedBreakdown.packaging.materialType.score)}`}>
                          {analysis.detailedBreakdown.packaging.materialType.score}/100
                        </span>
                        <p className="text-xs text-muted-foreground">{analysis.detailedBreakdown.packaging.materialType.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Weight Efficiency</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${getScoreColor(analysis.detailedBreakdown.packaging.weightEfficiency.score)}`}>
                          {analysis.detailedBreakdown.packaging.weightEfficiency.score}/100
                        </span>
                        <p className="text-xs text-muted-foreground">{analysis.detailedBreakdown.packaging.weightEfficiency.label}</p>
                      </div>
                    </div>
                    <div className="mt-2 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                      <strong>Formula:</strong> S = 0.5×R + 0.3×M + 0.2×W
                    </div>
                  </div>
                )}
              </div>

              {/* Materials / Ingredients */}
              <div className="rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === 'materials' ? null : 'materials')}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <FlaskConical className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-foreground">Materials & Ingredients</h4>
                      <p className="text-xs text-muted-foreground">Weight: 25%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-2 rounded-full bg-muted overflow-hidden`}>
                        <div 
                          className={`h-full ${getScoreBgColor(analysis.detailedBreakdown.materials.score)}`}
                          style={{ width: `${analysis.detailedBreakdown.materials.score}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold ${getScoreColor(analysis.detailedBreakdown.materials.score)}`}>
                        {analysis.detailedBreakdown.materials.score}
                      </span>
                    </div>
                    {expandedCategory === 'materials' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {expandedCategory === 'materials' && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Harmful Ingredients</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${getScoreColor(analysis.detailedBreakdown.materials.harmfulIngredients.score)}`}>
                          {analysis.detailedBreakdown.materials.harmfulIngredients.score}/100
                        </span>
                        <p className="text-xs text-muted-foreground">{analysis.detailedBreakdown.materials.harmfulIngredients.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <TreePine className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Renewable Sourcing</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${getScoreColor(analysis.detailedBreakdown.materials.renewableSourcing.score)}`}>
                          {analysis.detailedBreakdown.materials.renewableSourcing.score}/100
                        </span>
                        <p className="text-xs text-muted-foreground">{analysis.detailedBreakdown.materials.renewableSourcing.label}</p>
                      </div>
                    </div>
                    <div className="mt-2 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                      <strong>Formula:</strong> S = 0.6×H + 0.4×R
                    </div>
                  </div>
                )}
              </div>

              {/* Carbon Footprint */}
              <div className="rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === 'carbon' ? null : 'carbon')}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Factory className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-foreground">Carbon Footprint & Transport</h4>
                      <p className="text-xs text-muted-foreground">Weight: 20%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-2 rounded-full bg-muted overflow-hidden`}>
                        <div 
                          className={`h-full ${getScoreBgColor(analysis.detailedBreakdown.carbon.score)}`}
                          style={{ width: `${analysis.detailedBreakdown.carbon.score}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold ${getScoreColor(analysis.detailedBreakdown.carbon.score)}`}>
                        {analysis.detailedBreakdown.carbon.score}
                      </span>
                    </div>
                    {expandedCategory === 'carbon' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {expandedCategory === 'carbon' && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Factory className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Emissions</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${getScoreColor(100 - analysis.detailedBreakdown.carbon.emissions.score)}`}>
                          {analysis.detailedBreakdown.carbon.emissions.score} penalty
                        </span>
                        <p className="text-xs text-muted-foreground">{analysis.detailedBreakdown.carbon.emissions.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Transport</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${getScoreColor(100 - analysis.detailedBreakdown.carbon.transport.score)}`}>
                          {analysis.detailedBreakdown.carbon.transport.score} penalty
                        </span>
                        <p className="text-xs text-muted-foreground">{analysis.detailedBreakdown.carbon.transport.label}</p>
                      </div>
                    </div>
                    <div className="mt-2 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                      <strong>Formula:</strong> S = 100 - min(100, E + T)
                    </div>
                  </div>
                )}
              </div>

              {/* Water Usage */}
              <div className="rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === 'water' ? null : 'water')}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <Droplets className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-foreground">Water Usage</h4>
                      <p className="text-xs text-muted-foreground">Weight: 15%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-2 rounded-full bg-muted overflow-hidden`}>
                        <div 
                          className={`h-full ${getScoreBgColor(analysis.detailedBreakdown.water.score)}`}
                          style={{ width: `${analysis.detailedBreakdown.water.score}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold ${getScoreColor(analysis.detailedBreakdown.water.score)}`}>
                        {analysis.detailedBreakdown.water.score}
                      </span>
                    </div>
                    {expandedCategory === 'water' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {expandedCategory === 'water' && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Industry Intensity</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${getScoreColor(100 - analysis.detailedBreakdown.water.industryIntensity.score)}`}>
                          {analysis.detailedBreakdown.water.industryIntensity.score} usage
                        </span>
                        <p className="text-xs text-muted-foreground">{analysis.detailedBreakdown.water.industryIntensity.label}</p>
                      </div>
                    </div>
                    <div className="mt-2 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                      <strong>Formula:</strong> S = 100 - W_u
                    </div>
                  </div>
                )}
              </div>

              {/* Ethics & Transparency */}
              <div className="rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === 'ethics' ? null : 'ethics')}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Heart className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-foreground">Ethics & Transparency</h4>
                      <p className="text-xs text-muted-foreground">Weight: 15%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-2 rounded-full bg-muted overflow-hidden`}>
                        <div 
                          className={`h-full ${getScoreBgColor(analysis.detailedBreakdown.ethics.score)}`}
                          style={{ width: `${analysis.detailedBreakdown.ethics.score}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold ${getScoreColor(analysis.detailedBreakdown.ethics.score)}`}>
                        {analysis.detailedBreakdown.ethics.score}
                      </span>
                    </div>
                    {expandedCategory === 'ethics' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {expandedCategory === 'ethics' && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Certifications</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${getScoreColor(analysis.detailedBreakdown.ethics.certifications.score)}`}>
                          {analysis.detailedBreakdown.ethics.certifications.score}/100
                        </span>
                        <p className="text-xs text-muted-foreground">{analysis.detailedBreakdown.ethics.certifications.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Transparency</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${getScoreColor(analysis.detailedBreakdown.ethics.transparency.score)}`}>
                          {analysis.detailedBreakdown.ethics.transparency.score}/100
                        </span>
                        <p className="text-xs text-muted-foreground">{analysis.detailedBreakdown.ethics.transparency.label}</p>
                      </div>
                    </div>
                    <div className="mt-2 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                      <strong>Formula:</strong> S = 0.5×C + 0.5×T
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Final formula */}
            <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs text-center text-muted-foreground">
                <strong className="text-foreground">Final EcoScore</strong> = 0.25×Packaging + 0.25×Materials + 0.20×Carbon + 0.15×Water + 0.15×Ethics
              </p>
            </div>
          </section>
        )}

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

          {/* Partner alternatives section */}
          {analysis.alternatives.some(alt => alt.isPartner) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BadgeCheck className="w-4 h-4 text-blue-500" />
              <span>Partner brands shown first</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Sort alternatives: partners first, then others */}
            {[...analysis.alternatives]
              .sort((a, b) => (b.isPartner ? 1 : 0) - (a.isPartner ? 1 : 0))
              .map((alt, i) => (
              <div
                key={i}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedAlternative === analysis.alternatives.indexOf(alt)
                    ? 'border-primary bg-primary/5'
                    : alt.isPartner
                    ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30'
                    : 'border-border bg-muted/30'
                }`}
              >
                {/* Partner badge */}
                {alt.isPartner && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <BadgeCheck className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      Partner Brand
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => setSelectedAlternative(
                    selectedAlternative === analysis.alternatives.indexOf(alt) 
                      ? null 
                      : analysis.alternatives.indexOf(alt)
                  )}
                  className="w-full text-left"
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

                {/* Shop Now button - uses searchUrl for reliable Google Shopping search */}
                {(alt.searchUrl || alt.productUrl) && (
                  <a
                    href={alt.searchUrl || alt.productUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Shop Now
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* action buttons */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent space-y-2">
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
        
        <Button
          variant="ghost"
          onClick={handleDeclineAll}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          keep original product
        </Button>
      </div>
    </div>
  );
}
