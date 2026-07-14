import { Event } from '../models/event.js';
import { Venue } from '../models/venue.js';

export class ValidationService {
  validateEvent(event: Event): void {
    this.validateTitle(event.title);
    this.validateDescription(event.description);
    this.validateDate(event.startDate, event.startTime);
    this.validateDuration(event.duration);
    this.validateVenue(event.venue);
    this.validateTimezone(event.timezone);
  }

  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Event title is required');
    }
    if (title.length > 200) {
      throw new Error('Event title cannot exceed 200 characters');
    }
  }

  private validateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new Error('Event description is required');
    }
  }

  private validateDate(date: Date, time: string): void {
    if (!date) {
      throw new Error('Event date is required');
    }

    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid event date format');
    }

    if (!time) {
      throw new Error('Event start time is required');
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(time)) {
      throw new Error('Invalid time format. Use HH:mm (24-hour format)');
    }

    const [hours, minutes] = time.split(':').map(Number);
    const eventDateTime = new Date(dateObj);
    eventDateTime.setHours(hours, minutes, 0, 0);

    const now = new Date();

    if (eventDateTime < now) {
      throw new Error(
        `Event date/time must be in the future. ` +
        `Provided: ${eventDateTime.toISOString()}, ` +
        `Current: ${now.toISOString()}`
      );
    }
  }

  private validateDuration(duration: number): void {
    if (!duration || duration <= 0) {
      throw new Error('Event duration must be a positive number');
    }
    if (duration < 15) {
      throw new Error('Event duration must be at least 15 minutes');
    }
    if (duration > 1440) {
      throw new Error('Event duration cannot exceed 24 hours (1440 minutes)');
    }
  }

  private validateVenue(venue: Venue): void {
    if (!venue) {
      throw new Error('Venue is required');
    }

    if (!venue.name || venue.name.trim().length === 0) {
      throw new Error('Venue name is required');
    }

    if (!venue.address || venue.address.trim().length === 0) {
      throw new Error('Venue address is required');
    }

    if (!venue.city || venue.city.trim().length === 0) {
      throw new Error('Venue city is required');
    }

    if (!venue.state || venue.state.trim().length === 0) {
      throw new Error('Venue state is required');
    }

    if (!venue.zip || venue.zip.trim().length === 0) {
      throw new Error('Venue zip code is required');
    }

    if (venue.coordinates) {
      if (typeof venue.coordinates.latitude !== 'number' || 
          typeof venue.coordinates.longitude !== 'number') {
        throw new Error('Venue coordinates must be valid numbers');
      }

      if (venue.coordinates.latitude < -90 || venue.coordinates.latitude > 90) {
        throw new Error('Venue latitude must be between -90 and 90');
      }

      if (venue.coordinates.longitude < -180 || venue.coordinates.longitude > 180) {
        throw new Error('Venue longitude must be between -180 and 180');
      }
    }
  }

  private validateTimezone(timezone: string): void {
    if (!timezone || timezone.trim().length === 0) {
      throw new Error('Event timezone is required');
    }

    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch (error) {
      throw new Error(`Invalid timezone: ${timezone}. Use IANA timezone format (e.g., America/New_York)`);
    }
  }
}
