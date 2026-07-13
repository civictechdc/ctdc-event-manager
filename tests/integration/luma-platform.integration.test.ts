import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';
import { LumaPlatform } from '../../src/platforms/luma/luma-platform';
import { LumaClient } from '../../src/platforms/luma/luma-client';
import { createMockEvent } from '../fixtures/events';

vi.mock('../../src/platforms/luma/luma-client');

interface MockLumaClient {
  createEvent: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  getUploadUrl: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  uploadImage: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  uploadImageFromPath: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
}

describe('Luma Platform Integration', () => {
  let platform: LumaPlatform;
  let mockClient: MockLumaClient;

  beforeEach(() => {
    mockClient = {
      createEvent: vi.fn(),
      getUploadUrl: vi.fn(),
      uploadImage: vi.fn(),
      uploadImageFromPath: vi.fn()
    };
    
    vi.mocked(LumaClient).mockImplementation(() => mockClient as unknown as LumaClient);
    platform = new LumaPlatform('test-api-key');
  });

  describe('Event Creation', () => {
    it('should create event with all fields', async () => {
      mockClient.createEvent.mockResolvedValue({
        api_id: 'event-123',
        event: {
          api_id: 'event-123',
          name: 'Test Event',
          url: 'https://luma.com/event-123',
          start_at: '2024-03-15T18:00:00Z',
          timezone: 'America/New_York'
        }
      });

      const event = createMockEvent();
      const result = await platform.createEvent(event);

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('event-123');
      expect(result.eventUrl).toBe('https://luma.com/event-123');
      expect(result.draft).toBe(false);
    });

    it('should format venue address correctly', async () => {
      const event = createMockEvent({
        venue: {
          name: 'Test Venue',
          address: '123 Main St',
          city: 'Washington',
          state: 'DC',
          zip: '20001'
        }
      });

      await platform.createEvent(event);

      const callArgs = mockClient.createEvent.mock.calls[0][0];
      expect(callArgs.geo_address_json.address).toContain('Test Venue');
      expect(callArgs.geo_address_json.address).toContain('123 Main St');
      expect(callArgs.geo_address_json.address).toContain('Washington');
      expect(callArgs.geo_address_json.address).toContain('DC');
      expect(callArgs.geo_address_json.address).toContain('20001');
    });

    it('should calculate end time from duration', async () => {
      const event = createMockEvent({
        startTime: '18:00',
        duration: 120
      });

      await platform.createEvent(event);

      const callArgs = mockClient.createEvent.mock.calls[0][0];
      const startTime = new Date(callArgs.start_at);
      const endTime = new Date(callArgs.end_at);
      
      const diffMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
      expect(diffMinutes).toBe(120);
    });

    it('should handle API errors', async () => {
      mockClient.createEvent.mockRejectedValue(new Error('Unauthorized'));

      const event = createMockEvent();
      const result = await platform.createEvent(event);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });
  });

  describe('Event Format Handling', () => {
    it('should include geo_address_json for in-person events', async () => {
      mockClient.createEvent.mockResolvedValue({
        api_id: 'event-123',
        event: {
          api_id: 'event-123',
          name: 'Test Event',
          url: 'https://luma.com/event-123',
          start_at: '2024-03-15T18:00:00Z',
          timezone: 'America/New_York'
        }
      });

      const event = createMockEvent({ format: 'in-person' });
      await platform.createEvent(event);

      const callArgs = mockClient.createEvent.mock.calls[0][0];
      expect(callArgs.geo_address_json).toBeDefined();
      expect(callArgs.geo_address_json.address).toContain('Test Venue');
    });

    it('should omit geo_address_json for online events', async () => {
      mockClient.createEvent.mockResolvedValue({
        api_id: 'event-123',
        event: {
          api_id: 'event-123',
          name: 'Test Event',
          url: 'https://luma.com/event-123',
          start_at: '2024-03-15T18:00:00Z',
          timezone: 'America/New_York'
        }
      });

      const event = createMockEvent({ 
        format: 'online',
        onlineUrl: 'https://zoom.us/j/123456'
      });
      await platform.createEvent(event);

      const callArgs = mockClient.createEvent.mock.calls[0][0];
      expect(callArgs.geo_address_json).toBeUndefined();
    });

    it('should include url field for online events', async () => {
      mockClient.createEvent.mockResolvedValue({
        api_id: 'event-123',
        event: {
          api_id: 'event-123',
          name: 'Test Event',
          url: 'https://luma.com/event-123',
          start_at: '2024-03-15T18:00:00Z',
          timezone: 'America/New_York'
        }
      });

      const event = createMockEvent({ 
        format: 'online',
        onlineUrl: 'https://zoom.us/j/123456'
      });
      await platform.createEvent(event);

      const callArgs = mockClient.createEvent.mock.calls[0][0];
      expect(callArgs.url).toBe('https://zoom.us/j/123456');
    });

    it('should include both address and url for hybrid events', async () => {
      mockClient.createEvent.mockResolvedValue({
        api_id: 'event-123',
        event: {
          api_id: 'event-123',
          name: 'Test Event',
          url: 'https://luma.com/event-123',
          start_at: '2024-03-15T18:00:00Z',
          timezone: 'America/New_York'
        }
      });

      const event = createMockEvent({ 
        format: 'hybrid',
        onlineUrl: 'https://zoom.us/j/123456'
      });
      await platform.createEvent(event);

      const callArgs = mockClient.createEvent.mock.calls[0][0];
      expect(callArgs.geo_address_json).toBeDefined();
      expect(callArgs.url).toBe('https://zoom.us/j/123456');
    });
  });

  describe('Image Upload', () => {
    it('should return URL directly for URL images', async () => {
      const imageConfig = {
        source: { type: 'url' as const, url: 'https://example.com/image.jpg' }
      };

      const result = await platform.uploadImage!(imageConfig);

      expect(result).toBe('https://example.com/image.jpg');
      expect(mockClient.getUploadUrl).not.toHaveBeenCalled();
    });

    it('should upload file images', async () => {
      mockClient.uploadImageFromPath.mockResolvedValue('https://cdn.luma.com/image.jpg');

      const imageConfig = {
        source: { type: 'upload' as const, path: '/tmp/test.jpg' }
      };

      const result = await platform.uploadImage!(imageConfig);

      expect(result).toBe('https://cdn.luma.com/image.jpg');
      expect(mockClient.uploadImageFromPath).toHaveBeenCalledWith('/tmp/test.jpg');
    });
  });
});
