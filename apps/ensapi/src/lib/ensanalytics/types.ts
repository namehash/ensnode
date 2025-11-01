export interface ReferrerData {
  referrer: string;
  total_referrals: number;
}

export interface PaginatedReferrers {
  referrers: ReferrerData[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CacheStats {
  totalReferrers: number;
  isInitialized: boolean;
  lastRefresh: Date;
}
