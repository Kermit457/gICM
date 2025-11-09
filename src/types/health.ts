export interface HealthCheckResult {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  issues: HealthIssue[];
  recommendations: HealthRecommendation[];
  metrics: {
    conflicts: number;
    redundancies: number;
    missingDeps: number;
    securityIssues: number;
    optimizationOpportunities: number;
  };
}

export interface HealthIssue {
  severity: 'critical' | 'warning' | 'info';
  type: 'conflict' | 'redundancy' | 'missing-dep' | 'security' | 'performance';
  title: string;
  description: string;
  affectedItems: string[];
}

export interface HealthRecommendation {
  action: 'add' | 'remove' | 'replace' | 'update';
  title: string;
  description: string;
  itemId?: string;
  itemName?: string;
  impact: 'high' | 'medium' | 'low';
}
