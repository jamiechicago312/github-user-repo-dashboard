import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GitHubAnalyzer } from './GitHubAnalyzer';

// Mock fetch
global.fetch = jest.fn();

const mockUsers = ['testuser1', 'testuser2'];

const mockUserHistory = [
  {
    id: 'testuser1_1234567890',
    timestamp: '2023-12-01T10:00:00.000Z',
    username: 'testuser1',
    repositories: ['https://github.com/test/repo1', 'https://github.com/test/repo2'],
    applicationType: 'initial' as const,
    overallStatus: 'meets' as const,
    creditRecommendation: 300,
    notes: 'Initial application',
    criteriaResults: {
      repositoryStars: { actual: 150, status: 'meets', percentage: 150 },
      writeAccess: { actual: true, status: 'meets', percentage: 100 },
      totalMergedPRs: { actual: 25, status: 'meets', percentage: 125 },
      externalContributors: { actual: 3, status: 'meets', percentage: 150 },
      userMergedPRs: { actual: 8, status: 'meets', percentage: 160 }
    }
  },
  {
    id: 'testuser1_1234567800',
    timestamp: '2023-11-01T10:00:00.000Z',
    username: 'testuser1',
    repositories: ['https://github.com/test/repo1'],
    applicationType: 'renewal' as const,
    overallStatus: 'falls_short' as const,
    creditRecommendation: 0,
    notes: 'Renewal application',
    criteriaResults: {
      repositoryStars: { actual: 80, status: 'falls_short', percentage: 80 },
      writeAccess: { actual: true, status: 'meets', percentage: 100 },
      totalMergedPRs: { actual: 15, status: 'falls_short', percentage: 75 },
      externalContributors: { actual: 1, status: 'falls_short', percentage: 50 },
      userMergedPRs: { actual: 3, status: 'falls_short', percentage: 60 }
    }
  }
];

