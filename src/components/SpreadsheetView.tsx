'use client';

import { useState, useEffect } from 'react';
import { Save, X, Edit3, CheckCircle, XCircle, Rocket, AlertCircle } from 'lucide-react';
import { AnalysisRecord } from '@/lib/dataStorage';



export function SpreadsheetView() {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingNotes, setEditingNotes] = useState<{id: string, notes: string} | null>(null);
  const [editingCredit, setEditingCredit] = useState<{id: string, creditRecommendation: number} | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analyses');
      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.analyses);
      } else {
        setError('Failed to load analyses');
      }
    } catch (err) {
      setError('Error loading analyses');
      console.error('Error loading analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEditingNotes = (analysis: AnalysisRecord) => {
    setEditingNotes({
      id: analysis.id,
      notes: analysis.notes || ''
    });
  };

  const startEditingCredit = (analysis: AnalysisRecord) => {
    setEditingCredit({
      id: analysis.id,
      creditRecommendation: analysis.creditRecommendation
    });
  };

  const cancelEditingNotes = () => {
    setEditingNotes(null);
  };

  const cancelEditingCredit = () => {
    setEditingCredit(null);
  };

  const saveNotes = async () => {
    if (!editingNotes) return;

    try {
      setSaving(true);
      const response = await fetch('/api/analyses', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingNotes.id,
          notes: editingNotes.notes
        }),
      });

      if (response.ok) {
        // Update local state
        setAnalyses(prev => prev.map(analysis => 
          analysis.id === editingNotes.id 
            ? { ...analysis, notes: editingNotes.notes }
            : analysis
        ));
        setEditingNotes(null);
      } else {
        setError('Failed to save notes');
      }
    } catch (err) {
      setError('Error saving notes');
      console.error('Error saving notes:', err);
    } finally {
      setSaving(false);
    }
  };

  const saveCredit = async () => {
    if (!editingCredit) return;

    try {
      setSaving(true);
      const response = await fetch('/api/analyses', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingCredit.id,
          creditRecommendation: editingCredit.creditRecommendation
        }),
      });

      if (response.ok) {
        // Update local state
        setAnalyses(prev => prev.map(analysis => 
          analysis.id === editingCredit.id 
            ? { ...analysis, creditRecommendation: editingCredit.creditRecommendation }
            : analysis
        ));
        setEditingCredit(null);
      } else {
        setError('Failed to save credit amount');
      }
    } catch (err) {
      setError('Error saving credit amount');
      console.error('Error saving credit amount:', err);
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading analyses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">All Applicants</h2>
        <p className="text-sm text-gray-600 mt-1">
          {analyses.length} total applications • Click notes or credit amounts to edit
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stars
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total PRs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User PRs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contributors
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Write Access
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {analyses.map((analysis) => (
              <tr key={analysis.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">
                      {analysis.username}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(analysis.timestamp).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    analysis.applicationType === 'renewal' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {analysis.applicationType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(analysis.overallStatus)}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(analysis.overallStatus)}`}>
                      {analysis.overallStatus.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingCredit?.id === analysis.id ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">$</span>
                        <input
                          type="number"
                          value={editingCredit.creditRecommendation}
                          onChange={(e) => setEditingCredit({ ...editingCredit, creditRecommendation: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          max="1000"
                          step="50"
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={saveCredit}
                          disabled={saving}
                          className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditingCredit}
                          disabled={saving}
                          className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <div className="text-sm text-gray-900">
                        ${analysis.creditRecommendation}
                      </div>
                      <button
                        onClick={() => startEditingCredit(analysis)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                        title="Edit credit amount"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {analysis.criteriaResults.repositoryStars.actual}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {analysis.criteriaResults.totalMergedPRs.actual}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {analysis.criteriaResults.userMergedPRs.actual}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {analysis.criteriaResults.externalContributors.actual}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    analysis.criteriaResults.writeAccess.actual 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {analysis.criteriaResults.writeAccess.actual ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {editingNotes?.id === analysis.id ? (
                    <div className="flex items-center gap-2">
                      <textarea
                        value={editingNotes.notes}
                        onChange={(e) => setEditingNotes({ ...editingNotes, notes: e.target.value })}
                        className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                        placeholder="Add notes..."
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={saveNotes}
                          disabled={saving}
                          className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditingNotes}
                          disabled={saving}
                          className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">
                          {analysis.notes || 'No notes'}
                        </p>
                      </div>
                      <button
                        onClick={() => startEditingNotes(analysis)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                        title="Edit notes"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {analyses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No analyses found</p>
        </div>
      )}
    </div>
  );
}