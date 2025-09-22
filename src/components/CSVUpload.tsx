'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download, Users } from 'lucide-react';
import { CSVParser, CSVUserData } from '@/lib/csvParser';

interface CSVUploadProps {
  onDataParsed: (users: CSVUserData[]) => void;
  onError: (error: string) => void;
}

export function CSVUpload({ onDataParsed, onError }: CSVUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVUserData[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please select a CSV file');
      onError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setParseError(null);
    setParsedData(null);

    try {
      const content = await selectedFile.text();
      const users = CSVParser.parseCSV(content);
      setParsedData(users);
      onDataParsed(users);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV file';
      setParseError(errorMessage);
      onError(errorMessage);
    }
  };

  const downloadSample = () => {
    const sampleContent = `username,repositories,notes
intellectronica,"https://github.com/intellectronica/ruler
https://github.com/intellectronica/another-repo",Initial application for OSS credits
openhands,"https://github.com/All-Hands-AI/OpenHands
https://github.com/All-Hands-AI/OpenHands-Cloud",Renewal application - previous contributor`;

    const blob = new Blob([sampleContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-users.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearFile = () => {
    setFile(null);
    setParsedData(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : parseError
            ? 'border-red-300 bg-red-50'
            : parsedData
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-4">
          {parsedData ? (
            <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
          ) : parseError ? (
            <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          ) : (
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
          )}

          <div>
            {parsedData ? (
              <div>
                <p className="text-lg font-medium text-green-700">
                  CSV Parsed Successfully!
                </p>
                <p className="text-sm text-green-600">
                  Found {parsedData.length} users ready for analysis
                </p>
              </div>
            ) : parseError ? (
              <div>
                <p className="text-lg font-medium text-red-700">
                  Error Parsing CSV
                </p>
                <p className="text-sm text-red-600">{parseError}</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Upload CSV File
                </p>
                <p className="text-sm text-gray-500">
                  Drag and drop your CSV file here, or click to browse
                </p>
              </div>
            )}
          </div>

          {file && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>{file.name}</span>
              <button
                onClick={clearFile}
                className="text-red-600 hover:text-red-700 ml-2"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sample Download */}
      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">Need a sample CSV?</p>
            <p className="text-sm text-blue-700">
              Download our template to see the required format
            </p>
          </div>
        </div>
        <button
          onClick={downloadSample}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Download Sample
        </button>
      </div>

      {/* CSV Format Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">CSV Format Requirements</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>username</strong>: GitHub username (required)</li>
          <li>• <strong>repositories</strong>: Repository URLs, one per line or comma-separated (required)</li>
          <li>• <strong>notes</strong>: Optional notes for the analysis</li>
        </ul>
      </div>

      {/* Parsed Data Preview */}
      {parsedData && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">
              Parsed Data Preview ({parsedData.length} users)
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 font-medium text-gray-700">Username</th>
                  <th className="text-left p-2 font-medium text-gray-700">Repositories</th>
                  <th className="text-left p-2 font-medium text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 10).map((user, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="p-2 font-mono text-blue-600">{user.username}</td>
                    <td className="p-2 text-gray-600">
                      {user.repositories.length} repo{user.repositories.length !== 1 ? 's' : ''}
                    </td>
                    <td className="p-2 text-gray-600 truncate max-w-xs">
                      {user.notes || '-'}
                    </td>
                  </tr>
                ))}
                {parsedData.length > 10 && (
                  <tr>
                    <td colSpan={3} className="p-2 text-center text-gray-500 italic">
                      ... and {parsedData.length - 10} more users
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}