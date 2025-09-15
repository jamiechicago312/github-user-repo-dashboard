'use client';

import { useState, useEffect } from 'react';
import { Search, Github, AlertCircle, CheckCircle, XCircle, Rocket, FileText, ChevronDown } from 'lucide-react';
import { GitHubService, GitHubUser, GitHubRepo, ContributorStats } from '@/lib/github';
import { CriteriaAnalyzer, AnalysisResult, CriteriaResult } from '@/lib/criteria';
import { HistoricalAnalysis, AnalysisRecord } from '@/lib/dataStorage';
import { AnalysisResults } from './AnalysisResults';
import { HistoricalAnalysisComponent } from './HistoricalAnalysis';

interface RepositoryAnalysis {
  repo: GitHubRepo;
  stats: ContributorStats;
  hasWriteAccess: boolean;
  analysis: AnalysisResult;
}

export function GitHubAnalyzer() {
  const [username, setUsername] = useState('');
  const [repoUrls, setRepoUrls] = useState('');
  const [notes, setNotes] = useState('');
  const [saveData, setSaveData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [analyses, setAnalyses] = useState<RepositoryAnalysis[]>([]);
  const [aggregatedAnalysis, setAggregatedAnalysis] = useState<AnalysisResult | null>(null);
  const [historicalAnalysis, setHistoricalAnalysis] = useState<HistoricalAnalysis | null>(null);
  
  // New state for dropdown functionality
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [userAnalyses, setUserAnalyses] = useState<AnalysisRecord[]>([]);
  const [selectedAnalysisDate, setSelectedAnalysisDate] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(true);

  // Load available users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setAvailableUsers(data.users);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  // Handle user selection from dropdown
  const handleUserSelection = async (selectedUsername: string) => {
    if (!selectedUsername) {
      setSelectedUser('');
      setUserAnalyses([]);
      setSelectedAnalysisDate('');
      setUsername('');
      setRepoUrls('');
      setNotes('');
      setIsManualEntry(true);
      return;
    }

    setSelectedUser(selectedUsername);
    setUsername(selectedUsername);
    setIsManualEntry(false);

    try {
      const response = await fetch(`/api/history?username=${selectedUsername}`);
      if (response.ok) {
        const data = await response.json();
        setUserAnalyses(data.history);
        
        // Auto-select the most recent analysis
        if (data.history.length > 0) {
          const mostRecent = data.history[0];
          setSelectedAnalysisDate(mostRecent.timestamp);
          setRepoUrls(mostRecent.repositories.join('\n'));
          setNotes(mostRecent.notes || '');
        }
      }
    } catch (error) {
      console.error('Error loading user history:', error);
    }
  };

  // Handle analysis date selection
  const handleAnalysisDateSelection = (timestamp: string) => {
    setSelectedAnalysisDate(timestamp);
    const selectedAnalysis = userAnalyses.find(analysis => analysis.timestamp === timestamp);
    if (selectedAnalysis) {
      setRepoUrls(selectedAnalysis.repositories.join('\n'));
      setNotes(selectedAnalysis.notes || '');
    }
  };

  // Handle manual username input
  const handleManualUsernameChange = (value: string) => {
    setUsername(value);
    if (value !== selectedUser) {
      setIsManualEntry(true);
      setSelectedUser('');
      setUserAnalyses([]);
      setSelectedAnalysisDate('');
    }
  };

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
    setHistoricalAnalysis(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          repoUrls: urls,
          saveData: saveData && isManualEntry, // Only save data for manual entries
          notes: notes.trim() || undefined,
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
      setHistoricalAnalysis(data.historicalAnalysis);

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
        {/* User Selection Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select User</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="userSelect" className="block text-sm font-medium text-gray-700 mb-2">
                Previous Applicants
              </label>
              <div className="relative">
                <select
                  id="userSelect"
                  value={selectedUser}
                  onChange={(e) => handleUserSelection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">Select a previous applicant...</option>
                  {availableUsers.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {userAnalyses.length > 0 && (
              <div>
                <label htmlFor="dateSelect" className="block text-sm font-medium text-gray-700 mb-2">
                  Application Date
                </label>
                <div className="relative">
                  <select
                    id="dateSelect"
                    value={selectedAnalysisDate}
                    onChange={(e) => handleAnalysisDateSelection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    {userAnalyses.map((analysis, index) => (
                      <option key={analysis.id} value={analysis.timestamp}>
                        {new Date(analysis.timestamp).toLocaleDateString()} 
                        {index === 0 ? ' (Latest)' : ''}
                        {analysis.applicationType === 'renewal' ? ' - Renewal' : ' - Initial'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                {isManualEntry ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    New Entry
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Existing Data
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                onChange={(e) => handleManualUsernameChange(e.target.value)}
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

        {/* Additional Options */}
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this application (e.g., special circumstances, renewal reason, etc.)"
                rows={2}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="saveData"
              type="checkbox"
              checked={saveData}
              onChange={(e) => setSaveData(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="saveData" className="text-sm text-gray-700">
              Save analysis data locally (for tracking reapplications and renewals)
            </label>
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
        <>
          {/* Historical Analysis */}
          {historicalAnalysis && (
            <HistoricalAnalysisComponent historicalData={historicalAnalysis} />
          )}
          
          {/* Current Analysis Results */}
          <AnalysisResults
            user={user}
            analyses={analyses}
            aggregatedAnalysis={aggregatedAnalysis}
          />
        </>
      )}
    </div>
  );
}