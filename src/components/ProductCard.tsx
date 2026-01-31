import { cn } from '@/lib/utils';
import { EcoScoreBadge } from './EcoScoreBadge';
import { Product, Alternative } from '@/types/ecoscore';
import { MapPin, Leaf, Award } from 'lucide-react';

interface ProductCardProps {
  product: Product | Alternative;
  variant?: 'scanned' | 'alternative';
  onSelect?: () => void;
  selected?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  variant = 'alternative',
  onSelect,
  selected,
  className,
}: ProductCardProps) {
  const isAlternative = 'reasonTags' in product;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left p-4 rounded-2xl transition-all duration-200 border-2',
        variant === 'scanned'
          ? 'bg-card border-border'
          : 'bg-background border-transparent hover:border-primary/30',
        selected && 'border-primary shadow-glow',
        onSelect && 'cursor-pointer active:scale-[0.98]',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* product image placeholder */}
        <div className={cn(
          'w-16 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0',
          variant === 'scanned' ? 'bg-muted' : 'bg-secondary'
        )}>
          {product.category === 'snacks' ? '🍿' : '🧴'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.brand}</p>
            </div>
            <EcoScoreBadge score={product.ecoScore} size="sm" />
          </div>

          {/* tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {product.isLocal && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                <MapPin className="w-3 h-3" />
                local
              </span>
            )}
            {product.certifications.slice(0, 2).map((cert) => (
              <span
                key={cert}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium"
              >
                <Award className="w-3 h-3" />
                {cert}
              </span>
            ))}
          </div>

          {/* reason tags for alternatives */}
          {isAlternative && (
            <div className="mt-2 space-y-1">
              {(product as Alternative).reasonTags.map((reason, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Leaf className="w-3 h-3 text-primary" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* points preview */}
          {isAlternative && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
              <span className="text-xs font-semibold text-primary">
                +{(product as Alternative).pointsPreview} points
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
