import { promises as fs } from 'fs';
import path from 'path';
import { AnalysisResult } from './criteria';
import { GitHubUser } from './github';

export interface AnalysisRecord {
  id: string;
  timestamp: string;
  username: string;
  repositories: string[];
  applicationType: 'initial' | 'renewal';
  overallStatus: 'exceeds' | 'meets' | 'falls_short';
  creditRecommendation: number;
  criteriaResults: {
    repositoryStars: { status: string; actual: number; percentage: number };
    writeAccess: { status: string; actual: boolean; percentage: number };
    totalMergedPRs: { status: string; actual: number; percentage: number };
    externalContributors: { status: string; actual: number; percentage: number };
    userMergedPRs: { status: string; actual: number; percentage: number };
  };
  notes?: string;
}

export interface HistoricalAnalysis {
  currentAnalysis: AnalysisRecord;
  previousAnalyses: AnalysisRecord[];
  isReapplication: boolean;
  daysSinceLastApplication?: number;
  statusChange?: 'improved' | 'declined' | 'same';
  trends: {
    stars: 'up' | 'down' | 'same';
    totalPRs: 'up' | 'down' | 'same';
    userPRs: 'up' | 'down' | 'same';
    contributors: 'up' | 'down' | 'same';
  };
}

export class DataStorage {
  private dataDir: string;
  private csvPath: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.csvPath = path.join(this.dataDir, 'analyses.csv');
  }

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  private async ensureCsvFile(): Promise<void> {
    try {
      await fs.access(this.csvPath);
    } catch {
      const headers = [
        'id',
        'timestamp',
        'username',
        'repositories',
        'applicationType',
        'overallStatus',
        'creditRecommendation',
        'repositoryStars_status',
        'repositoryStars_actual',
        'repositoryStars_percentage',
        'writeAccess_status',
        'writeAccess_actual',
        'writeAccess_percentage',
        'totalMergedPRs_status',
        'totalMergedPRs_actual',
        'totalMergedPRs_percentage',
        'externalContributors_status',
        'externalContributors_actual',
        'externalContributors_percentage',
        'userMergedPRs_status',
        'userMergedPRs_actual',
        'userMergedPRs_percentage',
        'notes'
      ].join(',') + '\n';
      
      await fs.writeFile(this.csvPath, headers);
    }
  }

  private recordToCsvRow(record: AnalysisRecord): string {
    const escapeCsv = (value: any): string => {
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    return [
      record.id,
      record.timestamp,
      record.username,
      escapeCsv(record.repositories.join(';')),
      record.applicationType,
      record.overallStatus,
      record.creditRecommendation,
      record.criteriaResults.repositoryStars.status,
      record.criteriaResults.repositoryStars.actual,
      record.criteriaResults.repositoryStars.percentage,
      record.criteriaResults.writeAccess.status,
      record.criteriaResults.writeAccess.actual,
      record.criteriaResults.writeAccess.percentage,
      record.criteriaResults.totalMergedPRs.status,
      record.criteriaResults.totalMergedPRs.actual,
      record.criteriaResults.totalMergedPRs.percentage,
      record.criteriaResults.externalContributors.status,
      record.criteriaResults.externalContributors.actual,
      record.criteriaResults.externalContributors.percentage,
      record.criteriaResults.userMergedPRs.status,
      record.criteriaResults.userMergedPRs.actual,
      record.criteriaResults.userMergedPRs.percentage,
      escapeCsv(record.notes || '')
    ].join(',') + '\n';
  }

  private csvRowToRecord(row: string): AnalysisRecord | null {
    try {
      const columns = this.parseCsvRow(row);
      if (columns.length < 23) return null;

      return {
        id: columns[0],
        timestamp: columns[1],
        username: columns[2],
        repositories: columns[3].split(';').filter(r => r.length > 0),
        applicationType: columns[4] as 'initial' | 'renewal',
        overallStatus: columns[5] as 'exceeds' | 'meets' | 'falls_short',
        creditRecommendation: parseInt(columns[6]),
        criteriaResults: {
          repositoryStars: {
            status: columns[7],
            actual: parseInt(columns[8]),
            percentage: parseFloat(columns[9])
          },
          writeAccess: {
            status: columns[10],
            actual: columns[11] === 'true',
            percentage: parseFloat(columns[12])
          },
          totalMergedPRs: {
            status: columns[13],
            actual: parseInt(columns[14]),
            percentage: parseFloat(columns[15])
          },
          externalContributors: {
            status: columns[16],
            actual: parseInt(columns[17]),
            percentage: parseFloat(columns[18])
          },
          userMergedPRs: {
            status: columns[19],
            actual: parseInt(columns[20]),
            percentage: parseFloat(columns[21])
          }
        },
        notes: columns[22] || undefined
      };
    } catch (error) {
      console.error('Error parsing CSV row:', error);
      return null;
    }
  }

  private parseCsvRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < row.length) {
      const char = row[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
      i++;
    }
    
    result.push(current);
    return result;
  }

  async saveAnalysis(
    user: GitHubUser,
    repositories: string[],
    analysis: AnalysisResult,
    applicationType: 'initial' | 'renewal' = 'initial',
    notes?: string
  ): Promise<string> {
    await this.ensureDataDirectory();
    await this.ensureCsvFile();

    const id = `${user.login}_${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Extract criteria results
    const criteriaMap = analysis.criteria.reduce((acc, criterion) => {
      const key = criterion.criterion.toLowerCase().replace(/[^a-z]/g, '');
      acc[key] = {
        status: criterion.status,
        actual: criterion.actual,
        percentage: criterion.percentage
      };
      return acc;
    }, {} as any);

    const record: AnalysisRecord = {
      id,
      timestamp,
      username: user.login,
      repositories,
      applicationType,
      overallStatus: analysis.overallStatus,
      creditRecommendation: this.getCreditRecommendation(analysis.overallStatus),
      criteriaResults: {
        repositoryStars: criteriaMap.repositorystars || criteriaMap.stars,
        writeAccess: criteriaMap.writeaccess || criteriaMap.access,
        totalMergedPRs: criteriaMap.totalmergedprs || criteriaMap.totalprs,
        externalContributors: criteriaMap.externalcontributors || criteriaMap.contributors,
        userMergedPRs: criteriaMap.usermergedprs || criteriaMap.userprs
      },
      notes
    };

    const csvRow = this.recordToCsvRow(record);
    await fs.appendFile(this.csvPath, csvRow);

    return id;
  }

  async getUserHistory(username: string): Promise<AnalysisRecord[]> {
    try {
      await this.ensureCsvFile();
      const content = await fs.readFile(this.csvPath, 'utf-8');
      const lines = content.split('\n').slice(1); // Skip header
      
      const records = lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => this.csvRowToRecord(line))
        .filter((record): record is AnalysisRecord => record !== null)
        .filter(record => record.username === username)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return records;
    } catch (error) {
      console.error('Error reading user history:', error);
      return [];
    }
  }

  async getHistoricalAnalysis(
    user: GitHubUser,
    repositories: string[],
    currentAnalysis: AnalysisResult
  ): Promise<HistoricalAnalysis> {
    const previousAnalyses = await this.getUserHistory(user.login);
    const isReapplication = previousAnalyses.length > 0;

    let daysSinceLastApplication: number | undefined;
    let statusChange: 'improved' | 'declined' | 'same' | undefined;
    let trends = {
      stars: 'same' as 'up' | 'down' | 'same',
      totalPRs: 'same' as 'up' | 'down' | 'same',
      userPRs: 'same' as 'up' | 'down' | 'same',
      contributors: 'same' as 'up' | 'down' | 'same'
    };

    if (previousAnalyses.length > 0) {
      const lastAnalysis = previousAnalyses[0];
      const lastDate = new Date(lastAnalysis.timestamp);
      const currentDate = new Date();
      daysSinceLastApplication = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      // Compare overall status
      const statusOrder = { 'falls_short': 0, 'meets': 1, 'exceeds': 2 };
      const currentStatusValue = statusOrder[currentAnalysis.overallStatus];
      const lastStatusValue = statusOrder[lastAnalysis.overallStatus];

      if (currentStatusValue > lastStatusValue) {
        statusChange = 'improved';
      } else if (currentStatusValue < lastStatusValue) {
        statusChange = 'declined';
      } else {
        statusChange = 'same';
      }

      // Calculate trends
      const currentCriteria = this.extractCriteriaFromAnalysis(currentAnalysis);
      const lastCriteria = lastAnalysis.criteriaResults;

      trends.stars = this.compareTrend(currentCriteria.repositoryStars.actual, lastCriteria.repositoryStars.actual);
      trends.totalPRs = this.compareTrend(currentCriteria.totalMergedPRs.actual, lastCriteria.totalMergedPRs.actual);
      trends.userPRs = this.compareTrend(currentCriteria.userMergedPRs.actual, lastCriteria.userMergedPRs.actual);
      trends.contributors = this.compareTrend(currentCriteria.externalContributors.actual, lastCriteria.externalContributors.actual);
    }

    // Create current record
    const currentRecord: AnalysisRecord = {
      id: `${user.login}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      username: user.login,
      repositories,
      applicationType: isReapplication ? 'renewal' : 'initial',
      overallStatus: currentAnalysis.overallStatus,
      creditRecommendation: this.getCreditRecommendation(currentAnalysis.overallStatus),
      criteriaResults: this.extractCriteriaFromAnalysis(currentAnalysis)
    };

    return {
      currentAnalysis: currentRecord,
      previousAnalyses,
      isReapplication,
      daysSinceLastApplication,
      statusChange,
      trends
    };
  }

  private extractCriteriaFromAnalysis(analysis: AnalysisResult): AnalysisRecord['criteriaResults'] {
    const criteriaMap = analysis.criteria.reduce((acc, criterion) => {
      const key = criterion.criterion.toLowerCase().replace(/[^a-z]/g, '');
      acc[key] = {
        status: criterion.status,
        actual: criterion.actual,
        percentage: criterion.percentage
      };
      return acc;
    }, {} as any);

    return {
      repositoryStars: criteriaMap.repositorystars || criteriaMap.stars || { status: 'falls_short', actual: 0, percentage: 0 },
      writeAccess: criteriaMap.writeaccess || criteriaMap.access || { status: 'falls_short', actual: false, percentage: 0 },
      totalMergedPRs: criteriaMap.totalmergedprs || criteriaMap.totalprs || { status: 'falls_short', actual: 0, percentage: 0 },
      externalContributors: criteriaMap.externalcontributors || criteriaMap.contributors || { status: 'falls_short', actual: 0, percentage: 0 },
      userMergedPRs: criteriaMap.usermergedprs || criteriaMap.userprs || { status: 'falls_short', actual: 0, percentage: 0 }
    };
  }

  private compareTrend(current: number | boolean, previous: number | boolean): 'up' | 'down' | 'same' {
    const currentVal = typeof current === 'boolean' ? (current ? 1 : 0) : current;
    const previousVal = typeof previous === 'boolean' ? (previous ? 1 : 0) : previous;

    if (currentVal > previousVal) return 'up';
    if (currentVal < previousVal) return 'down';
    return 'same';
  }

  private getCreditRecommendation(status: 'exceeds' | 'meets' | 'falls_short'): number {
    switch (status) {
      case 'exceeds': return 500;
      case 'meets': return 300;
      case 'falls_short': return 0;
    }
  }

  async getAllAnalyses(): Promise<AnalysisRecord[]> {
    try {
      await this.ensureCsvFile();
      const content = await fs.readFile(this.csvPath, 'utf-8');
      const lines = content.split('\n').slice(1); // Skip header
      
      return lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => this.csvRowToRecord(line))
        .filter((record): record is AnalysisRecord => record !== null)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error reading all analyses:', error);
      return [];
    }
  }
}