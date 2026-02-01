import { useState, useRef } from 'react';
import { Button } from '@/components/Button';
import { Camera, Upload, X, Zap, Image as ImageIcon, Plus, Trash2, Loader2, Link, ArrowRight } from 'lucide-react';
import { AnalysisResultsScreen } from './AnalysisResultsScreen';
import { analyzeProductWithGemini, analyzeProductFromUrl, fileToBase64, GeminiAnalysisResult } from '@/services/geminiService';

// API key from environment variable
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

type InputMode = 'image' | 'url';

export function ScanScreen() {
  const [inputMode, setInputMode] = useState<InputMode>('image');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [productUrl, setProductUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    for (let i = 0; i < files.length && capturedImages.length + newImages.length < 4; i++) {
      const base64 = await fileToBase64(files[i]);
      newImages.push(base64);
    }
    setCapturedImages([...capturedImages, ...newImages]);
    setError(null);
    
    // Reset input
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setCapturedImages(capturedImages.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (inputMode === 'image' && capturedImages.length === 0) {
      setError('Please capture at least one image');
      return;
    }

    if (inputMode === 'url' && !productUrl.trim()) {
      setError('Please enter a product URL');
      return;
    }

    if (inputMode === 'url' && !isValidUrl(productUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    if (!GEMINI_API_KEY) {
      setError('API key not configured. Please add VITE_GEMINI_API_KEY to your .env file and restart the dev server.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      let result: GeminiAnalysisResult;
      if (inputMode === 'url') {
        result = await analyzeProductFromUrl(productUrl.trim(), GEMINI_API_KEY);
      } else {
        result = await analyzeProductWithGemini(capturedImages, GEMINI_API_KEY);
      }
      setAnalysisResult(result);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze product. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleBack = () => {
    setAnalysisResult(null);
  };

  const handleScanAgain = () => {
    setAnalysisResult(null);
    setCapturedImages([]);
    setProductUrl('');
    setError(null);
  };

  const handleModeSwitch = (mode: InputMode) => {
    setInputMode(mode);
    setError(null);
  };

  // Show results screen if we have analysis
  if (analysisResult) {
    return (
      <AnalysisResultsScreen
        analysis={analysisResult}
        capturedImages={capturedImages}
        onBack={handleBack}
        onScanAgain={handleScanAgain}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mode toggle tabs */}
      <div className="bg-muted/50 p-2 mx-4 mt-4 rounded-xl">
        <div className="flex gap-2">
          <button
            onClick={() => handleModeSwitch('image')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              inputMode === 'image'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            image
          </button>
          <button
            onClick={() => handleModeSwitch('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              inputMode === 'url'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Link className="w-4 h-4" />
            product url
          </button>
        </div>
      </div>

      {/* header area with captured images preview */}
      <div className="relative flex-1 bg-gradient-to-b from-muted to-background overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.3)_100%)]" />

        {/* content area - changes based on mode */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          {inputMode === 'url' ? (
            /* URL input mode */
            <div className="w-full max-w-sm space-y-6">
              <div className="text-center space-y-2">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Link className="w-10 h-10 text-primary" />
                </div>
                <h2 className="font-semibold text-lg text-foreground">
                  paste product url
                </h2>
                <p className="text-sm text-muted-foreground">
                  enter the URL of any product page from Amazon, Walmart, Target, or any online store
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="url"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    placeholder="https://www.amazon.com/product..."
                    className="w-full px-4 py-4 pr-12 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {productUrl && (
                    <button
                      onClick={() => setProductUrl('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                
                {productUrl && isValidUrl(productUrl) && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    valid url detected
                  </div>
                )}
              </div>
            </div>
          ) : capturedImages.length === 0 ? (
            /* Image mode - empty state */
            <div className="text-center space-y-6">
              <div className="w-32 h-32 rounded-3xl border-4 border-dashed border-primary/50 flex items-center justify-center mx-auto">
                <ImageIcon className="w-12 h-12 text-primary/40" />
              </div>
              <div className="space-y-2">
                <h2 className="font-semibold text-lg text-foreground">
                  capture product images
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  take photos of the product tag, ingredient label, packaging, or barcode
                </p>
              </div>
            </div>
          ) : (
            /* Image mode - has images */
            <div className="w-full max-w-sm space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {capturedImages.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                    <img
                      src={img}
                      alt={`Captured ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs">
                      {i + 1}
                    </span>
                  </div>
                ))}
                {capturedImages.length < 4 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-primary/50 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Plus className="w-8 h-8 text-primary/50" />
                    <span className="text-xs text-muted-foreground">add more</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {capturedImages.length}/4 images captured
              </p>
            </div>
          )}
        </div>

        {/* tips */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            {inputMode === 'url' 
              ? 'paste any product page url to analyze'
              : 'good lighting helps. capture labels clearly.'}
          </p>
        </div>
      </div>

      {/* hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* bottom controls */}
      <div className="bg-background p-6 pb-32 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {inputMode === 'url' ? (
          /* URL mode controls */
          <Button
            onClick={handleAnalyze}
            disabled={!productUrl.trim() || isAnalyzing}
            className="w-full h-14 text-lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                analyzing product...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5 mr-2" />
                find greener alternatives
              </>
            )}
          </Button>
        ) : capturedImages.length === 0 ? (
          /* Image mode - no images */
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 h-14"
            >
              <Upload className="w-5 h-5 mr-2" />
              upload
            </Button>
            <Button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 h-14"
            >
              <Camera className="w-5 h-5 mr-2" />
              camera
            </Button>
          </div>
        ) : (
          /* Image mode - has images */
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1"
                disabled={capturedImages.length >= 4}
              >
                <Camera className="w-5 h-5 mr-2" />
                add photo
              </Button>
              <Button
                variant="secondary"
                onClick={handleScanAgain}
                className="px-4"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full h-14 text-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  analyzing with ai...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  analyze product
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
