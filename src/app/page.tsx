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
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Analyze GitHub contributors against OpenHands Cloud OSS Credit Program criteria. 
            Check if users meet the requirements for $100-$500 in cloud credits.
          </p>
        </div>
        
        <GitHubAnalyzer />
      </div>
    </div>
  );
}
