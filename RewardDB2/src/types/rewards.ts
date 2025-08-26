// Types for the rewards system
export interface RewardRecord {
  id: string;
  title: string;
  description: string;
  level: number;
  category: string;
  campus: string;
  pointsCost: number;
  stock?: number;
  imageUrl?: string;
  externalLink?: string;
  active: boolean;
  likes?: number;
}
