'use client';

import { GitHubUser } from '@/lib/github';
import { AnalysisResult, CriteriaResult } from '@/lib/criteria';
import { CheckCircle, XCircle, Rocket, Star, GitPullRequest, Users, Shield, ExternalLink } from 'lucide-react';

interface RepositoryAnalysis {
  repo: {
    name: string;
    full_name: string;
    stargazers_count: number;
    html_url: string;
  };
  stats: {
    totalMergedPRs: number;
    userMergedPRs: number;
    externalContributors: Set<string>;
    recentPRs: any[];
  };
  hasWriteAccess: boolean;
  analysis: AnalysisResult;
}

interface AnalysisResultsProps {
  user: GitHubUser;
  analyses: RepositoryAnalysis[];
  aggregatedAnalysis: AnalysisResult | null;
}

export function AnalysisResults({ user, analyses, aggregatedAnalysis }: AnalysisResultsProps) {
  const getStatusColor = (status: 'exceeds' | 'meets' | 'falls_short') => {
    switch (status) {
      case 'exceeds':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'meets':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'falls_short':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getStatusIcon = (status: 'exceeds' | 'meets' | 'falls_short') => {
    switch (status) {
      case 'exceeds':
        return <Rocket className="w-5 h-5" />;
      case 'meets':
        return <CheckCircle className="w-5 h-5" />;
      case 'falls_short':
        return <XCircle className="w-5 h-5" />;
    }
  };

  const getStatusText = (status: 'exceeds' | 'meets' | 'falls_short') => {
    switch (status) {
      case 'exceeds':
        return 'Exceeds Requirements';
      case 'meets':
        return 'Meets Requirements';
      case 'falls_short':
        return 'Falls Short';
    }
  };

  const renderCriteriaCard = (criterion: CriteriaResult) => (
    <div key={criterion.criterion} className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{criterion.criterion}</h4>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(criterion.status)}`}>
          {getStatusIcon(criterion.status)}
          {getStatusText(criterion.status)}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Required:</span>
          <span className="font-medium">{criterion.required}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Actual:</span>
          <span className="font-medium">{criterion.actual}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Percentage:</span>
          <span className={`font-medium ${criterion.percentage >= 100 ? 'text-green-600' : 'text-red-600'}`}>
            {criterion.percentage}%
          </span>
        </div>
      </div>
      
      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            criterion.status === 'exceeds' ? 'bg-green-500' :
            criterion.status === 'meets' ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(criterion.percentage, 100)}%` }}
        />
      </div>
      
      <p className="text-xs text-gray-500 mt-2">{criterion.description}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* User Profile */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4 mb-4">
          <img
            src={user.avatar_url}
            alt={user.name || user.login}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user.name || user.login}
            </h2>
            <p className="text-gray-600">@{user.login}</p>
            <p className="text-sm text-gray-500">{user.public_repos} public repositories</p>
          </div>
        </div>
      </div>

      {/* Overall Analysis */}
      {aggregatedAnalysis && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Overall Eligibility</h3>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-lg font-medium border ${getStatusColor(aggregatedAnalysis.overallStatus)}`}>
              {getStatusIcon(aggregatedAnalysis.overallStatus)}
              {getStatusText(aggregatedAnalysis.overallStatus)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{aggregatedAnalysis.summary.passed}</div>
              <div className="text-sm text-gray-600">Criteria Passed</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{aggregatedAnalysis.summary.total}</div>
              <div className="text-sm text-gray-600">Total Criteria</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{aggregatedAnalysis.summary.score}%</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aggregatedAnalysis.criteria.map(renderCriteriaCard)}
          </div>
        </div>
      )}

      {/* Individual Repository Analyses */}
      {analyses.map((analysis, index) => (
        <div key={analysis.repo.full_name} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900">{analysis.repo.name}</h3>
              <a
                href={analysis.repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(analysis.analysis.overallStatus)}`}>
              {getStatusIcon(analysis.analysis.overallStatus)}
              {getStatusText(analysis.analysis.overallStatus)}
            </div>
          </div>

          {/* Repository Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="font-medium">{analysis.repo.stargazers_count}</div>
                <div className="text-xs text-gray-600">Stars</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <GitPullRequest className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-medium">{analysis.stats.totalMergedPRs}</div>
                <div className="text-xs text-gray-600">Merged PRs</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Users className="w-5 h-5 text-green-500" />
              <div>
                <div className="font-medium">{analysis.stats.externalContributors.size}</div>
                <div className="text-xs text-gray-600">Contributors</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-purple-500" />
              <div className="flex-1">
                <div className="font-medium">{analysis.hasWriteAccess ? 'Yes' : 'No'}</div>
                <div className="text-xs text-gray-600">Maintainer/Write Access</div>
                <div className="text-xs text-gray-500 mt-1">
                  {analysis.hasWriteAccess 
                    ? "Detected via: collaborator status, merge activity, or commits"
                    : "Note: Limited detection due to GitHub API permissions"
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Criteria Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.analysis.criteria.map(renderCriteriaCard)}
          </div>

          {/* Recent PRs */}
          {analysis.stats.recentPRs.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Recent Merged PRs (Last 90 Days)</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {analysis.stats.recentPRs.slice(0, 10).map((pr) => (
                  <div key={pr.number} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <GitPullRequest className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">#{pr.number}</span>
                      <span className="truncate max-w-xs">{pr.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>by {pr.user.login}</span>
                      <a
                        href={pr.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Credit Recommendation */}
      {aggregatedAnalysis && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Credit Recommendation</h3>
          <div className={`p-4 rounded-lg border ${getStatusColor(aggregatedAnalysis.overallStatus)}`}>
            {aggregatedAnalysis.overallStatus === 'exceeds' && (
              <div>
                <p className="font-medium mb-2">🎉 Recommended for $500 credits</p>
                <p className="text-sm">
                  This contributor significantly exceeds the requirements and would be an excellent 
                  candidate for the maximum credit allocation.
                </p>
              </div>
            )}
            {aggregatedAnalysis.overallStatus === 'meets' && (
              <div>
                <p className="font-medium mb-2">✅ Recommended for $300 credits</p>
                <p className="text-sm">
                  This contributor meets all the basic requirements and would benefit from 
                  OpenHands Cloud credits for their maintenance work.
                </p>
              </div>
            )}
            {aggregatedAnalysis.overallStatus === 'falls_short' && (
              <div>
                <p className="font-medium mb-2">❌ Not recommended for credits</p>
                <p className="text-sm">
                  This contributor does not meet the minimum requirements for the OSS Credit Program. 
                  Consider encouraging them to increase their contribution activity.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}