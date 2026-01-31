import { cn } from '@/lib/utils';

export type MascotMood = 'happy' | 'excited' | 'waving' | 'thinking' | 'sad';

interface MascotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mood?: MascotMood;
  animate?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 48,
  md: 80,
  lg: 128,
  xl: 192,
};

export function Mascot({ size = 'md', mood = 'happy', animate = true, className }: MascotProps) {
  const px = sizeMap[size];

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center flex-shrink-0',
        animate && mood === 'excited' && 'animate-mascot-jump',
        animate && mood === 'happy' && 'animate-float',
        animate && mood === 'waving' && 'animate-float',
        animate && mood === 'thinking' && 'animate-float',
        animate && mood === 'sad' && '',
        className
      )}
      style={{ width: px, height: px }}
      aria-hidden
    >
      <svg
        viewBox="0 0 120 140"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(152, 55%, 50%)" />
            <stop offset="40%" stopColor="hsl(152, 48%, 44%)" />
            <stop offset="70%" stopColor="hsl(152, 45%, 40%)" />
            <stop offset="100%" stopColor="hsl(152, 40%, 34%)" />
          </linearGradient>
          <linearGradient id="leafGradientSad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(152, 45%, 42%)" />
            <stop offset="40%" stopColor="hsl(152, 40%, 38%)" />
            <stop offset="70%" stopColor="hsl(152, 38%, 34%)" />
            <stop offset="100%" stopColor="hsl(152, 35%, 30%)" />
          </linearGradient>
          <filter id="leafShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="3" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.4"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="innerShadow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur"/>
            <feOffset in="blur" dx="1" dy="2" result="offsetBlur"/>
            <feFlood floodColor="hsl(152, 50%, 25%)" floodOpacity="0.3" result="color"/>
            <feComposite in="color" in2="offsetBlur" operator="in" result="shadow"/>
            <feComposite in="shadow" in2="SourceGraphic" operator="atop"/>
          </filter>
        </defs>

        {/* Fake ground for sad mood */}
        {mood === 'sad' && (
          <g>
            <ellipse cx="60" cy="137" rx="35" ry="6" fill="hsl(150, 15%, 85%)" opacity="0.5" />
            <ellipse cx="60" cy="137" rx="28" ry="4" fill="hsl(150, 15%, 75%)" opacity="0.3" />
          </g>
        )}
        
        {/* Green stick legs - drawn FIRST so they appear behind body */}
        <g stroke="hsl(152, 45%, 28%)" strokeWidth="3" strokeLinecap="round">
          {mood === 'sad' ? (
            <>
              <line x1="52" y1="115" x2="45" y2="135" />
              <line x1="68" y1="115" x2="75" y2="135" />
            </>
          ) : (
            <>
              <line x1="50" y1="110" x2="40" y2="130" />
              <line x1="70" y1="110" x2="80" y2="130" />
            </>
          )}
        </g>
        
        <g transform={mood === 'sad' ? 'translate(60, 70) scale(1, 0.85) translate(-60, -63)' : ''}>

        {/* Arms – position by mood */}
        <g stroke="hsl(152, 45%, 28%)" strokeWidth="3" strokeLinecap="round">
          {mood === 'excited' && (
            <>
              <line x1="25" y1="55" x2="8" y2="25" />
              <line x1="95" y1="55" x2="112" y2="25" />
            </>
          )}
          {mood === 'waving' && (
            <>
              <line x1="25" y1="55" x2="15" y2="45" />
              <line x1="95" y1="55" x2="105" y2="25" />
            </>
          )}
          {(mood === 'happy' || mood === 'thinking') && (
            <>
              <line x1="25" y1="55" x2="15" y2="75" />
              <line x1="95" y1="55" x2="105" y2="75" />
            </>
          )}
        </g>

        {/* Leaf body - classic leaf shape with pointed top and bottom */}
        <path
          d="M60 5 Q75 15 85 30 Q95 50 95 70 Q95 90 85 102 Q75 112 60 118 Q45 112 35 102 Q25 90 25 70 Q25 50 35 30 Q45 15 60 5 Z"
          fill="url(#leafGradient)"
          stroke="hsl(152, 45%, 32%)"
          strokeWidth="2.5"
          filter="url(#leafShadow)"
        />
        
        {/* Inner shadow for depth */}
        <path
          d="M60 8 Q74 17 83 31 Q92 49 92 70 Q92 88 83 99 Q74 109 60 115 Q46 109 37 99 Q28 88 28 70 Q28 49 37 31 Q46 17 60 8 Z"
          fill="none"
          stroke="hsl(152, 55%, 50%)"
          strokeWidth="1"
          opacity="0.3"
        />
        
        {/* Leaf vein (center line) */}
        <path
          d="M60 8 L60 116"
          stroke="hsl(152, 45%, 28%)"
          strokeWidth="2"
          opacity="0.35"
        />
        
        {/* Side veins */}
        <path
          d="M60 35 Q50 45 45 50 M60 50 Q50 58 47 65 M60 65 Q50 72 48 80"
          stroke="hsl(152, 45%, 28%)"
          strokeWidth="1.2"
          opacity="0.25"
          fill="none"
        />
        <path
          d="M60 35 Q70 45 75 50 M60 50 Q70 58 73 65 M60 65 Q70 72 72 80"
          stroke="hsl(152, 45%, 28%)"
          strokeWidth="1.2"
          opacity="0.25"
          fill="none"
        />

        {/* Face */}
        <g fill="hsl(150, 20%, 18%)" stroke="none">
          {/* Eyes - bigger, derpier */}
          {mood === 'excited' && (
            <>
              {/* Big sparkly eyes */}
              <circle cx="42" cy="50" r="6" />
              <circle cx="78" cy="50" r="6" />
              {/* Eye highlights for sparkle */}
              <circle cx="44" cy="48" r="2.5" fill="white" />
              <circle cx="80" cy="48" r="2.5" fill="white" />
            </>
          )}
          {mood === 'sad' && (
            <>
              {/* Big pleading eyes looking up - like 🥺 */}
              <ellipse cx="42" cy="54" rx="7" ry="8" />
              <ellipse cx="78" cy="54" rx="7" ry="8" />
              {/* Large shiny highlights at top for pleading look */}
              <ellipse cx="42" cy="50" rx="3" ry="3.5" fill="white" />
              <ellipse cx="78" cy="50" rx="3" ry="3.5" fill="white" />
              <circle cx="44" cy="56" r="1.2" fill="white" opacity="0.6" />
              <circle cx="80" cy="56" r="1.2" fill="white" opacity="0.6" />
              {/* Sad eyebrows angled up in middle for pleading */}
              <path d="M34 44 Q42 40 48 42" stroke="hsl(150, 20%, 18%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M72 42 Q78 40 86 44" stroke="hsl(150, 20%, 18%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          )}
          {(mood === 'happy' || mood === 'waving') && (
            <>
              {/* Round derpy eyes slightly off-center */}
              <circle cx="40" cy="50" r="5.5" />
              <circle cx="78" cy="50" r="5.5" />
              {/* Highlights */}
              <circle cx="42" cy="48" r="2" fill="white" />
              <circle cx="80" cy="48" r="2" fill="white" />
            </>
          )}
          {mood === 'thinking' && (
            <>
              {/* One eye bigger than the other for derpy thinking look */}
              <circle cx="40" cy="50" r="6" />
              <circle cx="78" cy="52" r="4.5" />
              {/* Highlights */}
              <circle cx="42" cy="48" r="2" fill="white" />
              <circle cx="80" cy="50" r="1.5" fill="white" />
            </>
          )}
        </g>

        {/* Mouth */}
        {mood === 'excited' && (
          <path d="M48 72 Q60 88 72 72" stroke="hsl(150, 20%, 18%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
        {mood === 'sad' && (
          <path d="M48 80 Q60 72 72 80" stroke="hsl(150, 20%, 18%)" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {(mood === 'happy' || mood === 'waving') && (
          <path d="M46 74 Q60 82 74 74" stroke="hsl(150, 20%, 18%)" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {mood === 'thinking' && (
          <circle cx="60" cy="78" r="3" fill="hsl(150, 20%, 18%)" />
        )}

        {/* Sad: tear drop going straight down */}
        {mood === 'sad' && (
          <ellipse cx="70" cy="64" rx="2.5" ry="4" fill="hsl(200, 60%, 70%)" stroke="none" opacity="0.9">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,10; 0,15"
              dur="1.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;0.8;0"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </ellipse>
        )}

        {/* Blush */}
        {(mood === 'happy' || mood === 'excited' || mood === 'waving') && (
          <>
            <ellipse cx="32" cy="68" rx="6" ry="3" fill="hsl(0, 60%, 85%)" opacity={0.8} />
            <ellipse cx="88" cy="68" rx="6" ry="3" fill="hsl(0, 60%, 85%)" opacity={0.8} />
          </>
        )}
        
        </g>
        
        {/* Sad arms on sides - no hands */}
        {mood === 'sad' && (
          <g stroke="hsl(152, 45%, 28%)" strokeWidth="4" strokeLinecap="round">
            <line x1="26" y1="68" x2="18" y2="95" />
            <line x1="94" y1="68" x2="102" y2="95" />
          </g>
        )}
      </svg>
    </div>
  );
}

interface MascotMessageProps {
  message: string;
  mascotMood?: MascotMood;
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
