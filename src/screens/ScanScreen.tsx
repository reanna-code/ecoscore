import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/Button';
import { Scan, Search, X, Zap } from 'lucide-react';
import { CompareResultsScreen } from './CompareResultsScreen';
import { mockProducts, mockAlternatives } from '@/data/mockData';

export function ScanScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scanFailed, setScanFailed] = useState(false);
  const [manualSearch, setManualSearch] = useState('');

  const handleScan = () => {
    setIsScanning(true);
    // simulate scan
    setTimeout(() => {
      setIsScanning(false);
      // 80% chance of success for demo
      if (Math.random() > 0.2) {
        setShowResults(true);
      } else {
        setScanFailed(true);
      }
    }, 1500);
  };

  const handleRetry = () => {
    setScanFailed(false);
    handleScan();
  };

  const handleManualSearch = () => {
    if (manualSearch.trim()) {
      setShowResults(true);
      setScanFailed(false);
    }
  };

  const handleBack = () => {
    setShowResults(false);
    setScanFailed(false);
    setManualSearch('');
  };

  if (showResults) {
    return (
      <CompareResultsScreen
        scannedProduct={mockProducts[0]}
        alternatives={mockAlternatives}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* camera view mockup */}
      <div className="relative flex-1 bg-gradient-to-b from-muted to-background overflow-hidden">
        {/* camera background simulation */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.3)_100%)]" />

        {/* scan frame */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className={cn(
            'relative w-full max-w-[280px] aspect-square rounded-3xl border-4 border-dashed transition-all duration-300',
            isScanning ? 'border-primary animate-pulse-glow' : 'border-primary/50'
          )}>
            {/* corner accents */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-xl" />

            {/* scanning line animation */}
            {isScanning && (
              <div className="absolute inset-x-4 top-4 h-1 bg-primary/80 rounded-full animate-[scan_1.5s_ease-in-out_infinite]" />
            )}

            {/* center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isScanning ? (
                <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              ) : (
                <div className="text-primary/40">
                  <Scan className="w-12 h-12" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* scan tip */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            hold steady. good lighting helps.
          </p>
        </div>
      </div>

      {/* bottom controls */}
      <div className="bg-background p-6 pb-24 space-y-4">
        {scanFailed ? (
          <div className="space-y-4 animate-slide-up">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <X className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="font-semibold text-foreground">scan failed</h3>
              <p className="text-sm text-muted-foreground">
                couldn't read the barcode. try again or search manually.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRetry} className="flex-1">
                retry scan
              </Button>
              <Button variant="secondary" onClick={() => setScanFailed(false)} className="flex-1">
                search instead
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button
              onClick={handleScan}
              loading={isScanning}
              className="w-full h-14 text-lg"
            >
              <Scan className="w-5 h-5 mr-2" />
              {isScanning ? 'scanning...' : 'scan product'}
            </Button>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="or search by name..."
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 16px; }
          50% { top: calc(100% - 20px); }
        }
      `}</style>
    </div>
  );
}
