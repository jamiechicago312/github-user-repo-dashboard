import { GET, PATCH } from './route';
import { DataStorage } from '@/lib/dataStorage';
import { NextRequest } from 'next/server';

// Mock the DataStorage class
jest.mock('@/lib/dataStorage');

describe('/api/analyses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return all analyses successfully', async () => {
      const mockAnalyses = [
        {
          id: '1',
          username: 'user1',
          timestamp: '2023-01-01T00:00:00.000Z',
          notes: 'Test notes'
        }
      ];
      const mockGetAllAnalyses = jest.fn().mockResolvedValue(mockAnalyses);
      
      (DataStorage as jest.MockedClass<typeof DataStorage>).mockImplementation(() => ({
        getAllAnalyses: mockGetAllAnalyses,
      } as any));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ analyses: mockAnalyses });
      expect(mockGetAllAnalyses).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      const mockGetAllAnalyses = jest.fn().mockRejectedValue(new Error('Database error'));
      
      (DataStorage as jest.MockedClass<typeof DataStorage>).mockImplementation(() => ({
        getAllAnalyses: mockGetAllAnalyses,
      } as any));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch analyses' });
    });
  });

  describe('PATCH', () => {
    it('should update analysis notes successfully', async () => {
      const mockUpdateAnalysisNotes = jest.fn().mockResolvedValue(true);
      
      (DataStorage as jest.MockedClass<typeof DataStorage>).mockImplementation(() => ({
        updateAnalysisNotes: mockUpdateAnalysisNotes,
      } as any));

      const requestBody = { id: '1', notes: 'Updated notes' };
      const request = new NextRequest('http://localhost:3000/api/analyses', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(mockUpdateAnalysisNotes).toHaveBeenCalledWith('1', 'Updated notes');
    });

    it('should handle missing id', async () => {
      const requestBody = { notes: 'Updated notes' };
      const request = new NextRequest('http://localhost:3000/api/analyses', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Missing id or notes' });
    });

    it('should handle database errors', async () => {
      const mockUpdateAnalysisNotes = jest.fn().mockRejectedValue(new Error('Database error'));
      
      (DataStorage as jest.MockedClass<typeof DataStorage>).mockImplementation(() => ({
        updateAnalysisNotes: mockUpdateAnalysisNotes,
      } as any));

      const requestBody = { id: '1', notes: 'Updated notes' };
      const request = new NextRequest('http://localhost:3000/api/analyses', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to update notes' });
    });
  });
});