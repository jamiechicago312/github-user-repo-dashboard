import { GET } from './route';
import { DataStorage } from '@/lib/dataStorage';

// Mock the DataStorage class
jest.mock('@/lib/dataStorage');

describe('/api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return unique users successfully', async () => {
      const mockUsers = ['user1', 'user2', 'user3'];
      const mockGetUniqueUsers = jest.fn().mockResolvedValue(mockUsers);
      
      (DataStorage as jest.MockedClass<typeof DataStorage>).mockImplementation(() => ({
        getUniqueUsers: mockGetUniqueUsers,
      } as any));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ users: mockUsers });
      expect(mockGetUniqueUsers).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      const mockGetUniqueUsers = jest.fn().mockRejectedValue(new Error('Database error'));
      
      (DataStorage as jest.MockedClass<typeof DataStorage>).mockImplementation(() => ({
        getUniqueUsers: mockGetUniqueUsers,
      } as any));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch users' });
    });
  });
});