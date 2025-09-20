import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github';
import { CriteriaAnalyzer } from '@/lib/criteria';
import { DataStorage } from '@/lib/dataStorage';
import { CSVUserData } from '@/lib/csvParser';

interface BatchAnalysisResult {
  username: string;
  repositories: string[];
  notes?: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  analysis?: any;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { users, saveData = true } = await request.json();

    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'Users array is required and must not be empty' },
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
    const dataStorage = new DataStorage();

    const results: BatchAnalysisResult[] = [];

    // Process each user
    for (const userData of users as CSVUserData[]) {
      const result: BatchAnalysisResult = {
        username: userData.username,
        repositories: userData.repositories,
        notes: userData.notes,
        status: 'analyzing',
      };

      try {
        // Get user info
        const user = await githubService.getUser(userData.username);

        const repositoryAnalyses = [];

        // Analyze each repository for this user
        for (const repoUrl of userData.repositories) {
          const parsed = githubService.parseRepoUrl(repoUrl);
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
              userData.username
            );

            // Get PR stats
            const stats = await githubService.getPullRequestStats(
              parsed.owner, 
              parsed.repo, 
              userData.username
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
            console.error(`Error analyzing repository ${repoUrl} for user ${userData.username}:`, repoError);
          }
        }

        // Calculate aggregated analysis if repositories were analyzed
        let aggregatedAnalysis = null;
        if (repositoryAnalyses.length > 0) {
          aggregatedAnalysis = criteriaAnalyzer.analyzeMultipleRepositories(
            repositoryAnalyses.map(ra => ra.analysis)
          );
        }

        if (aggregatedAnalysis) {
          result.analysis = aggregatedAnalysis;
          result.status = 'completed';

          // Save analysis data if requested
          if (saveData) {
            try {
              // Get historical analysis before saving new data
              const historicalAnalysis = await dataStorage.getHistoricalAnalysis(
                user,
                userData.repositories,
                aggregatedAnalysis
              );

              // Save the current analysis
              await dataStorage.saveAnalysis(
                user,
                userData.repositories,
                aggregatedAnalysis,
                historicalAnalysis.isReapplication ? 'renewal' : 'initial',
                userData.notes
              );
            } catch (saveError) {
              console.error(`Error saving analysis for user ${userData.username}:`, saveError);
              // Don't fail the entire analysis if saving fails
            }
          }
        } else {
          result.status = 'error';
          result.error = 'No repositories could be analyzed';
        }

      } catch (userError) {
        result.status = 'error';
        result.error = userError instanceof Error ? userError.message : 'Failed to analyze user';
        console.error(`Error analyzing user ${userData.username}:`, userError);
      }

      results.push(result);
    }

    // Calculate summary statistics
    const summary = {
      total: results.length,
      completed: results.filter(r => r.status === 'completed').length,
      errors: results.filter(r => r.status === 'error').length,
      exceeds: results.filter(r => r.analysis?.overallStatus === 'exceeds').length,
      meets: results.filter(r => r.analysis?.overallStatus === 'meets').length,
      fallsShort: results.filter(r => r.analysis?.overallStatus === 'falls_short').length,
    };

    return NextResponse.json({
      results,
      summary,
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred during batch analysis' },
      { status: 500 }
    );
  }
}