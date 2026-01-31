import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Mascot } from '@/components/Mascot';
import { Button } from '@/components/Button';
import { Scan, Gift, Heart, Bell } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Scan,
    title: 'scan items while you shop',
    description: 'quickly see how eco-friendly a product is and make smarter choices on the spot',
    mascotMood: 'waving' as const,
  },
  {
    icon: Gift,
    title: 'swap smarter, earn rewards',
    description: 'get real alternatives and earn points and badges for choosing greener options',
    mascotMood: 'excited' as const,
  },
  {
    icon: Heart,
    title: 'turn points into impact',
    description: 'donate to climate and sustainability organizations and track your contribution',
    mascotMood: 'happy' as const,
  },
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotificationAsk, setShowNotificationAsk] = useState(false);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setShowNotificationAsk(true);
    }
  };

  const handleNotificationChoice = () => {
    onComplete();
  };

  // Welcome/splash screen
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-8">
          {/* Logo placeholder */}
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-3xl bg-gradient-nature flex items-center justify-center shadow-elevated">
              <span className="text-6xl font-bold text-white">e</span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">welcome to ecoscore</h1>
            <p className="text-muted-foreground">
              make smarter, greener choices. one scan at a time.
            </p>
          </div>

          <Button onClick={() => setShowWelcome(false)} className="w-full">
            let's go
          </Button>
        </div>
      </div>
    );
  }

  if (showNotificationAsk) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-8">
          <Mascot size="xl" mood="thinking" />

          <div className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">stay on track</h1>
            <p className="text-muted-foreground">
              want reminders to keep your streak alive? we'll nudge you about challenges too.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={handleNotificationChoice} className="w-full">
              enable notifications
            </Button>
            <Button variant="ghost" onClick={handleNotificationChoice} className="w-full">
              maybe later
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* skip button */}
      <div className="p-4 flex justify-end">
        <button
          onClick={onComplete}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          skip
        </button>
      </div>

      {/* content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-8">
          <Mascot size="xl" mood={slide.mascotMood} />

          <div className="space-y-3 animate-fade-in" key={currentSlide}>
            <div className="w-16 h-16 rounded-2xl gradient-nature flex items-center justify-center mx-auto">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{slide.title}</h1>
            <p className="text-muted-foreground">{slide.description}</p>
          </div>
        </div>
      </div>

      {/* pagination and button */}
      <div className="p-6 space-y-6">
        {/* dots */}
        <div className="flex items-center justify-center gap-2">
          {/* Welcome dot (always inactive since we're past it) */}
          <div className="w-2 h-2 rounded-full bg-primary opacity-50" />
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                i === currentSlide ? 'w-6 bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>

        <Button onClick={handleNext} className="w-full">
          {currentSlide === slides.length - 1 ? 'get started' : 'next'}
        </Button>
      </div>
    </div>
  );
}
