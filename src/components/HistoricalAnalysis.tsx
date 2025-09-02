'use client';

import { HistoricalAnalysis, AnalysisRecord } from '@/lib/dataStorage';
import { TrendingUp, TrendingDown, Minus, Clock, RefreshCw, Calendar, Award } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface HistoricalAnalysisProps {
  historicalData: HistoricalAnalysis;
}

export function HistoricalAnalysisComponent({ historicalData }: HistoricalAnalysisProps) {
  const { currentAnalysis, previousAnalyses, isReapplication, daysSinceLastApplication, statusChange, trends } = historicalData;

  const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'same':
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'same': return 'text-gray-600';
    }
  };

  const getStatusChangeIcon = (change: 'improved' | 'declined' | 'same' | undefined) => {
    switch (change) {
      case 'improved':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'declined':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'same':
        return <Minus className="w-5 h-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusChangeColor = (change: 'improved' | 'declined' | 'same' | undefined) => {
    switch (change) {
      case 'improved': return 'text-green-600 bg-green-50 border-green-200';
      case 'declined': return 'text-red-600 bg-red-50 border-red-200';
      case 'same': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusChangeText = (change: 'improved' | 'declined' | 'same' | undefined) => {
    switch (change) {
      case 'improved': return 'Status Improved';
      case 'declined': return 'Status Declined';
      case 'same': return 'Status Unchanged';
      default: return 'First Application';
    }
  };

  if (!isReapplication) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Application Status</h3>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="text-blue-700 font-medium">First-time Application</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          This is the first analysis for this contributor. Future applications will show historical trends and comparisons.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <RefreshCw className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-900">Reapplication Analysis</h3>
      </div>

      {/* Application Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{previousAnalyses.length + 1}</div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{daysSinceLastApplication}</div>
          <div className="text-sm text-gray-600">Days Since Last</div>
        </div>
        <div className={`text-center p-4 rounded-lg border ${getStatusChangeColor(statusChange)}`}>
          <div className="flex items-center justify-center gap-2 mb-1">
            {getStatusChangeIcon(statusChange)}
            <div className="font-bold">{getStatusChangeText(statusChange)}</div>
          </div>
          <div className="text-sm opacity-75">vs. Previous Application</div>
        </div>
      </div>

      {/* Trends */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Performance Trends</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            {getTrendIcon(trends.stars)}
            <div>
              <div className="text-sm font-medium">Repository Stars</div>
              <div className={`text-xs ${getTrendColor(trends.stars)}`}>
                {trends.stars === 'up' ? 'Increased' : trends.stars === 'down' ? 'Decreased' : 'Unchanged'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            {getTrendIcon(trends.totalPRs)}
            <div>
              <div className="text-sm font-medium">Total PRs</div>
              <div className={`text-xs ${getTrendColor(trends.totalPRs)}`}>
                {trends.totalPRs === 'up' ? 'Increased' : trends.totalPRs === 'down' ? 'Decreased' : 'Unchanged'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            {getTrendIcon(trends.userPRs)}
            <div>
              <div className="text-sm font-medium">User PRs</div>
              <div className={`text-xs ${getTrendColor(trends.userPRs)}`}>
                {trends.userPRs === 'up' ? 'Increased' : trends.userPRs === 'down' ? 'Decreased' : 'Unchanged'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            {getTrendIcon(trends.contributors)}
            <div>
              <div className="text-sm font-medium">Contributors</div>
              <div className={`text-xs ${getTrendColor(trends.contributors)}`}>
                {trends.contributors === 'up' ? 'Increased' : trends.contributors === 'down' ? 'Decreased' : 'Unchanged'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application History */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Application History</h4>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {previousAnalyses.slice(0, 5).map((analysis, index) => (
            <div key={analysis.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">
                    {format(new Date(analysis.timestamp), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatDistanceToNow(new Date(analysis.timestamp), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  analysis.overallStatus === 'exceeds' ? 'bg-green-100 text-green-700' :
                  analysis.overallStatus === 'meets' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {analysis.overallStatus === 'exceeds' ? 'Exceeded' :
                   analysis.overallStatus === 'meets' ? 'Met' : 'Fell Short'}
                </div>
                
                <div className="text-sm font-medium text-gray-900">
                  ${analysis.creditRecommendation}
                </div>
              </div>
            </div>
          ))}
          
          {previousAnalyses.length > 5 && (
            <div className="text-center py-2">
              <span className="text-sm text-gray-500">
                ... and {previousAnalyses.length - 5} more applications
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Renewal Recommendation */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Renewal Assessment</h4>
        <p className="text-sm text-blue-700">
          {statusChange === 'improved' && (
            "✅ This contributor has shown improvement since their last application and demonstrates continued engagement with the project."
          )}
          {statusChange === 'same' && (
            "📊 This contributor maintains consistent performance levels and continues to meet the program requirements."
          )}
          {statusChange === 'declined' && (
            "⚠️ This contributor's metrics have declined since their last application. Consider discussing their current involvement level."
          )}
          {daysSinceLastApplication && daysSinceLastApplication < 90 && (
            ` Note: Only ${daysSinceLastApplication} days since last application - consider if early renewal is appropriate.`
          )}
        </p>
      </div>
    </div>
  );
}