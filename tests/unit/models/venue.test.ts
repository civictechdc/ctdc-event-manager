import { describe, it, expect } from 'vitest';
import { Venue, formatVenueAddress, formatShortAddress } from '@/models/venue';

describe('Venue Model', () => {
  const testVenue: Venue = {
    name: 'Test Venue',
    address: '123 Main St',
    city: 'Washington',
    state: 'DC',
    zip: '20001',
    coordinates: {
      latitude: 38.8951,
      longitude: -77.0369
    }
  };

  it('should format full venue address', () => {
    const formatted = formatVenueAddress(testVenue);
    expect(formatted).toBe('Test Venue, 123 Main St, Washington, DC 20001');
  });

  it('should format short address', () => {
    const formatted = formatShortAddress(testVenue);
    expect(formatted).toBe('123 Main St, Washington, DC 20001');
  });

  it('should handle venue without coordinates', () => {
    const venueNoCoords: Venue = {
      name: 'Simple Venue',
      address: '456 Oak Ave',
      city: 'Arlington',
      state: 'VA',
      zip: '22201'
    };
    
    expect(venueNoCoords.coordinates).toBeUndefined();
    expect(formatVenueAddress(venueNoCoords)).toContain('Simple Venue');
  });
});
