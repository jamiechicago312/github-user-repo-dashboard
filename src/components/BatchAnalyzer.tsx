'use client';

import { useState } from 'react';
import { CSVUpload } from './CSVUpload';
import { BatchResults } from './BatchResults';
import { CSVUserData } from '@/lib/csvParser';
import { AlertCircle, Play, Users } from 'lucide-react';

interface BatchAnalysisResult {
  username: string;
  repositories: string[];
  notes?: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  analysis?: any;
  error?: string;
}

export function BatchAnalyzer() {
  const [csvData, setCsvData] = useState<CSVUserData[] | null>(null);
  const [results, setResults] = useState<BatchAnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCSVParsed = (users: CSVUserData[]) => {
    setCsvData(users);
    setResults(users.map(user => ({
      ...user,
      status: 'pending' as const,
    })));
    setError(null);
  };

  const handleCSVError = (errorMessage: string) => {
    setError(errorMessage);
    setCsvData(null);
    setResults([]);
  };

  const startBatchAnalysis = async () => {
    if (!csvData || csvData.length === 0) {
      setError('No CSV data to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/batch-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          users: csvData,
          saveData: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze users');
      }

      const data = await response.json();
      setResults(data.results);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during batch analysis';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearData = () => {
    setCsvData(null);
    setResults([]);
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Batch User Analysis
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Upload a CSV file containing multiple GitHub users and their repositories 
          to analyze them all at once against the OSS Credit Program criteria.
        </p>
      </div>

      {/* CSV Upload Section */}
      {!csvData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <CSVUpload onDataParsed={handleCSVParsed} onError={handleCSVError} />
        </div>
      )}

      {/* Analysis Control */}
      {csvData && !results.some(r => r.status === 'completed') && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Ready to Analyze {csvData.length} Users
                </h3>
                <p className="text-sm text-gray-600">
                  This will analyze each user against all OSS Credit Program criteria
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearData}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={startBatchAnalysis}
                disabled={isAnalyzing}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Batch Analysis
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{csvData.length}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {csvData.reduce((sum, user) => sum + user.repositories.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Repositories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {csvData.filter(user => user.notes).length}
                </div>
                <div className="text-sm text-gray-600">Users with Notes</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && results.some(r => r.status !== 'pending') && (
        <BatchResults results={results} onClear={clearData} />
      )}
    </div>
  );
}