import { GitHubRepo, ContributorStats } from './github';

export interface CriteriaRequirements {
  minStars: number;
  minMergedPRs: number;
  minExternalContributors: number;
  minUserPRs: number;
  days: number;
}

export interface CriteriaResult {
  criterion: string;
  required: number;
  actual: number;
  status: 'exceeds' | 'meets' | 'falls_short';
  percentage: number;
  description: string;
}

export interface AnalysisResult {
  overallStatus: 'exceeds' | 'meets' | 'falls_short';
  criteria: CriteriaResult[];
  summary: {
    passed: number;
    total: number;
    score: number;
  };
}

export const DEFAULT_REQUIREMENTS: CriteriaRequirements = {
  minStars: 100,
  minMergedPRs: 20,
  minExternalContributors: 2,
  minUserPRs: 5,
  days: 90,
};

export class CriteriaAnalyzer {
  private requirements: CriteriaRequirements;

  constructor(requirements: CriteriaRequirements = DEFAULT_REQUIREMENTS) {
    this.requirements = requirements;
  }

  private calculateStatus(actual: number, required: number): 'exceeds' | 'meets' | 'falls_short' {
    if (actual >= required * 1.5) return 'exceeds'; // 50% above requirement
    if (actual >= required) return 'meets';
    return 'falls_short';
  }

  private calculatePercentage(actual: number, required: number): number {
    return Math.round((actual / required) * 100);
  }

  analyzeRepository(
    repo: GitHubRepo,
    stats: ContributorStats,
    hasWriteAccess: boolean
  ): AnalysisResult {
    const criteria: CriteriaResult[] = [];

    // 1. Repository has ≥100 stars
    const starsResult: CriteriaResult = {
      criterion: 'Repository Stars',
      required: this.requirements.minStars,
      actual: repo.stargazers_count,
      status: this.calculateStatus(repo.stargazers_count, this.requirements.minStars),
      percentage: this.calculatePercentage(repo.stargazers_count, this.requirements.minStars),
      description: `Repository must have at least ${this.requirements.minStars} stars`,
    };
    criteria.push(starsResult);

    // 2. User has maintainer/write access
    const accessResult: CriteriaResult = {
      criterion: 'Maintainer/Write Access',
      required: 1,
      actual: hasWriteAccess ? 1 : 0,
      status: hasWriteAccess ? 'meets' : 'falls_short',
      percentage: hasWriteAccess ? 100 : 0,
      description: 'User must have maintainer or write access to the repository (detected via collaborator status, merge activity, or recent commits)',
    };
    criteria.push(accessResult);

    // 3. Repository shows ≥20 merged PRs in last 90 days
    const totalPRsResult: CriteriaResult = {
      criterion: 'Total Merged PRs (90 days)',
      required: this.requirements.minMergedPRs,
      actual: stats.totalMergedPRs,
      status: this.calculateStatus(stats.totalMergedPRs, this.requirements.minMergedPRs),
      percentage: this.calculatePercentage(stats.totalMergedPRs, this.requirements.minMergedPRs),
      description: `Repository must have at least ${this.requirements.minMergedPRs} merged PRs from all contributors in the last ${this.requirements.days} days`,
    };
    criteria.push(totalPRsResult);

    // 4. At least 2 distinct external contributors
    const externalContributorsResult: CriteriaResult = {
      criterion: 'External Contributors',
      required: this.requirements.minExternalContributors,
      actual: stats.externalContributors.size,
      status: this.calculateStatus(stats.externalContributors.size, this.requirements.minExternalContributors),
      percentage: this.calculatePercentage(stats.externalContributors.size, this.requirements.minExternalContributors),
      description: `Repository must have at least ${this.requirements.minExternalContributors} distinct external contributors in the last ${this.requirements.days} days`,
    };
    criteria.push(externalContributorsResult);

    // 5. User personally authored ≥5 merged PRs in last 90 days
    const userPRsResult: CriteriaResult = {
      criterion: 'User Merged PRs (90 days)',
      required: this.requirements.minUserPRs,
      actual: stats.userMergedPRs,
      status: this.calculateStatus(stats.userMergedPRs, this.requirements.minUserPRs),
      percentage: this.calculatePercentage(stats.userMergedPRs, this.requirements.minUserPRs),
      description: `User must have personally authored at least ${this.requirements.minUserPRs} merged PRs in the last ${this.requirements.days} days`,
    };
    criteria.push(userPRsResult);

    // Calculate overall status
    const passedCriteria = criteria.filter(c => c.status !== 'falls_short').length;
    const totalCriteria = criteria.length;
    const score = Math.round((passedCriteria / totalCriteria) * 100);

    let overallStatus: 'exceeds' | 'meets' | 'falls_short';
    if (passedCriteria === totalCriteria) {
      // All criteria passed - check if any exceed
      const exceedingCriteria = criteria.filter(c => c.status === 'exceeds').length;
      overallStatus = exceedingCriteria >= 2 ? 'exceeds' : 'meets';
    } else {
      overallStatus = 'falls_short';
    }

    return {
      overallStatus,
      criteria,
      summary: {
        passed: passedCriteria,
        total: totalCriteria,
        score,
      },
    };
  }

