export interface CSVUserData {
  username: string;
  repositories: string[];
  notes?: string;
}

export class CSVParser {
  static parseCSV(csvContent: string): CSVUserData[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must contain at least a header row and one data row');
    }

    const headers = this.parseCSVLine(lines[0]);
    const usernameIndex = headers.findIndex(h => h.toLowerCase() === 'username');
    const repositoriesIndex = headers.findIndex(h => h.toLowerCase() === 'repositories');
    const notesIndex = headers.findIndex(h => h.toLowerCase() === 'notes');

    if (usernameIndex === -1) {
      throw new Error('CSV must contain a "username" column');
    }
    if (repositoriesIndex === -1) {
      throw new Error('CSV must contain a "repositories" column');
    }

    const users: CSVUserData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVLine(lines[i]);
      
      if (row.length <= usernameIndex || !row[usernameIndex].trim()) {
        continue; // Skip empty rows or rows without username
      }

      const username = row[usernameIndex].trim();
      const repositoriesText = row[repositoriesIndex] || '';
      const notes = notesIndex >= 0 && row[notesIndex] ? row[notesIndex].trim() : undefined;

      // Parse repositories - they can be separated by newlines or commas
      const repositories = repositoriesText
        .split(/[\n,]/)
        .map(repo => repo.trim())
        .filter(repo => repo.length > 0);

      if (repositories.length === 0) {
        throw new Error(`User "${username}" must have at least one repository`);
      }

      users.push({
        username,
        repositories,
        notes,
      });
    }

    if (users.length === 0) {
      throw new Error('No valid user data found in CSV');
    }

    return users;
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current);

    return result;
  }

  static validateCSVStructure(csvContent: string): { isValid: boolean; error?: string } {
    try {
      this.parseCSV(csvContent);
      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Unknown validation error' 
      };
    }
  }
}