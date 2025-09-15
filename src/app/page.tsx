'use client';

import { useState } from 'react';
import { GitHubAnalyzer } from '@/components/GitHubAnalyzer';
import { SpreadsheetView } from '@/components/SpreadsheetView';
import { Search, Table } from 'lucide-react';

type ViewMode = 'analyzer' | 'spreadsheet';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewMode>('analyzer');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            OpenHands OSS Credit Analyzer
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
            Analyze GitHub contributors against OpenHands Cloud OSS Credit Program criteria. 
            Check if users meet the requirements for $100-$500 in cloud credits.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Tracks reapplications</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Historical trends</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Local CSV storage</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 justify-center">
              <button
                onClick={() => setCurrentView('analyzer')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  currentView === 'analyzer'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Search className="w-4 h-4" />
                Analyzer
              </button>
              <button
                onClick={() => setCurrentView('spreadsheet')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  currentView === 'spreadsheet'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Table className="w-4 h-4" />
                All Applicants
              </button>
            </nav>
          </div>
        </div>
        
        {/* Content */}
        {currentView === 'analyzer' ? (
          <GitHubAnalyzer />
        ) : (
          <SpreadsheetView />
        )}
      </div>
    </div>
  );
}
