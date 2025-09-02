# OpenHands OSS Credit Analyzer

A Next.js dashboard for analyzing GitHub contributors against the OpenHands Cloud OSS Credit Program criteria. This tool helps evaluate whether contributors meet the requirements for $100-$500 in cloud credits.

## Features

- 🔍 **Comprehensive Analysis**: Evaluates all 5 criteria for OSS credit eligibility
- 📊 **Reapplication Tracking**: Detects and tracks renewal applications with historical comparison
- 📈 **Performance Trends**: Shows improvement/decline trends across key metrics
- 💾 **Local CSV Storage**: Stores analysis data locally for tracking and reporting
- 🎯 **Visual Indicators**: Clear status indicators (Exceeds/Meets/Falls Short)
- 📝 **Notes System**: Add contextual notes to each analysis

## Eligibility Criteria

The dashboard evaluates contributors against these requirements:

1. **Repository Stars**: ≥100 stars
2. **Write Access**: User must have maintainer or write access to the repository
3. **Total Merged PRs**: ≥20 merged PRs from all contributors in last 90 days
4. **External Contributors**: ≥2 distinct external contributors in last 90 days
5. **User Merged PRs**: ≥5 merged PRs authored by the user in last 90 days

## Prerequisites

- Node.js 18+ and npm
- GitHub Personal Access Token (Classic)

## GitHub Token Setup

### Required Permissions

Create a GitHub Personal Access Token (Classic) with the following **minimum permissions**:

#### Public Repositories (Recommended)
For analyzing public repositories only:
- ✅ **`public_repo`** - Access public repositories

#### All Repositories (If needed)
For analyzing both public and private repositories:
- ✅ **`repo`** - Full control of private repositories

### Token Scopes Explained

The application makes the following GitHub API calls:
- `GET /users/{username}` - Get user profile information
- `GET /repos/{owner}/{repo}` - Get repository details and star count
- `GET /repos/{owner}/{repo}/collaborators/{username}/permission` - Check user's permission level
- `GET /repos/{owner}/{repo}/pulls` - List pull requests for contribution analysis
- `GET /users/{username}/repos` - List user's repositories

### Creating Your Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Set an appropriate expiration date
4. Select the required scopes:
   - For public repos only: Check `public_repo`
   - For all repos: Check `repo`
5. Click "Generate token"
6. **Important**: Copy the token immediately - you won't be able to see it again

### Security Best Practices

- ✅ Use the **minimum required permissions** (`public_repo` for public repositories)
- ✅ Set a reasonable **expiration date** for your token
- ✅ Store the token securely in `.env.local` (never commit to version control)
- ✅ Regenerate tokens periodically
- ❌ Never share your token or commit it to version control

## Installation

1. Clone the repository:
```bash
git clone https://github.com/jamiechicago312/github-user-repo-dashboard.git
cd github-user-repo-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Add your GitHub token to `.env.local`:
```env
GITHUB_TOKEN=your_github_personal_access_token_here
```

## Usage

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Enter a GitHub username and repository URL(s)

4. Optionally add notes and enable data saving for reapplication tracking

5. Click "Analyze Eligibility" to see results

## Data Storage

When "Save analysis data locally" is enabled:
- Analysis results are stored in `data/analyses.csv`
- Enables reapplication detection and historical trend analysis
- Data includes timestamps, criteria results, and notes
- CSV format allows easy import into spreadsheets or other tools

## Reapplication Features

- **Automatic Detection**: Identifies when a user reapplies for credits
- **Historical Comparison**: Shows performance changes since last application
- **Trend Analysis**: Visualizes improvement/decline in key metrics
- **Application History**: Timeline of all previous applications
- **Renewal Assessment**: Contextual recommendations for renewals

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Project Structure

```
src/
├── app/
│   ├── api/analyze/          # Analysis API endpoint
│   ├── api/history/          # Historical data API
│   └── page.tsx              # Main dashboard page
├── components/
│   ├── GitHubAnalyzer.tsx    # Main analysis form
│   ├── AnalysisResults.tsx   # Results display
│   └── HistoricalAnalysis.tsx # Reapplication tracking
└── lib/
    ├── github.ts             # GitHub API service
    ├── criteria.ts           # Eligibility criteria logic
    └── dataStorage.ts        # CSV data persistence
```

## API Endpoints

- `POST /api/analyze` - Analyze user eligibility
- `GET /api/history?username={username}` - Get user's application history

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Security

- Never commit your GitHub token to version control
- The `.env.local` file is automatically ignored by git
- Use minimum required token permissions
- Regularly rotate your GitHub tokens

## Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce