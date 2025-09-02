'use client';

import { useState } from 'react';
import { Search, Github, AlertCircle, CheckCircle, XCircle, Rocket } from 'lucide-react';
import { GitHubService, GitHubUser, GitHubRepo, ContributorStats } from '@/lib/github';
import { CriteriaAnalyzer, AnalysisResult, CriteriaResult } from '@/lib/criteria';
import { AnalysisResults } from './AnalysisResults';

interface RepositoryAnalysis {
  repo: GitHubRepo;
  stats: ContributorStats;
  hasWriteAccess: boolean;
  analysis: AnalysisResult;
}

export function GitHubAnalyzer() {
  const [username, setUsername] = useState('');
  const [repoUrls, setRepoUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [analyses, setAnalyses] = useState<RepositoryAnalysis[]>([]);
  const [aggregatedAnalysis, setAggregatedAnalysis] = useState<AnalysisResult | null>(null);

  const analyzeUser = async () => {
    if (!username.trim()) {
      setError('Please enter a GitHub username');
      return;
    }

    // Parse repository URLs
    const urls = repoUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) {
      setError('Please provide at least one repository URL');
      return;
    }

    setLoading(true);
    setError('');
    setUser(null);
    setAnalyses([]);
    setAggregatedAnalysis(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          repoUrls: urls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze user');
      }

      const data = await response.json();
      
      setUser(data.user);
      
      // Convert external contributors back to Set
      const processedAnalyses = data.analyses.map((analysis: any) => ({
        ...analysis,
        stats: {
          ...analysis.stats,
          externalContributors: new Set(analysis.stats.externalContributors),
        },
      }));
      
      setAnalyses(processedAnalyses);
      setAggregatedAnalysis(data.aggregatedAnalysis);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing the user');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: 'exceeds' | 'meets' | 'falls_short') => {
    switch (status) {
      case 'exceeds':
        return <Rocket className="w-5 h-5 text-green-600" />;
      case 'meets':
        return <CheckCircle className="w-5 h-5 text-yellow-600" />;
      case 'falls_short':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Username
            </label>
            <div className="relative">
              <Github className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., intellectronica"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="repos" className="block text-sm font-medium text-gray-700 mb-2">
              Repository URLs (one per line)
            </label>
            <textarea
              id="repos"
              value={repoUrls}
              onChange={(e) => setRepoUrls(e.target.value)}
              placeholder="https://github.com/intellectronica/ruler&#10;https://github.com/owner/repo2"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={analyzeUser}
          disabled={loading}
          className="mt-6 w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Analyze Eligibility
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {user && (
        <AnalysisResults
          user={user}
          analyses={analyses}
          aggregatedAnalysis={aggregatedAnalysis}
        />
      )}
    </div>
  );
}