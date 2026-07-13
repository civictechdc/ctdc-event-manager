import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from '../../../src/services/validation-service';
import { Event } from '../../../src/models/event';
import { Venue } from '../../../src/models/venue';

describe('ValidationService', () => {
  let validator: ValidationService;
  let validEvent: Event;
  let validVenue: Venue;

  beforeEach(() => {
    validator = new ValidationService();
    
    validVenue = {
      name: 'Test Venue',
      address: '123 Main St',
      city: 'Washington',
      state: 'DC',
      zip: '20001'
    };

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    validEvent = {
      title: 'Test Event',
      description: 'This is a test event description',
      startDate: futureDate,
      startTime: '18:00',
      duration: 180,
      venue: validVenue,
      eventType: 'meetup',
      timezone: 'America/New_York'
    };
  });

  describe('validateEvent', () => {
    it('should pass validation for a valid event', () => {
      expect(() => validator.validateEvent(validEvent)).not.toThrow();
    });

    it('should reject event with empty title', () => {
      validEvent.title = '';
      expect(() => validator.validateEvent(validEvent)).toThrow('Event title is required');
    });

    it('should reject event with title exceeding 200 characters', () => {
      validEvent.title = 'a'.repeat(201);
      expect(() => validator.validateEvent(validEvent)).toThrow('Event title cannot exceed 200 characters');
    });

    it('should reject event with empty description', () => {
      validEvent.description = '';
      expect(() => validator.validateEvent(validEvent)).toThrow('Event description is required');
    });
  });

  describe('validateDate', () => {
    it('should reject past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      validEvent.startDate = pastDate;
      
      expect(() => validator.validateEvent(validEvent)).toThrow('must be in the future');
    });

    it('should accept future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      validEvent.startDate = futureDate;
      
      expect(() => validator.validateEvent(validEvent)).not.toThrow();
    });

    it('should reject invalid date format', () => {
      validEvent.startDate = new Date('invalid');
      
      expect(() => validator.validateEvent(validEvent)).toThrow('Invalid event date format');
    });

    it('should reject invalid time format', () => {
      validEvent.startTime = '25:00';
      
      expect(() => validator.validateEvent(validEvent)).toThrow('Invalid time format');
    });

    it('should accept time without leading zero', () => {
      validEvent.startTime = '8:00';
      
      expect(() => validator.validateEvent(validEvent)).not.toThrow();
    });

    it('should accept valid 24-hour time format', () => {
      validEvent.startTime = '23:59';
      
      expect(() => validator.validateEvent(validEvent)).not.toThrow();
    });
  });

  describe('validateDuration', () => {
    it('should reject duration less than 15 minutes', () => {
      validEvent.duration = 10;
      
      expect(() => validator.validateEvent(validEvent)).toThrow('must be at least 15 minutes');
    });

    it('should reject duration exceeding 24 hours', () => {
      validEvent.duration = 1441;
      
      expect(() => validator.validateEvent(validEvent)).toThrow('cannot exceed 24 hours');
    });

    it('should accept exactly 15 minutes', () => {
      validEvent.duration = 15;
      
      expect(() => validator.validateEvent(validEvent)).not.toThrow();
    });

    it('should accept exactly 24 hours', () => {
      validEvent.duration = 1440;
      
      expect(() => validator.validateEvent(validEvent)).not.toThrow();
    });

    it('should reject zero duration', () => {
      validEvent.duration = 0;
      
      expect(() => validator.validateEvent(validEvent)).toThrow('must be a positive number');
    });

    it('should reject negative duration', () => {
      validEvent.duration = -60;
      
      expect(() => validator.validateEvent(validEvent)).toThrow('must be a positive number');
    });
  });

  describe('validateVenue', () => {
    it('should reject missing venue name', () => {
      validEvent.venue.name = '';
      
      expect(() => validator.validateEvent(validEvent)).toThrow('Venue name is required');
    });

    it('should reject missing venue address', () => {
      validEvent.venue.address = '';
      
      expect(() => validator.validateEvent(validEvent)).toThrow('Venue address is required');
    });

    it('should reject missing venue city', () => {
      validEvent.venue.city = '';
      
      expect(() => validator.validateEvent(validEvent)).toThrow('Venue city is required');
    });

    it('should reject missing venue state', () => {
      validEvent.venue.state = '';
      
      expect(() => validator.validateEvent(validEvent)).toThrow('Venue state is required');
    });

    it('should reject missing venue zip', () => {
      validEvent.venue.zip = '';
      
      expect(() => validator.validateEvent(validEvent)).toThrow('Venue zip code is required');
    });

    it('should accept venue with valid coordinates', () => {
      validEvent.venue.coordinates = {
        latitude: 38.9072,
        longitude: -77.0369
      };
      
      expect(() => validator.validateEvent(validEvent)).not.toThrow();
    });

    it('should reject invalid latitude', () => {
      validEvent.venue.coordinates = {
        latitude: 91,
        longitude: -77.0369
      };
      
      expect(() => validator.validateEvent(validEvent)).toThrow('latitude must be between -90 and 90');
    });

    it('should reject invalid longitude', () => {
      validEvent.venue.coordinates = {
        latitude: 38.9072,
        longitude: 181
      };
      
      expect(() => validator.validateEvent(validEvent)).toThrow('longitude must be between -180 and 180');
    });

    it('should reject non-numeric coordinates', () => {
      validEvent.venue.coordinates = {
        latitude: 'invalid' as any,
        longitude: -77.0369
      };
      
      expect(() => validator.validateEvent(validEvent)).toThrow('coordinates must be valid numbers');
    });
  });

  describe('validateTimezone', () => {
    it('should accept valid IANA timezone', () => {
      validEvent.timezone = 'America/New_York';
      
      expect(() => validator.validateEvent(validEvent)).not.toThrow();
    });

    it('should accept UTC timezone', () => {
      validEvent.timezone = 'UTC';
      
      expect(() => validator.validateEvent(validEvent)).not.toThrow();
    });

    it('should reject invalid timezone', () => {
      validEvent.timezone = 'Invalid/Timezone';
      
      expect(() => validator.validateEvent(validEvent)).toThrow('Invalid timezone');
    });

    it('should reject empty timezone', () => {
      validEvent.timezone = '';
      
      expect(() => validator.validateEvent(validEvent)).toThrow('Event timezone is required');
    });
  });
});
