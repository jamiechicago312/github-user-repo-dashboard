'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Rocket, AlertCircle, ExternalLink, Download, Filter, Search, Users, Star, GitPullRequest, Shield } from 'lucide-react';
import { AnalysisResult } from '@/lib/criteria';

interface BatchAnalysisResult {
  username: string;
  repositories: string[];
  notes?: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  analysis?: AnalysisResult;
  error?: string;
}

interface BatchResultsProps {
  results: BatchAnalysisResult[];
  onClear: () => void;
}

type FilterType = 'all' | 'exceeds' | 'meets' | 'falls_short' | 'error';
type SortType = 'username' | 'status' | 'credit' | 'stars';

export function BatchResults({ results, onClear }: BatchResultsProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('username');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const getStatusIcon = (status: 'exceeds' | 'meets' | 'falls_short') => {
    switch (status) {
      case 'exceeds':
        return <Rocket className="w-4 h-4 text-green-600" />;
      case 'meets':
        return <CheckCircle className="w-4 h-4 text-yellow-600" />;
      case 'falls_short':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: 'exceeds' | 'meets' | 'falls_short') => {
    switch (status) {
      case 'exceeds':
        return 'bg-green-100 text-green-800';
      case 'meets':
        return 'bg-yellow-100 text-yellow-800';
      case 'falls_short':
        return 'bg-red-100 text-red-800';
    }
  };

  const filteredAndSortedResults = results
    .filter(result => {
      // Filter by status
      if (filter !== 'all') {
        if (filter === 'error' && result.status !== 'error') return false;
        if (filter !== 'error' && result.analysis?.overallStatus !== filter) return false;
      }

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          result.username.toLowerCase().includes(searchLower) ||
          result.repositories.some(repo => repo.toLowerCase().includes(searchLower)) ||
          (result.notes && result.notes.toLowerCase().includes(searchLower))
        );
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'username':
          return a.username.localeCompare(b.username);
        case 'status':
          if (a.status === 'error' && b.status !== 'error') return 1;
          if (b.status === 'error' && a.status !== 'error') return -1;
          if (!a.analysis || !b.analysis) return 0;
          const statusOrder = { 'exceeds': 0, 'meets': 1, 'falls_short': 2 };
          return statusOrder[a.analysis.overallStatus] - statusOrder[b.analysis.overallStatus];
        case 'credit':
          if (!a.analysis || !b.analysis) return 0;
          return b.analysis.creditRecommendation - a.analysis.creditRecommendation;
        case 'stars':
          if (!a.analysis || !b.analysis) return 0;
          return b.analysis.criteria.repositoryStars.actual - a.analysis.criteria.repositoryStars.actual;
        default:
          return 0;
      }
    });

  const toggleRowExpansion = (username: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(username)) {
      newExpanded.delete(username);
    } else {
      newExpanded.add(username);
    }
    setExpandedRows(newExpanded);
  };

  const exportResults = () => {
    const csvContent = [
      'Username,Status,Credit Recommendation,Stars,Write Access,Total PRs,External Contributors,User PRs,Notes',
      ...results
        .filter(r => r.analysis)
        .map(r => {
          const a = r.analysis!;
          return [
            r.username,
            a.overallStatus,
            a.creditRecommendation,
            a.criteria.repositoryStars.actual,
            a.criteria.writeAccess.actual ? 'Yes' : 'No',
            a.criteria.totalMergedPRs.actual,
            a.criteria.externalContributors.actual,
            a.criteria.userMergedPRs.actual,
            r.notes || ''
          ].join(',');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-analysis-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const completedCount = results.filter(r => r.status === 'completed').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const pendingCount = results.filter(r => r.status === 'pending' || r.status === 'analyzing').length;

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Batch Analysis Results</h3>
            <p className="text-sm text-gray-600">
              {completedCount} completed, {errorCount} errors, {pendingCount} pending
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportResults}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={onClear}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Results</option>
              <option value="exceeds">Exceeds Requirements</option>
              <option value="meets">Meets Requirements</option>
              <option value="falls_short">Falls Short</option>
              <option value="error">Errors</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="username">Username</option>
              <option value="status">Status</option>
              <option value="credit">Credit Amount</option>
              <option value="stars">Stars</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm flex-1"
            />
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium text-gray-700">User</th>
              <th className="text-left p-4 font-medium text-gray-700">Status</th>
              <th className="text-left p-4 font-medium text-gray-700">Credit</th>
              <th className="text-left p-4 font-medium text-gray-700">Key Metrics</th>
              <th className="text-left p-4 font-medium text-gray-700">Repositories</th>
              <th className="text-left p-4 font-medium text-gray-700">Notes</th>
              <th className="text-left p-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedResults.map((result) => (
              <>
              <tr key={result.username} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-blue-600">{result.username}</div>
                    {result.status === 'analyzing' && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                </td>
                
                <td className="p-4">
                  {result.status === 'error' ? (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-red-600 text-sm">Error</span>
                    </div>
                  ) : result.status === 'completed' && result.analysis ? (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.analysis.overallStatus)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.analysis.overallStatus)}`}>
                        {result.analysis.overallStatus.replace('_', ' ')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">
                      {result.status === 'analyzing' ? 'Analyzing...' : 'Pending'}
                    </span>
                  )}
                </td>

                <td className="p-4">
                  {result.analysis ? (
                    <div className="font-semibold text-green-600">
                      ${result.analysis.creditRecommendation}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>

                <td className="p-4">
                  {result.analysis ? (
                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>{result.analysis.criteria.repositoryStars.actual}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GitPullRequest className="w-3 h-3 text-blue-500" />
                        <span>{result.analysis.criteria.userMergedPRs.actual}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-purple-500" />
                        <span>{result.analysis.criteria.externalContributors.actual}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-green-500" />
                        <span>{result.analysis.criteria.writeAccess.actual ? '✓' : '✗'}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>

                <td className="p-4">
                  <div className="text-sm text-gray-600">
                    {result.repositories.length} repo{result.repositories.length !== 1 ? 's' : ''}
                  </div>
                </td>

                <td className="p-4">
                  <div className="text-sm text-gray-600 max-w-xs truncate">
                    {result.notes || '-'}
                  </div>
                </td>

                <td className="p-4">
                  <button
                    onClick={() => toggleRowExpansion(result.username)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    {expandedRows.has(result.username) ? 'Hide Details' : 'Show Details'}
                  </button>
                </td>
              </tr>

              {/* Expanded Row Details */}
              {expandedRows.has(result.username) && (
                <tr className="bg-gray-50">
                  <td colSpan={7} className="p-4">
                    <div className="space-y-4">
                      {/* Error Details */}
                      {result.status === 'error' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-red-800">Error Details</span>
                          </div>
                          <p className="text-red-700 text-sm">{result.error}</p>
                        </div>
                      )}

                      {/* Repository List */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Repositories</h4>
                        <div className="space-y-1">
                          {result.repositories.map((repo, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <ExternalLink className="w-3 h-3 text-gray-400" />
                              <a
                                href={repo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                {repo}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Detailed Analysis */}
                      {result.analysis && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Detailed Criteria Analysis</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                            {Object.entries(result.analysis.criteria).map(([key, criterion]) => (
                              <div key={key} className="bg-white border border-gray-200 rounded-lg p-3">
                                <div className="text-xs text-gray-500 mb-1">
                                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </div>
                                <div className={`text-sm font-medium ${getStatusColor(criterion.status).replace('bg-', 'text-').replace('-100', '-700')}`}>
                                  {typeof criterion.actual === 'boolean' 
                                    ? (criterion.actual ? 'Yes' : 'No')
                                    : criterion.actual
                                  }
                                </div>
                                <div className="text-xs text-gray-500">
                                  {criterion.percentage}% of requirement
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Full Notes */}
                      {result.notes && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                          <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg p-3">
                            {result.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              </>
            ))}
          </tbody>
        </table>

        {filteredAndSortedResults.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No results match your current filters
          </div>
        )}
      </div>
    </div>
  );
}