import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MeetupPlatform } from '@/platforms/meetup/meetup-platform';
import { createMockEvent } from '../../fixtures/events';

vi.mock('@/platforms/meetup/meetup-client', () => ({
  MeetupGraphQLClient: vi.fn(() => ({
    createEvent: vi.fn(),
    searchVenues: vi.fn()
  }))
}));

describe('MeetupPlatform', () => {
  let platform: MeetupPlatform;
  const validAccessToken = 'test-access-token-123';
  const groupUrlname = 'civic-tech-dc';

  beforeEach(() => {
    vi.clearAllMocks();
    platform = new MeetupPlatform(validAccessToken, groupUrlname);
  });

  describe('constructor', () => {
    it('should create platform with valid access token and group', () => {
      expect(platform.name).toBe('meetup');
      expect(platform.displayName).toBe('Meetup.com');
    });
  });

  describe('createEvent', () => {
    it('should successfully create an event in draft mode', async () => {
      const event = createMockEvent();
      const mockClient = (platform as any).client;
      
      mockClient.searchVenues.mockResolvedValue([
        {
          id: 'venue-123',
          name: 'Test Venue',
          address: '123 Test St',
          city: 'Washington',
          state: 'DC',
          score: 0.95
        }
      ]);

      mockClient.createEvent.mockResolvedValue({
        event: {
          id: 'meetup-event-123',
          eventUrl: 'https://www.meetup.com/civic-tech-dc/events/meetup-event-123/'
        }
      });

      const result = await platform.createEvent(event);

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('meetup-event-123');
      expect(result.eventUrl).toContain('meetup-event-123');
      expect(result.draft).toBe(true);
    });

    it('should add Luma link to description when provided', async () => {
      const event = createMockEvent();
      const lumaUrl = 'https://lu.ma/test-event';
      const mockClient = (platform as any).client;
      
      mockClient.searchVenues.mockResolvedValue([]);
      mockClient.createEvent.mockResolvedValue({
        event: {
          id: 'meetup-event-123',
          eventUrl: 'https://www.meetup.com/civic-tech-dc/events/meetup-event-123/'
        }
      });

      await platform.createEvent(event, { lumaEventUrl: lumaUrl });

      const createEventCall = mockClient.createEvent.mock.calls[0][0];
      expect(createEventCall.description).toContain('REGISTER FOR THE EVENT HERE');
      expect(createEventCall.description).toContain(lumaUrl);
    });

    it('should handle API errors', async () => {
      const event = createMockEvent();
      const mockClient = (platform as any).client;
      
      mockClient.searchVenues.mockResolvedValue([]);
      mockClient.createEvent.mockResolvedValue({
        errors: [
          { message: 'Invalid date', code: 'INVALID_DATE' }
        ]
      });

      const result = await platform.createEvent(event);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid date');
    });

    it('should handle no event returned', async () => {
      const event = createMockEvent();
      const mockClient = (platform as any).client;
      
      mockClient.searchVenues.mockResolvedValue([]);
      mockClient.createEvent.mockResolvedValue({});

      const result = await platform.createEvent(event);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No event returned');
    });

    it('should resolve venue ID when match found', async () => {
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
      
      mockClient.searchVenues.mockResolvedValue([
        {
          id: 'venue-123',
          name: 'Taoti Creative',
          address: '1333 H St NW',
          city: 'Washington',
          state: 'DC',
          score: 0.95
        }
      ]);

      mockClient.createEvent.mockResolvedValue({
        event: {
          id: 'meetup-event-123',
          eventUrl: 'https://www.meetup.com/civic-tech-dc/events/meetup-event-123/'
        }
      });

      await platform.createEvent(event);

      const createEventCall = mockClient.createEvent.mock.calls[0][0];
      expect(createEventCall.venueId).toBe('venue-123');
    });

    it('should not set venue ID when no match found', async () => {
      const event = createMockEvent();
      const mockClient = (platform as any).client;
      
      mockClient.searchVenues.mockResolvedValue([
        {
          id: 'venue-123',
          name: 'Different Venue',
          address: 'Different Address',
          city: 'Different City',
          state: 'XX',
          score: 0.3
        }
      ]);

      mockClient.createEvent.mockResolvedValue({
        event: {
          id: 'meetup-event-123',
          eventUrl: 'https://www.meetup.com/civic-tech-dc/events/meetup-event-123/'
        }
      });

      await platform.createEvent(event);

      const createEventCall = mockClient.createEvent.mock.calls[0][0];
      expect(createEventCall.venueId).toBeUndefined();
    });

    it('should set publish status to DRAFT', async () => {
      const event = createMockEvent();
      const mockClient = (platform as any).client;
      
      mockClient.searchVenues.mockResolvedValue([]);
      mockClient.createEvent.mockResolvedValue({
        event: {
          id: 'meetup-event-123',
          eventUrl: 'https://www.meetup.com/civic-tech-dc/events/meetup-event-123/'
        }
      });

      await platform.createEvent(event);

      const createEventCall = mockClient.createEvent.mock.calls[0][0];
      expect(createEventCall.publishStatus).toBe('DRAFT');
    });
  });

  describe('searchVenues', () => {
    it('should search venues via client', async () => {
      const mockClient = (platform as any).client;
      
      mockClient.searchVenues.mockResolvedValue([
        {
          id: 'venue-1',
          name: 'Test Venue',
          address: '123 Test St',
          city: 'Washington',
          state: 'DC',
          score: 0.9
        }
      ]);

      const result = await platform.searchVenues('test venue');

      expect(mockClient.searchVenues).toHaveBeenCalledWith(groupUrlname, 'test venue');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Test Venue');
    });
  });
});