describe('GitHubAnalyzer - Previous Applicant Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the users API call
    (fetch as jest.MockedFunction<typeof fetch>).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: mockUsers })
        } as Response);
      }
      
      if (typeof url === 'string' && url.includes('/api/history?username=testuser1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ history: mockUserHistory })
        } as Response);
      }
      
      // Return empty response for other calls
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      } as Response);
    });
  });

  it('loads available users on component mount', async () => {
    render(<GitHubAnalyzer />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/users');
    });
  });

  it('displays user dropdown with available users', async () => {
    render(<GitHubAnalyzer />);
    
    await waitFor(() => {
      const dropdown = screen.getByLabelText('Previous Applicants');
      expect(dropdown).toBeInTheDocument();
    });
  });

  it('automatically loads and displays results when user is selected', async () => {
    render(<GitHubAnalyzer />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByLabelText('Previous Applicants')).toBeInTheDocument();
    });
    
    // Select a user
    const userDropdown = screen.getByLabelText('Previous Applicants');
    fireEvent.change(userDropdown, { target: { value: 'testuser1' } });
    
    // Should fetch user history and display results
    await waitFor(() => {
      expect(screen.getByDisplayValue('testuser1')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Initial application')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Should display the user's analysis results automatically
    await waitFor(() => {
      expect(screen.getByText('testuser1')).toBeInTheDocument();
      expect(screen.getByText('Overall Eligibility')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Should show stored data indicator
    await waitFor(() => {
      expect(screen.getByText(/Viewing stored data from/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays date dropdown when user has multiple analyses', async () => {
    render(<GitHubAnalyzer />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Previous Applicants')).toBeInTheDocument();
    });
    
    const userDropdown = screen.getByLabelText('Previous Applicants');
    fireEvent.change(userDropdown, { target: { value: 'testuser1' } });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Application Date')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Should show both dates
    const dateDropdown = screen.getByLabelText('Application Date');
    expect(dateDropdown).toBeInTheDocument();
  });

  it('automatically updates results when different date is selected', async () => {
    render(<GitHubAnalyzer />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Previous Applicants')).toBeInTheDocument();
    });
    
    // Select user
    const userDropdown = screen.getByLabelText('Previous Applicants');
    fireEvent.change(userDropdown, { target: { value: 'testuser1' } });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Application Date')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Initially should show the most recent (first) analysis
    await waitFor(() => {
      expect(screen.getByDisplayValue('Initial application')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Select the older date
    const dateDropdown = screen.getByLabelText('Application Date');
    fireEvent.change(dateDropdown, { target: { value: '2023-11-01T10:00:00.000Z' } });
    
    // Should update the form fields and results
    await waitFor(() => {
      expect(screen.getByDisplayValue('Renewal application')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('changes analyze button text when viewing stored data', async () => {
    render(<GitHubAnalyzer />);
    
    // Initially should show "Analyze Eligibility"
    expect(screen.getByText('Analyze Eligibility')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByLabelText('Previous Applicants')).toBeInTheDocument();
    });
    
    // Select user
    const userDropdown = screen.getByLabelText('Previous Applicants');
    fireEvent.change(userDropdown, { target: { value: 'testuser1' } });
    
    // Should change to "Re-analyze with Fresh Data"
    await waitFor(() => {
      expect(screen.getByText('Re-analyze with Fresh Data')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('clears results when switching to manual entry', async () => {
    render(<GitHubAnalyzer />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Previous Applicants')).toBeInTheDocument();
    });
    
    // Select user first
    const userDropdown = screen.getByLabelText('Previous Applicants');
    fireEvent.change(userDropdown, { target: { value: 'testuser1' } });
    
    await waitFor(() => {
      expect(screen.getByText('testuser1')).toBeInTheDocument();
    });
    
    // Manually change username
    const usernameInput = screen.getByLabelText('GitHub Username');
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    
    // Should clear the results and switch to manual entry mode
    await waitFor(() => {
      expect(screen.queryByText('Overall Eligibility')).not.toBeInTheDocument();
      expect(screen.getByText('Analyze Eligibility')).toBeInTheDocument();
    });
  });

  it('clears results when deselecting user', async () => {
    render(<GitHubAnalyzer />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Previous Applicants')).toBeInTheDocument();
    });
    
    // Select user first
    const userDropdown = screen.getByLabelText('Previous Applicants');
    fireEvent.change(userDropdown, { target: { value: 'testuser1' } });
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('testuser1')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Deselect user
    fireEvent.change(userDropdown, { target: { value: '' } });
    
    // Should clear everything
    await waitFor(() => {
      expect(screen.queryByText('Overall Eligibility')).not.toBeInTheDocument();
      const usernameInput = screen.getByLabelText('GitHub Username');
      expect(usernameInput).toHaveValue('');
    }, { timeout: 3000 });
  });

  it('shows correct status indicators for different analysis results', async () => {
    render(<GitHubAnalyzer />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Previous Applicants')).toBeInTheDocument();
    });
    
    // Select user
    const userDropdown = screen.getByLabelText('Previous Applicants');
    fireEvent.change(userDropdown, { target: { value: 'testuser1' } });
    
    // Should show "Meets Requirements" for the initial analysis
    await waitFor(() => {
      expect(screen.getByText('Meets Requirements')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Switch to the older analysis
    await waitFor(() => {
      expect(screen.getByLabelText('Application Date')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    const dateDropdown = screen.getByLabelText('Application Date');
    fireEvent.change(dateDropdown, { target: { value: '2023-11-01T10:00:00.000Z' } });
    
    // Should show "Falls Short" for the renewal analysis
    await waitFor(() => {
      expect(screen.getByText('Falls Short')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows clear button when user is selected and clears everything when clicked', async () => {
    render(<GitHubAnalyzer />);

    // Initially should not show clear button
    expect(screen.queryByText('Clear')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText('Previous Applicants')).toBeInTheDocument();
    });

    // Select user
    const userDropdown = screen.getByLabelText('Previous Applicants');
    fireEvent.change(userDropdown, { target: { value: 'testuser1' } });

    // Should show clear button
    await waitFor(() => {
      expect(screen.getByText('Clear')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show existing data status
    await waitFor(() => {
      expect(screen.getByText('Existing Data')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click clear button
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    // Should clear everything and return to new entry mode
    await waitFor(() => {
      expect(screen.getByText('New Entry')).toBeInTheDocument();
      expect(screen.queryByText('Clear')).not.toBeInTheDocument();
      expect(screen.getByText('Analyze Eligibility')).toBeInTheDocument();
      
      const usernameInput = screen.getByLabelText('GitHub Username');
      expect(usernameInput).toHaveValue('');
      
      const repoInput = screen.getByLabelText('Repository URLs (one per line)');
      expect(repoInput).toHaveValue('');
      
      const notesInput = screen.getByLabelText('Notes (Optional)');
      expect(notesInput).toHaveValue('');
    }, { timeout: 3000 });
  });
});