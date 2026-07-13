import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LumaPlatform } from '@/platforms/luma/luma-platform';
import { createMockEvent } from '../../fixtures/events';
import { LumaApiError, LumaAuthError } from '@/platforms/luma/luma-errors';

vi.mock('@/platforms/luma/luma-client', () => ({
  LumaClient: vi.fn(() => ({
    createEvent: vi.fn(),
    getUploadUrl: vi.fn(),
    uploadImage: vi.fn(),
    uploadImageFromPath: vi.fn()
  }))
}));

describe('LumaPlatform', () => {
  let platform: LumaPlatform;
  const validApiKey = 'test-api-key-123';

  beforeEach(() => {
    vi.clearAllMocks();
    platform = new LumaPlatform(validApiKey);
  });

  describe('constructor', () => {
    it('should create platform with valid API key', () => {
      expect(platform.name).toBe('luma');
      expect(platform.displayName).toBe('Luma');
    });
  });

  describe('createEvent', () => {
    it('should successfully create an event', async () => {
      const event = createMockEvent();
      const mockClient = (platform as any).client;
      
      mockClient.createEvent.mockResolvedValue({
        api_id: 'test-event-123',
        event: {
          api_id: 'test-event-123',
          name: 'Test Event',
          url: 'https://lu.ma/test-event-123',
          start_at: event.startDate.toISOString(),
          timezone: 'America/New_York'
        }
      });

      const result = await platform.createEvent(event);

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('test-event-123');
      expect(result.eventUrl).toBe('https://lu.ma/test-event-123');
      expect(result.draft).toBe(false);
    });

    it('should handle authentication errors', async () => {
      const event = createMockEvent();
      const mockClient = (platform as any).client;
      
      mockClient.createEvent.mockRejectedValue(
        new LumaAuthError('Invalid API key')
      );

      const result = await platform.createEvent(event);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
    });

    it('should handle API errors', async () => {
      const event = createMockEvent();
      const mockClient = (platform as any).client;
      
      mockClient.createEvent.mockRejectedValue(
        new LumaApiError('Invalid request', 400, 'invalid_request')
      );

      const result = await platform.createEvent(event);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Luma API error');
    });

    it('should handle unknown errors', async () => {
      const event = createMockEvent();
      const mockClient = (platform as any).client;
      
      mockClient.createEvent.mockRejectedValue(new Error('Network error'));

      const result = await platform.createEvent(event);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should upload image when bannerImage is provided', async () => {
      const event = createMockEvent({
        bannerImage: {
          source: { type: 'url', url: 'https://example.com/banner.jpg' }
        }
      });

      const mockClient = (platform as any).client;
      
      mockClient.createEvent.mockResolvedValue({
        api_id: 'test-event-123',
        event: {
          api_id: 'test-event-123',
          name: 'Test Event',
          url: 'https://lu.ma/test-event-123',
          start_at: event.startDate.toISOString(),
          timezone: 'America/New_York'
        }
      });

      const result = await platform.createEvent(event);

      expect(result.success).toBe(true);
      expect(mockClient.createEvent).toHaveBeenCalled();
    });

    it('should format venue address correctly', async () => {
      const event = createMockEvent({
        venue: {
          name: 'Taoti Creative',
          address: '1333 H St NW',
          city: 'Washington',
          state: 'DC',
          zip: '20005'
        }
      });

      const mockClient = (platform as any).client;
      
      mockClient.createEvent.mockResolvedValue({
        api_id: 'test-event-123',
        event: {
          api_id: 'test-event-123',
          name: 'Test Event',
          url: 'https://lu.ma/test-event-123',
          start_at: event.startDate.toISOString(),
          timezone: 'America/New_York'
        }
      });

      await platform.createEvent(event);

      const createEventCall = mockClient.createEvent.mock.calls[0][0];
      expect(createEventCall.geo_address_json.address).toContain('Taoti Creative');
      expect(createEventCall.geo_address_json.address).toContain('1333 H St NW');
    });

    it('should calculate end time from duration', async () => {
      const event = createMockEvent({
        startTime: '18:00',
        duration: 120
      });

      const mockClient = (platform as any).client;
      
      mockClient.createEvent.mockResolvedValue({
        api_id: 'test-event-123',
        event: {
          api_id: 'test-event-123',
          name: 'Test Event',
          url: 'https://lu.ma/test-event-123',
          start_at: event.startDate.toISOString(),
          timezone: 'America/New_York'
        }
      });

      await platform.createEvent(event);

      const createEventCall = mockClient.createEvent.mock.calls[0][0];
      const startTime = new Date(createEventCall.start_at);
      const endTime = new Date(createEventCall.end_at);
      const diffMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
      
      expect(diffMinutes).toBe(120);
    });
  });

  describe('uploadImage', () => {
    it('should return URL for URL-based images', async () => {
      const imageUrl = 'https://example.com/banner.jpg';
      const image = {
        source: { type: 'url' as const, url: imageUrl }
      };

      const result = await platform.uploadImage(image);
      expect(result).toBe(imageUrl);
    });

    it('should upload file for upload-based images', async () => {
      const imagePath = '/path/to/banner.jpg';
      const image = {
        source: { type: 'upload' as const, path: imagePath }
      };

      const mockClient = (platform as any).client;
      mockClient.uploadImageFromPath.mockResolvedValue('https://cdn.luma.com/images/banner.jpg');

      const result = await platform.uploadImage(image);
      expect(mockClient.uploadImageFromPath).toHaveBeenCalledWith(imagePath);
      expect(result).toBe('https://cdn.luma.com/images/banner.jpg');
    });
  });
});
