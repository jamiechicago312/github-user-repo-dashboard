# OpenHands OSS Credit Analyzer

A dashboard to analyze GitHub contributors against the OpenHands Cloud OSS Credit Program criteria. This tool helps evaluate whether contributors meet the requirements for $100-$500 in cloud credits.

## Features

- 🔍 **Comprehensive Analysis**: Evaluates all OSS Credit Program criteria
- 📊 **Visual Dashboard**: Clean, intuitive interface with status indicators
- 🚀 **Multi-Repository Support**: Analyze across multiple repositories
- 📈 **Detailed Metrics**: Shows exact numbers and percentages for each criterion
- 🎯 **Credit Recommendations**: Suggests appropriate credit amounts based on analysis

## Criteria Evaluated

The dashboard analyzes contributors against these requirements:

1. **Repository Stars**: Repository must have ≥100 GitHub stars
2. **Write Access**: User must have maintainer/write access to the repository
3. **Total Merged PRs**: Repository must show ≥20 merged PRs in the last 90 days
4. **External Contributors**: At least 2 distinct external contributors in the last 90 days
5. **User Merged PRs**: User must have personally authored ≥5 merged PRs in the last 90 days

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure GitHub Token

Edit the `.env.local` file and add your GitHub Personal Access Token:

```env
GITHUB_TOKEN=your_github_pat_here
```

#### Creating a GitHub Personal Access Token

1. Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `read:user` (Read user profile data)
   - `read:org` (Read organization membership)
4. Copy the generated token and paste it in your `.env.local` file

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Enter GitHub Username**: Input the GitHub username you want to analyze
2. **Add Repository URLs**: Enter one or more GitHub repository URLs (one per line)
3. **Click "Analyze Eligibility"**: The dashboard will fetch data and analyze against criteria
4. **Review Results**: See detailed breakdown of each criterion and overall recommendation

### Example Input

**GitHub Username**: `intellectronica`

**Repository URLs**:
```
https://github.com/intellectronica/ruler
```

## Status Indicators

- 🚀 **Exceeds**: Significantly above requirements (150%+ of minimum)
- ✅ **Meets**: Satisfies minimum criteria (100%+ of minimum)
- ❌ **Falls Short**: Below requirements (<100% of minimum)

## Credit Recommendations

Based on the analysis results:

- **Exceeds Requirements**: $500 credits recommended
- **Meets Requirements**: $300 credits recommended  
- **Falls Short**: Not recommended for credits

## Development

### Project Structure

```
src/
├── app/
│   ├── api/analyze/          # API route for GitHub analysis
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main dashboard page
├── components/
│   ├── GitHubAnalyzer.tsx    # Main analyzer component
│   └── AnalysisResults.tsx   # Results display component
└── lib/
    ├── github.ts             # GitHub API service
    └── criteria.ts           # Criteria analysis logic
```

### Key Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Octokit**: GitHub API client
- **Lucide React**: Icon library
