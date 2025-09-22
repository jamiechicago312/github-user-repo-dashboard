import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CSVUpload } from '@/components/CSVUpload';

// Mock File.prototype.text method
const mockFileText = jest.fn();
Object.defineProperty(File.prototype, 'text', {
  value: mockFileText,
  writable: true,
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('CSVUpload', () => {
  const mockOnDataParsed = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileText.mockClear();
  });

  it('should render upload area', () => {
    render(<CSVUpload onDataParsed={mockOnDataParsed} onError={mockOnError} />);

    expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop your CSV file here, or click to browse')).toBeInTheDocument();
  });

  it('should show CSV format requirements', () => {
    render(<CSVUpload onDataParsed={mockOnDataParsed} onError={mockOnError} />);

    expect(screen.getByText('CSV Format Requirements')).toBeInTheDocument();
    expect(screen.getByText('username')).toBeInTheDocument();
    expect(screen.getByText('repositories')).toBeInTheDocument();
    expect(screen.getByText('notes')).toBeInTheDocument();
    expect(screen.getByText(/GitHub username.*required/)).toBeInTheDocument();
    expect(screen.getByText(/Repository URLs.*required/)).toBeInTheDocument();
    expect(screen.getByText(/Optional notes/)).toBeInTheDocument();
  });

  it('should provide sample download button', () => {
    render(<CSVUpload onDataParsed={mockOnDataParsed} onError={mockOnError} />);

    const downloadButton = screen.getByText('Download Sample');
    expect(downloadButton).toBeInTheDocument();

    // Mock document methods for download test
    const mockCreateElement = jest.spyOn(document, 'createElement');
    const mockAppendChild = jest.spyOn(document.body, 'appendChild');
    const mockRemoveChild = jest.spyOn(document.body, 'removeChild');
    const mockClick = jest.fn();

    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    };

    mockCreateElement.mockReturnValue(mockAnchor as any);
    mockAppendChild.mockImplementation(() => {});
    mockRemoveChild.mockImplementation(() => {});

    fireEvent.click(downloadButton);

    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalled();
    expect(mockAnchor.download).toBe('sample-users.csv');

    mockCreateElement.mockRestore();
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
  });

  it('should handle file selection via input', async () => {
    render(<CSVUpload onDataParsed={mockOnDataParsed} onError={mockOnError} />);

    const csvContent = `username,repositories,notes
testuser,https://github.com/test/repo,Test notes`;

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Mock File.text() method
    mockFileText.mockResolvedValue(csvContent);
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnDataParsed).toHaveBeenCalledWith([
        {
          username: 'testuser',
          repositories: ['https://github.com/test/repo'],
          notes: 'Test notes',
        },
      ]);
    });
  });

  it('should show error for non-CSV files', async () => {
    render(<CSVUpload onDataParsed={mockOnDataParsed} onError={mockOnError} />);

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Please select a CSV file');
    });
  });

  it('should handle CSV parsing errors', async () => {
    render(<CSVUpload onDataParsed={mockOnDataParsed} onError={mockOnError} />);

    const invalidCsvContent = `user,repositories,notes
testuser,https://github.com/test/repo,Test notes`;

    const file = new File([invalidCsvContent], 'test.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    mockFileText.mockResolvedValue(invalidCsvContent);
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('CSV must contain a "username" column');
    });
  });

  it('should show parsed data preview', async () => {
    render(<CSVUpload onDataParsed={mockOnDataParsed} onError={mockOnError} />);

    const csvContent = `username,repositories,notes
testuser,https://github.com/test/repo,Test notes
user2,https://github.com/user2/repo,Another note`;

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    mockFileText.mockResolvedValue(csvContent);
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('CSV Parsed Successfully!')).toBeInTheDocument();
      expect(screen.getByText('Found 2 users ready for analysis')).toBeInTheDocument();
      expect(screen.getByText('Parsed Data Preview (2 users)')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
    });
  });

  it('should handle drag and drop', async () => {
    render(<CSVUpload onDataParsed={mockOnDataParsed} onError={mockOnError} />);

    const csvContent = `username,repositories,notes
testuser,https://github.com/test/repo,Test notes`;

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const dropZone = screen.getByText('Upload CSV File').closest('div');

    mockFileText.mockResolvedValue(csvContent);

    // Simulate drag enter
    fireEvent.dragEnter(dropZone!, {
      dataTransfer: { files: [file] },
    });

    // Simulate drop
    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(mockOnDataParsed).toHaveBeenCalledWith([
        {
          username: 'testuser',
          repositories: ['https://github.com/test/repo'],
          notes: 'Test notes',
        },
      ]);
    });
  });

  it('should allow clearing uploaded file', async () => {
    render(<CSVUpload onDataParsed={mockOnDataParsed} onError={mockOnError} />);

    const csvContent = `username,repositories,notes
testuser,https://github.com/test/repo,Test notes`;

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    mockFileText.mockResolvedValue(csvContent);
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });

    // Click clear button
    const clearButton = screen.getByText('×');
    fireEvent.click(clearButton);

    expect(screen.queryByText('test.csv')).not.toBeInTheDocument();
    expect(screen.queryByText('CSV Parsed Successfully!')).not.toBeInTheDocument();
  });
});