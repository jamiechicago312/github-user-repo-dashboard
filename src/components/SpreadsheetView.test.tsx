import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SpreadsheetView } from './SpreadsheetView';

// Mock fetch
global.fetch = jest.fn();

const mockAnalyses = [
  {
    id: '1',
    username: 'testuser',
    timestamp: '2023-01-01T00:00:00.000Z',
    applicationType: 'initial' as const,
    overallStatus: 'meets' as const,
    creditRecommendation: 300,
    notes: 'Test notes',
    repositories: ['https://github.com/test/repo'],
    criteriaResults: {
      repositoryStars: { actual: 100, threshold: 50, status: 'exceeds' as const },
      totalMergedPRs: { actual: 20, threshold: 10, status: 'exceeds' as const },
      userMergedPRs: { actual: 15, threshold: 5, status: 'exceeds' as const },
      externalContributors: { actual: 8, threshold: 3, status: 'exceeds' as const },
      writeAccess: { actual: true, threshold: true, status: 'meets' as const }
    }
  }
];

describe('SpreadsheetView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<SpreadsheetView />);
    expect(screen.getByText('Loading analyses...')).toBeInTheDocument();
  });

  it('renders analyses data correctly', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ analyses: mockAnalyses })
    } as Response);

    render(<SpreadsheetView />);

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('Test notes')).toBeInTheDocument();
      expect(screen.getByText('$300')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  it('handles edit notes functionality', async () => {
    (fetch as jest.MockedFunction<typeof fetch>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analyses: mockAnalyses })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

    render(<SpreadsheetView />);

    await waitFor(() => {
      expect(screen.getByText('Test notes')).toBeInTheDocument();
    });

    // Click edit button (should appear on hover)
    const notesCell = screen.getByText('Test notes').closest('td');
    fireEvent.mouseEnter(notesCell!);
    
    const editButton = screen.getByTitle('Edit notes');
    fireEvent.click(editButton);

    // Should show textarea
    const textarea = screen.getByDisplayValue('Test notes');
    expect(textarea).toBeInTheDocument();

    // Edit the notes
    fireEvent.change(textarea, { target: { value: 'Updated notes' } });

    // Save the changes
    const saveButton = screen.getByTitle('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/analyses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1', notes: 'Updated notes' })
      });
    });
  });

  it('handles cancel edit functionality', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ analyses: mockAnalyses })
    } as Response);

    render(<SpreadsheetView />);

    await waitFor(() => {
      expect(screen.getByText('Test notes')).toBeInTheDocument();
    });

    // Click edit button
    const notesCell = screen.getByText('Test notes').closest('td');
    fireEvent.mouseEnter(notesCell!);
    
    const editButton = screen.getByTitle('Edit notes');
    fireEvent.click(editButton);

    // Should show textarea
    const textarea = screen.getByDisplayValue('Test notes');
    expect(textarea).toBeInTheDocument();

    // Cancel the edit
    const cancelButton = screen.getByTitle('Cancel');
    fireEvent.click(cancelButton);

    // Should go back to display mode
    expect(screen.getByText('Test notes')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Test notes')).not.toBeInTheDocument();
  });

  it('displays error state when fetch fails', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(<SpreadsheetView />);

    await waitFor(() => {
      expect(screen.getByText('Error loading analyses')).toBeInTheDocument();
    });
  });

  it('displays empty state when no analyses', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ analyses: [] })
    } as Response);

    render(<SpreadsheetView />);

    await waitFor(() => {
      expect(screen.getByText('No analyses found')).toBeInTheDocument();
    });
  });
});