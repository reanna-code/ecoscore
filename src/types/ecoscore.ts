// ecoscore data models - structured for future api integration

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string;
  barcode?: string;
  ecoScore: number;
  factorBreakdown: EcoFactors;
  isLocal: boolean;
  certifications: string[];
}

export interface EcoFactors {
  packaging: number;
  materials: number;
  carbonFootprint: number;
  waterUse: number;
  ethics: number;
  recyclability: number;
}

export interface Alternative extends Product {
  reasonTags: string[];
  pointsPreview: number;
}

export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  pointsBalance: number;
  personalEcoScore: number;
  streakCount: number;
  badges: Badge[];
  friendIds: string[];
  donationHistory: Donation[];
  scansThisMonth: number;
  swapsThisMonth: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  category: 'streak' | 'swap' | 'local' | 'donation' | 'challenge';
}

export interface Donation {
  id: string;
  organizationId: string;
  pointsSpent: number;
  amountDollars: number;
  date: Date;
  receiptId: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface Organization {
  id: string;
  name: string;
  description: string;
  impactFocus: string;
  imageUrl?: string;
  trustBadges: string[];
  pointsToDonateSuggestions: number[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  rewardPoints: number;
  rewardBadgeId?: string;
  expiresAt: Date;
  category: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  points: number;
  rank: number;
  badges: Badge[];
  ecoScore: number;
}

export type EcoScoreLevel = 'excellent' | 'good' | 'moderate' | 'poor' | 'bad';

export function getEcoScoreLevel(score: number): EcoScoreLevel {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'moderate';
  if (score >= 20) return 'poor';
  return 'bad';
}

export function getEcoScoreColor(score: number): string {
  const level = getEcoScoreLevel(score);
  const colors: Record<EcoScoreLevel, string> = {
    excellent: 'eco-excellent',
    good: 'eco-good',
    moderate: 'eco-moderate',
    poor: 'eco-poor',
    bad: 'eco-bad',
  };
  return colors[level];
}

export function calculatePoints(originalScore: number, chosenScore: number): number {
  const difference = chosenScore - originalScore;
  if (difference <= 0) return 0;
  return Math.round(difference * 1.25);
}
