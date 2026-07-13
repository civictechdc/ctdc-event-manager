import { Event } from '../../src/models/event';
import { Venue } from '../../src/models/venue';

export function createMockEvent(overrides: Partial<Event> = {}): Event {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);

  const defaultVenue: Venue = {
    name: 'Test Venue',
    address: '123 Test St',
    city: 'Washington',
    state: 'DC',
    zip: '20001'
  };

  return {
    title: 'Test Event',
    description: 'This is a test event description',
    startDate: futureDate,
    startTime: '18:00',
    duration: 180,
    venue: defaultVenue,
    eventType: 'test-event',
    format: 'in-person',
    timezone: 'America/New_York',
    ...overrides
  };
}

export function createMockVenue(overrides: Partial<Venue> = {}): Venue {
  return {
    name: 'Test Venue',
    address: '123 Test St',
    city: 'Washington',
    state: 'DC',
    zip: '20001',
    ...overrides
  };
}
