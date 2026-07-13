import { CreateEventResult, VenueNode, GroupVenuesResponse } from '../../src/platforms/meetup/meetup-types';

export function createMockMeetupEventResult(overrides: Partial<CreateEventResult> = {}): CreateEventResult {
  return {
    event: {
      id: 'test-meetup-event-id',
      eventUrl: 'https://www.meetup.com/civic-tech-dc/events/test-meetup-event-id/'
    },
    ...overrides
  };
}

export function createMockVenueNode(overrides: Partial<VenueNode> = {}): VenueNode {
  return {
    id: 'venue-123',
    name: 'Test Venue',
    address: '123 Test St',
    city: 'Washington',
    state: 'DC',
    lat: 38.8951,
    lng: -77.0369,
    ...overrides
  };
}

export function createMockGroupVenuesResponse(venues: VenueNode[] = []): GroupVenuesResponse {
  return {
    group: {
      venues: {
        edges: venues.map(venue => ({ node: venue }))
      }
    }
  };
}
