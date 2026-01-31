import { cn } from '@/lib/utils';

interface MascotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mood?: 'happy' | 'excited' | 'waving' | 'thinking';
  animate?: boolean;
  className?: string;
}

export function Mascot({ size = 'md', mood = 'happy', animate = true, className }: MascotProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  const getMascotEmoji = () => {
    switch (mood) {
      case 'excited':
        return '🌍✨';
      case 'waving':
        return '🌎👋';
      case 'thinking':
        return '🌏💭';
      default:
        return '🌍';
    }
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        sizeClasses[size],
        animate && 'animate-float',
        className
      )}
    >
      {/* planet body */}
      <div className="relative">
        <span className={cn(
          'block',
          size === 'sm' && 'text-3xl',
          size === 'md' && 'text-5xl',
          size === 'lg' && 'text-7xl',
          size === 'xl' && 'text-8xl',
        )}>
          {getMascotEmoji()}
        </span>
        
        {/* leaf sprout */}
        <div className={cn(
          'absolute -top-1 left-1/2 -translate-x-1/2',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-lg',
          size === 'lg' && 'text-2xl',
          size === 'xl' && 'text-3xl',
        )}>
          🌱
        </div>
        
        {/* sparkle effects for excited mood */}
        {mood === 'excited' && (
          <>
            <span className="absolute -top-2 -right-2 text-xs animate-pulse">✨</span>
            <span className="absolute -bottom-1 -left-2 text-xs animate-pulse delay-100">✨</span>
          </>
        )}
      </div>
    </div>
  );
}

interface MascotMessageProps {
  message: string;
  mascotMood?: 'happy' | 'excited' | 'waving' | 'thinking';
  className?: string;
}

export function MascotMessage({ message, mascotMood = 'happy', className }: MascotMessageProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Mascot size="sm" mood={mascotMood} />
      <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-2 max-w-[200px]">
        <p className="text-sm text-secondary-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}
