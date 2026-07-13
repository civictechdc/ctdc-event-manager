import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';
import { MeetupPlatform } from '../../src/platforms/meetup/meetup-platform';
import { MeetupGraphQLClient } from '../../src/platforms/meetup/meetup-client';
import { createMockEvent } from '../fixtures/events';

vi.mock('../../src/platforms/meetup/meetup-client');

interface MockMeetupClient {
  createEvent: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  searchVenues: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  query: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
}

describe('Meetup Platform Integration', () => {
  let platform: MeetupPlatform;
  let mockClient: MockMeetupClient;

  beforeEach(() => {
    mockClient = {
      createEvent: vi.fn(),
      searchVenues: vi.fn(),
      query: vi.fn()
    };
    
    vi.mocked(MeetupGraphQLClient).mockImplementation(() => mockClient as unknown as MeetupGraphQLClient);
    platform = new MeetupPlatform('test-token', 'test-group');
  });

  describe('Event Creation', () => {
    it('should create event in draft mode', async () => {
      mockClient.searchVenues.mockResolvedValue([
        { id: 'venue-123', name: 'Test Venue', address: '123 Test St', score: 0.95 }
      ]);
      mockClient.createEvent.mockResolvedValue({
        event: {
          id: 'event-123',
          eventUrl: 'https://meetup.com/event-123'
        },
        errors: []
      });

      const event = createMockEvent();
      const result = await platform.createEvent(event);

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('event-123');
      expect(result.eventUrl).toBe('https://meetup.com/event-123');
      expect(result.draft).toBe(true);
    });

    it('should inject Luma link into description', async () => {
      mockClient.searchVenues.mockResolvedValue([
        { id: 'venue-123', name: 'Test Venue', address: '123 Test St', score: 0.95 }
      ]);
      mockClient.createEvent.mockResolvedValue({
        event: { id: 'event-123', eventUrl: 'https://meetup.com/event-123' },
        errors: []
      });

      const event = createMockEvent({ description: 'Original description' });
      await platform.createEvent(event, { lumaEventUrl: 'https://luma.com/event-123' });

      const callArgs = mockClient.createEvent.mock.calls[0][0];
      expect(callArgs.description).toContain('Original description');
      expect(callArgs.description).toContain('https://luma.com/event-123');
      expect(callArgs.description).toContain('REGISTER FOR THE EVENT HERE');
    });

    it('should not modify description when no Luma URL provided', async () => {
      mockClient.searchVenues.mockResolvedValue([
        { id: 'venue-123', name: 'Test Venue', address: '123 Test St', score: 0.95 }
      ]);
      mockClient.createEvent.mockResolvedValue({
        event: { id: 'event-123', eventUrl: 'https://meetup.com/event-123' },
        errors: []
      });

      const event = createMockEvent({ description: 'Original description' });
      await platform.createEvent(event);

      const callArgs = mockClient.createEvent.mock.calls[0][0];
      expect(callArgs.description).toBe('Original description');
    });
  });

  describe('Event Format Handling', () => {
    it('should map in-person format to inPerson eventType', async () => {
      mockClient.searchVenues.mockResolvedValue([
        { id: 'venue-123', name: 'Test Venue', address: '123 Test St', score: 0.95 }
      ]);
      mockClient.createEvent.mockResolvedValue({
        event: { id: 'event-123', eventUrl: 'https://meetup.com/event-123' },
        errors: []
      });

      const event = createMockEvent({ format: 'in-person' });
      await platform.createEvent(event);

      const callArgs = mockClient.createEvent.mock.calls[0][0];
      expect(callArgs.eventType).toBe('inPerson');
      expect(callArgs.venueId).toBe('venue-123');
    });

    it('should map online format to online eventType', async () => {
      mockClient.createEvent.mockResolvedValue({
        event: { id: 'event-123', eventUrl: 'https://meetup.com/event-123' },
        errors: []
      });

      const event = createMockEvent({ 
        format: 'online',
        onlineUrl: 'https://zoom.us/j/123456'
      });
      await platform.createEvent(event);

      const callArgs = mockClient.createEvent.mock.calls[0][0];
      expect(callArgs.eventType).toBe('online');
      expect(callArgs.venueId).toBeUndefined();
      expect(mockClient.searchVenues).not.toHaveBeenCalled();
    });

    it('should map hybrid format to hybrid eventType', async () => {
      mockClient.searchVenues.mockResolvedValue([
        { id: 'venue-123', name: 'Test Venue', address: '123 Test St', score: 0.95 }
      ]);
      mockClient.createEvent.mockResolvedValue({
        event: { id: 'event-123', eventUrl: 'https://meetup.com/event-123' },
        errors: []
      });

      const event = createMockEvent({ 
        format: 'hybrid',
        onlineUrl: 'https://zoom.us/j/123456'
      });
      await platform.createEvent(event);

      const callArgs = mockClient.createEvent.mock.calls[0][0];
      expect(callArgs.eventType).toBe('hybrid');
      expect(callArgs.venueId).toBe('venue-123');
    });

    it('should skip venue resolution for online events', async () => {
      mockClient.createEvent.mockResolvedValue({
        event: { id: 'event-123', eventUrl: 'https://meetup.com/event-123' },
        errors: []
      });

      const event = createMockEvent({ format: 'online' });
      await platform.createEvent(event);

      expect(mockClient.searchVenues).not.toHaveBeenCalled();
    });
  });

  describe('Venue Resolution', () => {
    it('should use matched venue when score is high enough', async () => {
      mockClient.searchVenues.mockResolvedValue([
        { id: 'venue-123', name: 'Test Venue', address: '123 Test St', score: 0.95 }
      ]);
      mockClient.createEvent.mockResolvedValue({
        event: { id: 'event-123', eventUrl: 'https://meetup.com/event-123' },
        errors: []
      });

      const event = createMockEvent();
      await platform.createEvent(event);

      const callArgs = mockClient.createEvent.mock.calls[0][0];
      expect(callArgs.venueId).toBe('venue-123');
    });

    it('should pass undefined venueId when no match found', async () => {
      mockClient.searchVenues.mockResolvedValue([
        { id: 'venue-123', name: 'Other Venue', address: 'Other St', score: 0.5 }
      ]);
      mockClient.createEvent.mockResolvedValue({
        event: { id: 'event-123', eventUrl: 'https://meetup.com/event-123' },
        errors: []
      });

      const event = createMockEvent();
      await platform.createEvent(event);

      const callArgs = mockClient.createEvent.mock.calls[0][0];
      expect(callArgs.venueId).toBeUndefined();
    });

    it('should pass undefined venueId when venue list is empty', async () => {
      mockClient.searchVenues.mockResolvedValue([]);
      mockClient.createEvent.mockResolvedValue({
        event: { id: 'event-123', eventUrl: 'https://meetup.com/event-123' },
        errors: []
      });

      const event = createMockEvent();
      await platform.createEvent(event);

      const callArgs = mockClient.createEvent.mock.calls[0][0];
      expect(callArgs.venueId).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle GraphQL errors', async () => {
      mockClient.searchVenues.mockResolvedValue([
        { id: 'venue-123', name: 'Test Venue', address: '123 Test St', score: 0.95 }
      ]);
      mockClient.createEvent.mockResolvedValue({
        event: null,
        errors: [{ message: 'Validation failed', code: 'INVALID_INPUT' }]
      });

      const event = createMockEvent();
      const result = await platform.createEvent(event);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });

    it('should handle network errors', async () => {
      mockClient.searchVenues.mockRejectedValue(new Error('Network error'));

      const event = createMockEvent();
      const result = await platform.createEvent(event);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('Venue Search', () => {
    it('should search venues by query', async () => {
      mockClient.searchVenues.mockResolvedValue([
        { id: 'venue-1', name: 'Venue 1', address: 'Address 1', score: 0.9 },
        { id: 'venue-2', name: 'Venue 2', address: 'Address 2', score: 0.7 }
      ]);

      const results = await platform.searchVenues!('test query');

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('venue-1');
      expect(mockClient.searchVenues).toHaveBeenCalledWith('test-group', 'test query');
    });
  });
});
