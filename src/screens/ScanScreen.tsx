import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Camera, Upload, X, Zap, Image as ImageIcon, Plus, Trash2, Loader2, Link, ArrowRight, Mic, MicOff } from 'lucide-react';
import { AnalysisResultsScreen } from './AnalysisResultsScreen';
import { analyzeProductWithGemini, analyzeProductFromUrl, analyzeProductFromText, fileToBase64, GeminiAnalysisResult } from '@/services/geminiService';
import { speakText } from '@/services/elevenLabsService';

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
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);

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

  const handleOpenCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      setShowCamera(true);
      setError(null);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions or use upload instead.');
      // Fallback to file input
      cameraInputRef.current?.click();
    }
  };

  const handleCloseCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0);
    
    // Convert to base64
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    
    // Add to captured images
    setCapturedImages([...capturedImages, base64Image]);
    
    // Close camera if we've reached the limit
    if (capturedImages.length + 1 >= 4) {
      handleCloseCamera();
    }
  };

  // Setup video stream when camera is shown
  useEffect(() => {
    if (showCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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

  const handleUseVoice = async () => {
    const apiKey = import.meta.env.VITE_ELEVEN_LABS_API_KEY;
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      setVoiceError('Eleven Labs API key not found');
      return;
    }
    
    if (!geminiApiKey) {
      setVoiceError('Gemini API key not found');
      return;
    }

    // Check if Speech Recognition is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Speech recognition is not supported in your browser');
      return;
    }

    // Prompt user with voice to describe the product
    try {
      await speakText('Please describe the product. Include details like the product name, brand, materials, and category.', apiKey);
    } catch (error) {
      console.error('Error playing prompt:', error);
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    let transcript = '';

    recognition.onresult = async (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + ' ';
      }
      
      console.log('🎤 Voice transcript:', transcript);
      
      // Stop recording
      setIsRecording(false);
      
      // Analyze the product description
      setIsAnalyzingVoice(true);
      setVoiceError(null);
      setError(null);
      
      try {
        const result = await analyzeProductFromText(transcript.trim(), geminiApiKey);
        
        console.log('✅ Product analyzed from voice:', result);
        
        // Update the analysis result
        setAnalysisResult(result);
      } catch (error) {
        console.error('❌ Error analyzing product from voice:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (errorMessage.includes('product not found') || errorMessage.includes('no alternative found')) {
          setVoiceError('product not found. no alternative found');
          // Also speak the error
          try {
            await speakText('product not found. no alternative found', apiKey);
          } catch (speakError) {
            console.error('Error speaking error message:', speakError);
          }
        } else {
          setVoiceError(errorMessage);
        }
      } finally {
        setIsAnalyzingVoice(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setIsAnalyzingVoice(false);
      setVoiceError(`Speech recognition error: ${event.message || event.error}`);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setVoiceModeActive(false);
    };

    recognitionRef.current = recognition;
    setIsRecording(true);
    setVoiceError(null);
    recognition.start();
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setVoiceModeActive(false);
    }
  };

  const handleModeSwitch = (mode: InputMode) => {
    setInputMode(mode);
    setVoiceModeActive(false);
    setError(null);
  };

  const handleVoiceButtonClick = () => {
    if (isRecording) {
      handleStopRecording();
      setVoiceModeActive(false);
    } else {
      setVoiceModeActive(true);
      setInputMode('image'); // Reset to image mode when using voice
      handleUseVoice();
    }
  };

  // Show camera view
  if (showCamera) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Camera preview */}
        <div className="relative flex-1">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Camera controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={handleCloseCamera}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              >
                <X className="w-5 h-5 mr-2" />
                cancel
              </Button>
              <button
                onClick={handleCapture}
                className="w-20 h-20 rounded-full bg-white border-4 border-white/30 hover:scale-105 transition-transform"
                disabled={capturedImages.length >= 4}
              >
                <Camera className="w-8 h-8 mx-auto text-black" />
              </button>
              <div className="w-24 text-center text-white text-sm">
                {capturedImages.length}/4
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show results screen if we have analysis
  if (analysisResult) {
    return (
      <AnalysisResultsScreen
        analysis={analysisResult}
        capturedImages={capturedImages}
        onBack={handleBack}
        onScanAgain={handleScanAgain}
        onAnalysisUpdate={setAnalysisResult}
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
            disabled={voiceModeActive || isRecording || isAnalyzingVoice}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              inputMode === 'image' && !voiceModeActive
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            } ${voiceModeActive || isRecording || isAnalyzingVoice ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ImageIcon className="w-4 h-4" />
            image
          </button>
          <button
            onClick={() => handleModeSwitch('url')}
            disabled={voiceModeActive || isRecording || isAnalyzingVoice}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              inputMode === 'url' && !voiceModeActive
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            } ${voiceModeActive || isRecording || isAnalyzingVoice ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Link className="w-4 h-4" />
            product url
          </button>
          <button
            onClick={handleVoiceButtonClick}
            disabled={isAnalyzingVoice || (voiceModeActive && !isRecording)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              isRecording
                ? 'bg-red-500 text-white hover:bg-red-600'
                : isAnalyzingVoice
                ? 'bg-white text-foreground shadow-sm'
                : voiceModeActive
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            } ${isAnalyzingVoice ? 'cursor-wait' : (voiceModeActive && !isRecording ? 'opacity-50 cursor-not-allowed' : '')}`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4" />
                Stop
              </>
            ) : isAnalyzingVoice ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Use Voice
              </>
            )}
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
                
                {voiceError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                    {voiceError}
                  </div>
                )}
                {isAnalyzingVoice && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 text-sm text-center">
                    Analyzing product description...
                  </div>
                )}
                
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
              onClick={handleOpenCamera}
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
                onClick={handleOpenCamera}
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
                'analyzing with ai...'
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
