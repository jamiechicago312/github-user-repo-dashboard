import { CSVParser } from '@/lib/csvParser';

describe('CSVParser', () => {
  describe('parseCSV', () => {
    it('should parse valid CSV with all columns', () => {
      const csvContent = `username,repositories,notes
testuser,"https://github.com/test/repo1,https://github.com/test/repo2",Test notes
user2,https://github.com/user2/repo,Another note`;

      const result = CSVParser.parseCSV(csvContent);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        username: 'testuser',
        repositories: ['https://github.com/test/repo1', 'https://github.com/test/repo2'],
        notes: 'Test notes',
      });
      expect(result[1]).toEqual({
        username: 'user2',
        repositories: ['https://github.com/user2/repo'],
        notes: 'Another note',
      });
    });

    it('should parse CSV with comma-separated repositories', () => {
      const csvContent = `username,repositories,notes
testuser,"https://github.com/test/repo1,https://github.com/test/repo2",Test notes`;

      const result = CSVParser.parseCSV(csvContent);

      expect(result).toHaveLength(1);
      expect(result[0].repositories).toEqual([
        'https://github.com/test/repo1',
        'https://github.com/test/repo2',
      ]);
    });

    it('should parse CSV without notes column', () => {
      const csvContent = `username,repositories
testuser,https://github.com/test/repo1
user2,https://github.com/user2/repo`;

      const result = CSVParser.parseCSV(csvContent);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        username: 'testuser',
        repositories: ['https://github.com/test/repo1'],
        notes: undefined,
      });
      expect(result[1]).toEqual({
        username: 'user2',
        repositories: ['https://github.com/user2/repo'],
        notes: undefined,
      });
    });

    it('should handle quoted fields with commas', () => {
      const csvContent = `username,repositories,notes
"test,user","https://github.com/test/repo","Notes with, commas"`;

      const result = CSVParser.parseCSV(csvContent);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        username: 'test,user',
        repositories: ['https://github.com/test/repo'],
        notes: 'Notes with, commas',
      });
    });

    it('should handle escaped quotes', () => {
      const csvContent = `username,repositories,notes
testuser,https://github.com/test/repo,"Notes with ""quotes"""`;

      const result = CSVParser.parseCSV(csvContent);

      expect(result).toHaveLength(1);
      expect(result[0].notes).toBe('Notes with "quotes"');
    });

    it('should skip empty rows', () => {
      const csvContent = `username,repositories,notes
testuser,https://github.com/test/repo,Test notes

user2,https://github.com/user2/repo,Another note`;

      const result = CSVParser.parseCSV(csvContent);

      expect(result).toHaveLength(2);
      expect(result[0].username).toBe('testuser');
      expect(result[1].username).toBe('user2');
    });

    it('should throw error for missing username column', () => {
      const csvContent = `user,repositories,notes
testuser,https://github.com/test/repo,Test notes`;

      expect(() => CSVParser.parseCSV(csvContent)).toThrow(
        'CSV must contain a "username" column'
      );
    });

    it('should throw error for missing repositories column', () => {
      const csvContent = `username,repos,notes
testuser,https://github.com/test/repo,Test notes`;

      expect(() => CSVParser.parseCSV(csvContent)).toThrow(
        'CSV must contain a "repositories" column'
      );
    });

    it('should throw error for user without repositories', () => {
      const csvContent = `username,repositories,notes
testuser,,Test notes`;

      expect(() => CSVParser.parseCSV(csvContent)).toThrow(
        'User "testuser" must have at least one repository'
      );
    });

    it('should throw error for empty CSV', () => {
      const csvContent = `username,repositories,notes`;

      expect(() => CSVParser.parseCSV(csvContent)).toThrow(
        'CSV must contain at least a header row and one data row'
      );
    });

    it('should throw error for CSV with only header', () => {
      const csvContent = `username,repositories,notes`;

      expect(() => CSVParser.parseCSV(csvContent)).toThrow(
        'CSV must contain at least a header row and one data row'
      );
    });

    it('should handle whitespace in fields', () => {
      const csvContent = `username,repositories,notes
  testuser  ,  https://github.com/test/repo  ,  Test notes  `;

      const result = CSVParser.parseCSV(csvContent);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        username: 'testuser',
        repositories: ['https://github.com/test/repo'],
        notes: 'Test notes',
      });
    });
  });

  describe('validateCSVStructure', () => {
    it('should return valid for correct CSV', () => {
      const csvContent = `username,repositories,notes
testuser,https://github.com/test/repo,Test notes`;

      const result = CSVParser.validateCSVStructure(csvContent);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid with error message for incorrect CSV', () => {
      const csvContent = `user,repositories,notes
testuser,https://github.com/test/repo,Test notes`;

      const result = CSVParser.validateCSVStructure(csvContent);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('CSV must contain a "username" column');
    });

    it('should return invalid for empty CSV', () => {
      const csvContent = '';

      const result = CSVParser.validateCSVStructure(csvContent);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must contain at least a header row');
    });
  });
});