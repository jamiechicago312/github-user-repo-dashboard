'use client';

import { useState } from 'react';
import { GitHubAnalyzer } from '@/components/GitHubAnalyzer';

export default function Home() {
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
        
        <GitHubAnalyzer />
      </div>
    </div>
  );
}