  analyzeMultipleRepositories(
    analyses: AnalysisResult[]
  ): AnalysisResult {
    if (analyses.length === 0) {
      return {
        overallStatus: 'falls_short',
        criteria: [],
        summary: { passed: 0, total: 0, score: 0 },
      };
    }

    if (analyses.length === 1) {
      return analyses[0];
    }

    // For multiple repositories, aggregate the results
    const aggregatedCriteria: CriteriaResult[] = [];
    const criteriaNames = analyses[0].criteria.map(c => c.criterion);

    for (const criterionName of criteriaNames) {
      const criterionResults = analyses.map(a => 
        a.criteria.find(c => c.criterion === criterionName)!
      );

      // For multiple repos, we take the best result for each criterion
      // except for user PRs which we sum up
      let aggregatedResult: CriteriaResult;

      if (criterionName === 'User Merged PRs (90 days)') {
        // Sum up user PRs across all repositories
        const totalUserPRs = criterionResults.reduce((sum, cr) => sum + cr.actual, 0);
        const required = criterionResults[0].required;
        
        aggregatedResult = {
          criterion: criterionName,
          required,
          actual: totalUserPRs,
          status: this.calculateStatus(totalUserPRs, required),
          percentage: this.calculatePercentage(totalUserPRs, required),
          description: criterionResults[0].description + ' (aggregated across all repositories)',
        };
      } else {
        // For other criteria, take the best performing repository
        const bestResult = criterionResults.reduce((best, current) => 
          current.actual > best.actual ? current : best
        );
        
        aggregatedResult = {
          ...bestResult,
          description: bestResult.description + ' (best across all repositories)',
        };
      }

      aggregatedCriteria.push(aggregatedResult);
    }

    // Calculate overall status for aggregated results
    const passedCriteria = aggregatedCriteria.filter(c => c.status !== 'falls_short').length;
    const totalCriteria = aggregatedCriteria.length;
    const score = Math.round((passedCriteria / totalCriteria) * 100);

    let overallStatus: 'exceeds' | 'meets' | 'falls_short';
    if (passedCriteria === totalCriteria) {
      const exceedingCriteria = aggregatedCriteria.filter(c => c.status === 'exceeds').length;
      overallStatus = exceedingCriteria >= 2 ? 'exceeds' : 'meets';
    } else {
      overallStatus = 'falls_short';
    }

    return {
      overallStatus,
      criteria: aggregatedCriteria,
      summary: {
        passed: passedCriteria,
        total: totalCriteria,
        score,
      },
    };
  }

  getStatusColor(status: 'exceeds' | 'meets' | 'falls_short'): string {
    switch (status) {
      case 'exceeds':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'meets':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'falls_short':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  }

  getStatusIcon(status: 'exceeds' | 'meets' | 'falls_short'): string {
    switch (status) {
      case 'exceeds':
        return '🚀';
      case 'meets':
        return '✅';
      case 'falls_short':
        return '❌';
    }
  }

  getStatusText(status: 'exceeds' | 'meets' | 'falls_short'): string {
    switch (status) {
      case 'exceeds':
        return 'Exceeds Requirements';
      case 'meets':
        return 'Meets Requirements';
      case 'falls_short':
        return 'Falls Short';
    }
  }
}