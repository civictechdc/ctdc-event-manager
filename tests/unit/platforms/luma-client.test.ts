import { describe, it, expect, vi } from 'vitest';
import { LumaClient } from '@/platforms/luma/luma-client';
import { LumaAuthError, LumaApiError } from '@/platforms/luma/luma-errors';

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      request: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      defaults: {
        headers: {
          common: {}
        }
      }
    })),
    isAxiosError: vi.fn((error) => error.isAxiosError)
  }
}));

describe('LumaClient', () => {
  describe('constructor', () => {
    it('should throw error with empty API key', () => {
      expect(() => new LumaClient('')).toThrow(LumaAuthError);
      expect(() => new LumaClient('  ')).toThrow(LumaAuthError);
    });

    it('should create client with valid API key', () => {
      const client = new LumaClient('valid-api-key');
      expect(client).toBeDefined();
    });
  });

  describe('createEvent', () => {
    it('should create event successfully', async () => {
      const client = new LumaClient('test-api-key');
      const mockHttpClient = (client as any).httpClient;
      
      const mockResponse = {
        api_id: 'event-123',
        event: {
          api_id: 'event-123',
          name: 'Test Event',
          url: 'https://lu.ma/event-123',
          start_at: '2024-01-15T18:00:00Z',
          timezone: 'America/New_York'
        }
      };

      mockHttpClient.post = vi.fn().mockResolvedValue(mockResponse);

      const eventData = {
        name: 'Test Event',
        start_at: '2024-01-15T18:00:00Z',
        timezone: 'America/New_York'
      };

      const result = await client.createEvent(eventData);

      expect(result.api_id).toBe('event-123');
      expect(result.event.name).toBe('Test Event');
    });

    it('should handle API errors', async () => {
      const client = new LumaClient('test-api-key');
      const mockHttpClient = (client as any).httpClient;
      
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            message: 'Invalid event data',
            code: 'invalid_request'
          }
        }
      };

      mockHttpClient.post = vi.fn().mockRejectedValue(error);

      const eventData = {
        name: 'Test Event',
        start_at: 'invalid-date',
        timezone: 'America/New_York'
      };

      await expect(client.createEvent(eventData)).rejects.toThrow(LumaApiError);
    });
  });

  describe('getUploadUrl', () => {
    it('should get upload URL successfully', async () => {
      const client = new LumaClient('test-api-key');
      const mockHttpClient = (client as any).httpClient;
      
      const mockResponse = {
        upload_url: 'https://upload.example.com/signed-url',
        file_url: 'https://cdn.luma.com/images/test.jpg'
      };

      mockHttpClient.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await client.getUploadUrl('test.jpg', 'image/jpeg');

      expect(result.upload_url).toBe('https://upload.example.com/signed-url');
      expect(result.file_url).toBe('https://cdn.luma.com/images/test.jpg');
    });
  });

  describe('getContentType', () => {
    it('should return correct content type for jpg', () => {
      const client = new LumaClient('test-api-key');
      const contentType = (client as any).getContentType('image.jpg');
      expect(contentType).toBe('image/jpeg');
    });

    it('should return correct content type for png', () => {
      const client = new LumaClient('test-api-key');
      const contentType = (client as any).getContentType('image.png');
      expect(contentType).toBe('image/png');
    });

    it('should return correct content type for avif', () => {
      const client = new LumaClient('test-api-key');
      const contentType = (client as any).getContentType('image.avif');
      expect(contentType).toBe('image/avif');
    });

    it('should return default for unknown extension', () => {
      const client = new LumaClient('test-api-key');
      const contentType = (client as any).getContentType('image.xyz');
      expect(contentType).toBe('application/octet-stream');
    });
  });
});
