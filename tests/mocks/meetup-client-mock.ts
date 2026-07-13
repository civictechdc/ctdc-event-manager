import { vi } from 'vitest';
import { CreateEventResult } from '../../src/platforms/meetup/meetup-types';
import { VenueMatch } from '../../src/platforms/platform.interface';

export function createMockMeetupClient() {
  return {
    query: vi.fn(),
    createEvent: vi.fn<() => Promise<CreateEventResult>>(),
    searchVenues: vi.fn<() => Promise<VenueMatch[]>>()
  };
}

export function mockMeetupClientSuccess(
  client: ReturnType<typeof createMockMeetupClient>,
  eventId: string = 'test-meetup-event-id'
) {
  client.createEvent.mockResolvedValue({
    event: {
      id: eventId,
      eventUrl: `https://www.meetup.com/civic-tech-dc/events/${eventId}/`
    }
  });

  client.searchVenues.mockResolvedValue([
    {
      id: 'venue-123',
      name: 'Test Venue',
      address: '123 Test St',
      city: 'Washington',
      state: 'DC',
      score: 0.95
    }
  ]);
}
