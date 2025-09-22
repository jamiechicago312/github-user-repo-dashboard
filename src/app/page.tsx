'use client';

import { useState } from 'react';
import { GitHubAnalyzer } from '@/components/GitHubAnalyzer';
import { SpreadsheetView } from '@/components/SpreadsheetView';
import { BatchAnalyzer } from '@/components/BatchAnalyzer';
import { User, Users, Table } from 'lucide-react';

type TabType = 'individual' | 'batch' | 'spreadsheet';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('individual');

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
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Batch CSV import</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm p-1 flex">
            <button
              onClick={() => setActiveTab('individual')}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'individual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <User className="w-4 h-4" />
              Individual Analysis
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'batch'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Batch CSV Import
            </button>
            <button
              onClick={() => setActiveTab('spreadsheet')}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'spreadsheet'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Table className="w-4 h-4" />
              All Applicants
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'individual' ? (
          <GitHubAnalyzer />
        ) : activeTab === 'batch' ? (
          <BatchAnalyzer />
        ) : (
          <SpreadsheetView />
        )}
      </div>
    </div>
  );
}
