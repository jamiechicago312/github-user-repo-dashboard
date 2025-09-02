import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github';
import { CriteriaAnalyzer } from '@/lib/criteria';

export async function POST(request: NextRequest) {
  try {
    const { username, repoUrls } = await request.json();

    if (!username || !repoUrls || repoUrls.length === 0) {
      return NextResponse.json(
        { error: 'Username and repository URLs are required' },
        { status: 400 }
      );
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    const githubService = new GitHubService(token);
    const criteriaAnalyzer = new CriteriaAnalyzer();

    // Get user info
    const user = await githubService.getUser(username);

    const repositoryAnalyses = [];

    for (const url of repoUrls) {
      const parsed = githubService.parseRepoUrl(url);
      if (!parsed) {
        continue;
      }

      try {
        // Get repository info
        const repo = await githubService.getRepository(parsed.owner, parsed.repo);
        
        // Check user permissions
        const hasWriteAccess = await githubService.checkUserPermissions(
          parsed.owner, 
          parsed.repo, 
          username
        );

        // Get PR stats
        const stats = await githubService.getPullRequestStats(
          parsed.owner, 
          parsed.repo, 
          username
        );

        // Convert Set to Array for JSON serialization
        const serializedStats = {
          ...stats,
          externalContributors: Array.from(stats.externalContributors),
        };

        // Analyze against criteria
        const analysis = criteriaAnalyzer.analyzeRepository(repo, stats, hasWriteAccess);

        repositoryAnalyses.push({
          repo,
          stats: serializedStats,
          hasWriteAccess,
          analysis,
        });
      } catch (repoError) {
        console.error(`Error analyzing repository ${url}:`, repoError);
      }
    }

    // Calculate aggregated analysis if multiple repositories
    let aggregatedAnalysis = null;
    if (repositoryAnalyses.length > 0) {
      aggregatedAnalysis = criteriaAnalyzer.analyzeMultipleRepositories(
        repositoryAnalyses.map(ra => ra.analysis)
      );
    }

    return NextResponse.json({
      user,
      analyses: repositoryAnalyses,
      aggregatedAnalysis,
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred during analysis' },
      { status: 500 }
    );
  }
}