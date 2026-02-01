import { createPortal } from 'react-dom';
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

// Pollution background component for sad mood - covers entire viewport
// Uses portal to render at body level, bypassing any container clipping
function PollutionBackground() {
  const content = (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-400/40 via-gray-300/30 to-gray-400/50" />
      
      {/* Clouds - scattered across the screen */}
      <div className="absolute top-[5%] left-[5%] opacity-60 animate-pulse">
        <svg width="120" height="60" viewBox="0 0 120 60">
          <ellipse cx="40" cy="35" rx="35" ry="18" fill="hsl(0, 0%, 55%)" />
          <ellipse cx="70" cy="28" rx="30" ry="15" fill="hsl(0, 0%, 50%)" />
          <ellipse cx="25" cy="40" rx="22" ry="12" fill="hsl(0, 0%, 52%)" />
          <ellipse cx="90" cy="35" rx="25" ry="14" fill="hsl(0, 0%, 48%)" />
        </svg>
      </div>
      
      <div className="absolute top-[8%] right-[10%] opacity-50">
        <svg width="150" height="70" viewBox="0 0 150 70">
          <ellipse cx="50" cy="40" rx="40" ry="20" fill="hsl(0, 0%, 52%)" />
          <ellipse cx="90" cy="32" rx="35" ry="17" fill="hsl(0, 0%, 48%)" />
          <ellipse cx="30" cy="45" rx="28" ry="14" fill="hsl(0, 0%, 55%)" />
          <ellipse cx="120" cy="38" rx="25" ry="13" fill="hsl(0, 0%, 50%)" />
        </svg>
      </div>
      
      <div className="absolute top-[3%] left-[40%] opacity-55">
        <svg width="100" height="50" viewBox="0 0 100 50">
          <ellipse cx="35" cy="28" rx="30" ry="15" fill="hsl(0, 0%, 58%)" />
          <ellipse cx="65" cy="22" rx="25" ry="12" fill="hsl(0, 0%, 53%)" />
          <ellipse cx="20" cy="32" rx="18" ry="10" fill="hsl(0, 0%, 56%)" />
        </svg>
      </div>
      
      <div className="absolute top-[12%] left-[70%] opacity-45">
        <svg width="90" height="45" viewBox="0 0 90 45">
          <ellipse cx="30" cy="25" rx="25" ry="13" fill="hsl(0, 0%, 50%)" />
          <ellipse cx="55" cy="20" rx="22" ry="11" fill="hsl(0, 0%, 55%)" />
          <ellipse cx="75" cy="28" rx="18" ry="10" fill="hsl(0, 0%, 52%)" />
        </svg>
      </div>
      
      {/* Left factory */}
      <div className="absolute bottom-0 left-[2%]">
        <svg width="140" height="220" viewBox="0 0 140 220">
          {/* Main building */}
          <rect x="10" y="100" width="80" height="120" fill="hsl(0, 0%, 22%)" />
          <rect x="25" y="60" width="30" height="40" fill="hsl(0, 0%, 28%)" />
          {/* Smokestack */}
          <rect x="32" y="20" width="16" height="40" fill="hsl(0, 0%, 25%)" />
          {/* Windows */}
          <rect x="25" y="120" width="15" height="20" fill="hsl(45, 80%, 50%)" opacity="0.6" />
          <rect x="50" y="120" width="15" height="20" fill="hsl(45, 80%, 50%)" opacity="0.4" />
          <rect x="25" y="160" width="15" height="20" fill="hsl(45, 80%, 50%)" opacity="0.3" />
          <rect x="50" y="160" width="15" height="20" fill="hsl(45, 80%, 50%)" opacity="0.5" />
          {/* Second smokestack */}
          <rect x="100" y="80" width="25" height="140" fill="hsl(0, 0%, 20%)" />
          <rect x="103" y="50" width="12" height="30" fill="hsl(0, 0%, 26%)" />
          
          {/* Smoke puffs - animated */}
          <g className="animate-smoke-rise">
            <ellipse cx="40" cy="10" rx="18" ry="10" fill="hsl(0, 0%, 45%)" opacity="0.6" />
            <ellipse cx="50" cy="0" rx="14" ry="8" fill="hsl(0, 0%, 50%)" opacity="0.5" />
            <ellipse cx="35" cy="-15" rx="20" ry="11" fill="hsl(0, 0%, 42%)" opacity="0.4" />
          </g>
          <g className="animate-smoke-rise-delayed">
            <ellipse cx="109" cy="40" rx="15" ry="8" fill="hsl(0, 0%, 48%)" opacity="0.5" />
            <ellipse cx="115" cy="25" rx="18" ry="10" fill="hsl(0, 0%, 45%)" opacity="0.4" />
            <ellipse cx="105" cy="10" rx="22" ry="12" fill="hsl(0, 0%, 40%)" opacity="0.3" />
          </g>
        </svg>
      </div>
      
      {/* Right factory */}
      <div className="absolute bottom-0 right-[3%]">
        <svg width="160" height="200" viewBox="0 0 160 200">
          {/* Main building */}
          <rect x="40" y="80" width="100" height="120" fill="hsl(0, 0%, 20%)" />
          <rect x="60" y="50" width="35" height="30" fill="hsl(0, 0%, 26%)" />
          {/* Smokestack */}
          <rect x="70" y="10" width="18" height="40" fill="hsl(0, 0%, 23%)" />
          {/* Windows */}
          <rect x="55" y="100" width="18" height="25" fill="hsl(45, 80%, 50%)" opacity="0.5" />
          <rect x="85" y="100" width="18" height="25" fill="hsl(45, 80%, 50%)" opacity="0.3" />
          <rect x="115" y="100" width="18" height="25" fill="hsl(45, 80%, 50%)" opacity="0.6" />
          <rect x="55" y="145" width="18" height="25" fill="hsl(45, 80%, 50%)" opacity="0.4" />
          <rect x="85" y="145" width="18" height="25" fill="hsl(45, 80%, 50%)" opacity="0.7" />
          <rect x="115" y="145" width="18" height="25" fill="hsl(45, 80%, 50%)" opacity="0.3" />
          {/* Extra tower */}
          <rect x="0" y="120" width="35" height="80" fill="hsl(0, 0%, 24%)" />
          <rect x="8" y="90" width="14" height="30" fill="hsl(0, 0%, 28%)" />
          
          {/* Smoke puffs */}
          <g className="animate-smoke-rise">
            <ellipse cx="79" cy="0" rx="20" ry="11" fill="hsl(0, 0%, 42%)" opacity="0.6" />
            <ellipse cx="85" cy="-15" rx="16" ry="9" fill="hsl(0, 0%, 48%)" opacity="0.5" />
            <ellipse cx="75" cy="-30" rx="24" ry="13" fill="hsl(0, 0%, 40%)" opacity="0.35" />
          </g>
          <g className="animate-smoke-rise-delayed">
            <ellipse cx="15" cy="80" rx="12" ry="7" fill="hsl(0, 0%, 50%)" opacity="0.5" />
            <ellipse cx="18" cy="65" rx="16" ry="9" fill="hsl(0, 0%, 45%)" opacity="0.4" />
            <ellipse cx="12" cy="50" rx="20" ry="11" fill="hsl(0, 0%, 42%)" opacity="0.3" />
          </g>
        </svg>
      </div>
      
      {/* Middle background factory (smaller/farther) */}
      <div className="absolute bottom-0 left-[35%] opacity-40">
        <svg width="100" height="140" viewBox="0 0 100 140">
          <rect x="20" y="60" width="60" height="80" fill="hsl(0, 0%, 28%)" />
          <rect x="35" y="35" width="20" height="25" fill="hsl(0, 0%, 32%)" />
          <rect x="40" y="10" width="10" height="25" fill="hsl(0, 0%, 30%)" />
          <g className="animate-smoke-rise">
            <ellipse cx="45" cy="0" rx="12" ry="7" fill="hsl(0, 0%, 50%)" opacity="0.5" />
            <ellipse cx="48" cy="-12" rx="15" ry="8" fill="hsl(0, 0%, 45%)" opacity="0.4" />
          </g>
        </svg>
      </div>
      
      {/* Another distant factory */}
      <div className="absolute bottom-0 right-[30%] opacity-35">
        <svg width="80" height="120" viewBox="0 0 80 120">
          <rect x="15" y="50" width="50" height="70" fill="hsl(0, 0%, 30%)" />
          <rect x="25" y="30" width="18" height="20" fill="hsl(0, 0%, 34%)" />
          <rect x="30" y="8" width="8" height="22" fill="hsl(0, 0%, 32%)" />
          <g className="animate-smoke-rise-delayed">
            <ellipse cx="34" cy="0" rx="10" ry="6" fill="hsl(0, 0%, 52%)" opacity="0.5" />
            <ellipse cx="36" cy="-10" rx="13" ry="7" fill="hsl(0, 0%, 48%)" opacity="0.4" />
          </g>
        </svg>
      </div>
      
      {/* Floating smoke particles across screen */}
      <div className="absolute top-[20%] left-[15%] opacity-30 animate-float-slow">
        <svg width="60" height="40" viewBox="0 0 60 40">
          <ellipse cx="30" cy="20" rx="25" ry="15" fill="hsl(0, 0%, 50%)" />
        </svg>
      </div>
      <div className="absolute top-[25%] right-[20%] opacity-25 animate-float-slow-delayed">
        <svg width="80" height="50" viewBox="0 0 80 50">
          <ellipse cx="40" cy="25" rx="35" ry="20" fill="hsl(0, 0%, 48%)" />
        </svg>
      </div>
      <div className="absolute top-[35%] left-[50%] opacity-20 animate-float-slow">
        <svg width="70" height="45" viewBox="0 0 70 45">
          <ellipse cx="35" cy="22" rx="30" ry="18" fill="hsl(0, 0%, 52%)" />
        </svg>
      </div>
      
      {/* Polluted ground */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-stone-600/60 to-transparent" />
    </div>
  );
  
  // Use portal to render at document body level, bypassing any container clipping
  return createPortal(content, document.body);
}

export function Mascot({ size = 'md', mood = 'happy', animate = true, className }: MascotProps) {
  const px = sizeMap[size];

  return (
    <>
      {/* Render pollution background when sad - covers entire viewport */}
      {mood === 'sad' && <PollutionBackground />}
      
      <div
        className={cn(
          'inline-flex items-center justify-center flex-shrink-0 relative',
          animate && mood === 'excited' && 'animate-mascot-jump',
          animate && mood === 'happy' && 'animate-float',
          animate && mood === 'waving' && 'animate-float',
          animate && mood === 'thinking' && 'animate-float',
          animate && mood === 'sad' && '',
          className
        )}
        style={{ width: px, height: px, zIndex: 10 }}
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
            <stop offset="0%" stopColor="hsl(50, 35%, 45%)" />
            <stop offset="40%" stopColor="hsl(45, 32%, 38%)" />
            <stop offset="70%" stopColor="hsl(40, 30%, 32%)" />
            <stop offset="100%" stopColor="hsl(35, 28%, 28%)" />
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

        {/* Fake ground shadow for sad mood */}
        {mood === 'sad' && (
          <g>
            <ellipse cx="60" cy="137" rx="35" ry="6" fill="hsl(30, 10%, 45%)" opacity="0.5" />
            <ellipse cx="60" cy="137" rx="28" ry="4" fill="hsl(25, 12%, 40%)" opacity="0.3" />
          </g>
        )}
        
        {/* Green stick legs - drawn FIRST so they appear behind body */}
        <g stroke={mood === 'sad' ? "hsl(60, 30%, 35%)" : "hsl(152, 45%, 28%)"} strokeWidth="3" strokeLinecap="round">
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
          fill={mood === 'sad' ? "url(#leafGradientSad)" : "url(#leafGradient)"}
          stroke={mood === 'sad' ? "hsl(30, 45%, 28%)" : "hsl(152, 45%, 32%)"}
          strokeWidth="2.5"
          filter="url(#leafShadow)"
        />
        
        {/* Wrinkles for sad mood */}
        {mood === 'sad' && (
          <g stroke="hsl(25, 40%, 25%)" strokeWidth="1.5" opacity="0.5" fill="none">
            {/* Horizontal wrinkles */}
            <path d="M32 35 Q40 33 48 35" />
            <path d="M72 35 Q64 33 56 35" />
            <path d="M30 48 Q38 45 46 48" />
            <path d="M78 48 Q70 45 62 48" />
            <path d="M28 58 Q36 55 44 58" />
            <path d="M82 58 Q74 55 66 58" />
            <path d="M32 68 Q40 65 48 68" />
            <path d="M76 68 Q68 65 60 68" />
            <path d="M35 78 Q43 75 51 78" />
            <path d="M73 78 Q65 75 57 78" />
            <path d="M38 88 Q46 85 54 88" />
            <path d="M70 88 Q62 85 54 88" />
            <path d="M42 98 Q50 95 58 98" />
            <path d="M66 98 Q58 95 50 98" />
            {/* Diagonal wrinkles */}
            <path d="M35 42 Q42 45 48 42" />
            <path d="M75 42 Q68 45 62 42" />
            <path d="M38 62 Q45 65 52 62" />
            <path d="M72 62 Q65 65 58 62" />
            <path d="M40 82 Q47 85 54 82" />
            <path d="M68 82 Q61 85 54 82" />
          </g>
        )}
        
        {/* Inner shadow for depth */}
        <path
          d="M60 8 Q74 17 83 31 Q92 49 92 70 Q92 88 83 99 Q74 109 60 115 Q46 109 37 99 Q28 88 28 70 Q28 49 37 31 Q46 17 60 8 Z"
          fill="none"
          stroke={mood === 'sad' ? "hsl(35, 50%, 52%)" : "hsl(152, 55%, 50%)"}
          strokeWidth="1"
          opacity="0.3"
        />
        
        {/* Leaf vein (center line) */}
        <path
          d="M60 8 L60 116"
          stroke={mood === 'sad' ? "hsl(30, 45%, 25%)" : "hsl(152, 45%, 28%)"}
          strokeWidth="2"
          opacity="0.35"
        />
        
        {/* Side veins */}
        <path
          d="M60 35 Q50 45 45 50 M60 50 Q50 58 47 65 M60 65 Q50 72 48 80"
          stroke={mood === 'sad' ? "hsl(30, 45%, 25%)" : "hsl(152, 45%, 28%)"}
          strokeWidth="1.2"
          opacity="0.25"
          fill="none"
        />
        <path
          d="M60 35 Q70 45 75 50 M60 50 Q70 58 73 65 M60 65 Q70 72 72 80"
          stroke={mood === 'sad' ? "hsl(30, 45%, 25%)" : "hsl(152, 45%, 28%)"}
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
          <g stroke="hsl(60, 30%, 35%)" strokeWidth="4" strokeLinecap="round">
            <line x1="26" y1="68" x2="18" y2="95" />
            <line x1="94" y1="68" x2="102" y2="95" />
          </g>
        )}
      </svg>
      </div>
    </>
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
