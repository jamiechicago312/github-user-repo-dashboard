import { Octokit } from '@octokit/rest';
import { subDays } from 'date-fns';

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  public_repos: number;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  stargazers_count: number;
  html_url: string;
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

export interface PullRequest {
  number: number;
  title: string;
  user: {
    login: string;
  };
  merged_at: string | null;
  created_at: string;
  html_url: string;
}

export interface ContributorStats {
  totalMergedPRs: number;
  userMergedPRs: number;
  externalContributors: Set<string>;
  recentPRs: PullRequest[];
}

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async getUser(username: string): Promise<GitHubUser> {
    const { data } = await this.octokit.rest.users.getByUsername({
      username,
    });
    return data;
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepo> {
    const { data } = await this.octokit.rest.repos.get({
      owner,
      repo,
    });
    return data;
  }

  async checkUserPermissions(owner: string, repo: string, username: string): Promise<boolean> {
    try {
      const { data } = await this.octokit.rest.repos.getCollaboratorPermissionLevel({
        owner,
        repo,
        username,
      });
      
      // Check if user has write access or higher (admin, maintain, push)
      return ['admin', 'maintain', 'write'].includes(data.permission);
    } catch (error) {
      // If we can't check permissions, assume false
      return false;
    }
  }

  async getPullRequestStats(owner: string, repo: string, username: string, days: number = 90): Promise<ContributorStats> {
    const since = subDays(new Date(), days).toISOString();
    const externalContributors = new Set<string>();
    let totalMergedPRs = 0;
    let userMergedPRs = 0;
    const recentPRs: PullRequest[] = [];

    try {
      // Get all merged PRs in the last 90 days
      const { data: pullRequests } = await this.octokit.rest.pulls.list({
        owner,
        repo,
        state: 'closed',
        sort: 'updated',
        direction: 'desc',
        per_page: 100,
      });

      for (const pr of pullRequests) {
        if (pr.merged_at && new Date(pr.merged_at) >= new Date(since)) {
          totalMergedPRs++;
          recentPRs.push(pr);

          // Check if this is the target user's PR
          if (pr.user?.login === username) {
            userMergedPRs++;
          } else {
            // Add to external contributors if not the repo owner
            if (pr.user?.login !== owner) {
              externalContributors.add(pr.user?.login || '');
            }
          }
        }
      }

      // If we have exactly 100 PRs, there might be more - fetch additional pages
      if (pullRequests.length === 100) {
        let page = 2;
        let hasMore = true;

        while (hasMore && page <= 5) { // Limit to 5 pages to avoid rate limits
          const { data: morePRs } = await this.octokit.rest.pulls.list({
            owner,
            repo,
            state: 'closed',
            sort: 'updated',
            direction: 'desc',
            per_page: 100,
            page,
          });

          if (morePRs.length === 0) {
            hasMore = false;
            break;
          }

          for (const pr of morePRs) {
            if (pr.merged_at && new Date(pr.merged_at) >= new Date(since)) {
              totalMergedPRs++;
              recentPRs.push(pr);

              if (pr.user?.login === username) {
                userMergedPRs++;
              } else if (pr.user?.login !== owner) {
                externalContributors.add(pr.user?.login || '');
              }
            } else if (pr.merged_at && new Date(pr.merged_at) < new Date(since)) {
              // If we've reached PRs older than our date range, stop
              hasMore = false;
              break;
            }
          }

          page++;
        }
      }

    } catch (error) {
      console.error('Error fetching PR stats:', error);
    }

    return {
      totalMergedPRs,
      userMergedPRs,
      externalContributors,
      recentPRs: recentPRs.sort((a, b) => 
        new Date(b.merged_at || b.created_at).getTime() - 
        new Date(a.merged_at || a.created_at).getTime()
      ),
    };
  }

  async getUserRepositories(username: string): Promise<GitHubRepo[]> {
    try {
      const { data } = await this.octokit.rest.repos.listForUser({
        username,
        type: 'all',
        sort: 'updated',
        per_page: 100,
      });
      
      return data.filter(repo => repo.stargazers_count >= 100);
    } catch (error) {
      console.error('Error fetching user repositories:', error);
      return [];
    }
  }

  parseRepoUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
      };
    }
    return null;
  }
}