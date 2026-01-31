import { ChallengeCard } from '@/components/ChallengeCard';
import { categories, mockChallenges, ecoTips } from '@/data/mockData';
import { ChevronRight, Lightbulb, TrendingUp } from 'lucide-react';

export function DiscoverScreen() {
  const weeklyChallenge = mockChallenges[0];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border p-4">
        <h1 className="text-xl font-bold">discover</h1>
      </header>

      <div className="p-4 space-y-6">
        {/* weekly challenge */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              this week's challenge
            </h2>
          </div>
          <ChallengeCard challenge={weeklyChallenge} />
        </section>

        {/* categories */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">browse by category</h2>
            <button className="text-sm text-primary font-medium flex items-center gap-1">
              see all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card hover:bg-secondary transition-colors"
              >
                <span className="text-2xl">{category.icon}</span>
                <span className="text-sm font-medium text-foreground">{category.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* all challenges */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">active challenges</h2>
            <span className="text-sm text-muted-foreground">{mockChallenges.length} active</span>
          </div>

          <div className="space-y-3">
            {mockChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </section>

        {/* tips */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-accent" />
              eco tips
            </h2>
          </div>

          <div className="space-y-2">
            {ecoTips.map((tip) => (
              <button
                key={tip.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-secondary transition-colors text-left"
              >
                <span className="text-xl">{tip.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{tip.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
