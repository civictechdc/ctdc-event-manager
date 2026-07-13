export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Venue {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  coordinates?: Coordinates;
}

export function formatVenueAddress(venue: Venue): string {
  return `${venue.name}, ${venue.address}, ${venue.city}, ${venue.state} ${venue.zip}`;
}

export function formatShortAddress(venue: Venue): string {
  return `${venue.address}, ${venue.city}, ${venue.state} ${venue.zip}`;
}
