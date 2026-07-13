import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventService } from '../../../src/services/event-service';
import { Config } from '../../../src/utils/config';
import { Event } from '../../../src/models/event';
import { Venue } from '../../../src/models/venue';

describe('EventService', () => {
  let eventService: EventService;
  let mockConfig: Config;
  let validEvent: Event;
  let validVenue: Venue;

  beforeEach(() => {
    mockConfig = {
      lumaApiKey: 'test-luma-key',
      meetupAccessToken: 'test-meetup-token',
      meetupGroupUrlname: 'test-group',
      defaultDuration: 180,
      defaultStartTime: '18:00',
      defaultTimezone: 'America/New_York',
      logLevel: 'info',
      enabledPlatforms: ['luma', 'meetup'],
      primaryPlatform: 'luma'
    };

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
      description: 'Test description',
      startDate: futureDate,
      startTime: '18:00',
      duration: 180,
      venue: validVenue,
      eventType: 'meetup',
      format: 'in-person' as const,
      timezone: 'America/New_York'
    };

    eventService = new EventService(mockConfig);
  });

  describe('constructor', () => {
    it('should register Luma platform when API key exists', () => {
      const platform = eventService.getPlatform('luma');
      expect(platform).toBeDefined();
      expect(platform?.name).toBe('luma');
    });

    it('should not register Luma platform when API key is missing', () => {
      const customConfig = { ...mockConfig, lumaApiKey: undefined };
      const customService = new EventService(customConfig);
      expect(customService.getPlatform('luma')).toBeUndefined();
    });

    it('should register Meetup platform when both settings exist', () => {
      const platform = eventService.getPlatform('meetup');
      expect(platform).toBeDefined();
      expect(platform?.name).toBe('meetup');
    });

    it('should not register Meetup platform when access token is missing', () => {
      const customConfig = { ...mockConfig, meetupAccessToken: undefined };
      const customService = new EventService(customConfig);
      expect(customService.getPlatform('meetup')).toBeUndefined();
    });

    it('should not register Meetup platform when group urlname is missing', () => {
      const customConfig = { ...mockConfig, meetupGroupUrlname: undefined };
      const customService = new EventService(customConfig);
      expect(customService.getPlatform('meetup')).toBeUndefined();
    });

    it('should return enabled platforms', () => {
      const platforms = eventService.getEnabledPlatforms();
      expect(platforms).toEqual(['luma', 'meetup']);
    });
  });

  describe('createEvents validation', () => {
    it('should return failed status for invalid event', async () => {
      const invalidEvent = { ...validEvent, title: '' };

      const result = await eventService.createEvents(invalidEvent);

      expect(result.status).toBe('failed');
      expect(result.outcomes).toHaveLength(1);
      expect(result.outcomes[0]).toMatchObject({
        platform: 'event',
        status: 'failed',
        error: { kind: 'invalid-configuration', message: 'Event title is required' }
      });
      expect(result.warnings).toHaveLength(0);
    });

    it('should return failed status for past dates', async () => {
      const pastEvent = { ...validEvent };
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      pastEvent.startDate = pastDate;

      const result = await eventService.createEvents(pastEvent);

      expect(result.status).toBe('failed');
      expect(result.outcomes).toHaveLength(1);
      expect(result.outcomes[0]).toMatchObject({
        platform: 'event',
        status: 'failed',
        error: { kind: 'invalid-configuration' }
      });
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('createEvents preflight failures', () => {
    it('should fail when no platforms are selected', async () => {
      const customConfig = { ...mockConfig, enabledPlatforms: [] };
      const customService = new EventService(customConfig);

      const result = await customService.createEvents(validEvent);

      expect(result.status).toBe('failed');
      expect(result.outcomes).toHaveLength(1);
      expect(result.outcomes[0]).toMatchObject({
        platform: 'event',
        status: 'failed',
        error: { kind: 'invalid-configuration' }
      });
      expect(result.warnings).toHaveLength(0);
    });

    it('should fail for unknown platform names', async () => {
      const result = await eventService.createEvents(validEvent, { platforms: ['unknown'] });

      expect(result.status).toBe('failed');
      expect(result.outcomes).toHaveLength(1);
      expect(result.outcomes[0]).toMatchObject({
        platform: 'unknown',
        status: 'failed',
        error: { kind: 'invalid-configuration', code: 'unknown-platform' }
      });
      expect(result.warnings).toHaveLength(0);
    });

    it('should fail when selected platform adapter is unavailable', async () => {
      const customConfig = { ...mockConfig, lumaApiKey: undefined };
      const customService = new EventService(customConfig);

      const result = await customService.createEvents(validEvent, { platforms: ['luma'] });

      expect(result.status).toBe('failed');
      expect(result.outcomes).toHaveLength(1);
      expect(result.outcomes[0]).toMatchObject({
        platform: 'luma',
        status: 'failed',
        error: { kind: 'not-configured' }
      });
      expect(result.warnings).toHaveLength(0);
    });

    it('should fail for Luma-only config selecting luma+meetup and never call luma', async () => {
      const customConfig = {
        ...mockConfig,
        meetupAccessToken: undefined,
        meetupGroupUrlname: undefined
      };
      const customService = new EventService(customConfig);
      const lumaPlatform = customService.getPlatform('luma');
      const lumaSpy = vi.spyOn(lumaPlatform!, 'createEvent').mockResolvedValue({
        success: true,
        eventId: 'luma-123',
        eventUrl: 'https://luma.com/test-event'
      });

      const result = await customService.createEvents(validEvent, { platforms: ['luma', 'meetup'] });

      expect(lumaSpy).not.toHaveBeenCalled();
      expect(result.status).toBe('failed');
      expect(result.outcomes).toHaveLength(1);
      expect(result.outcomes[0]).toMatchObject({
        platform: 'meetup',
        status: 'failed',
        error: { kind: 'not-configured' }
      });
      expect(result.warnings).toHaveLength(0);
    });

    it('should fail multi selection when primary is absent from selection', async () => {
      const result = await eventService.createEvents(validEvent, { platforms: ['meetup', 'unknown'] });

      expect(result.status).toBe('failed');
      expect(result.outcomes.some(o => o.platform === 'luma' && o.status === 'failed')).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('createEvents success flows', () => {
    it('should create Luma event only', async () => {
      const lumaPlatform = eventService.getPlatform('luma');
      vi.spyOn(lumaPlatform!, 'createEvent').mockResolvedValueOnce({
        success: true,
        eventId: 'luma-123',
        eventUrl: 'https://luma.com/test-event'
      });

      const result = await eventService.createEvents(validEvent, { platforms: ['luma'] });

      expect(result.status).toBe('succeeded');
      expect(result.outcomes).toHaveLength(1);
      expect(result.outcomes[0]).toMatchObject({
        platform: 'luma',
        status: 'succeeded',
        eventId: 'luma-123',
        eventUrl: 'https://luma.com/test-event'
      });
    });

    it('should create Meetup event only with no Luma context', async () => {
      const meetupPlatform = eventService.getPlatform('meetup');
      const meetupSpy = vi.spyOn(meetupPlatform!, 'createEvent').mockResolvedValueOnce({
        success: true,
        eventId: 'meetup-456',
        eventUrl: 'https://meetup.com/test-event',
        draft: true
      });

      const result = await eventService.createEvents(validEvent, { platforms: ['meetup'] });

      expect(result.status).toBe('succeeded');
      expect(result.outcomes).toHaveLength(1);
      expect(result.outcomes[0]).toMatchObject({
        platform: 'meetup',
        status: 'succeeded'
      });
      expect(meetupSpy).toHaveBeenCalledWith(validEvent, undefined);
    });

    it('should create Meetup-only event with no Luma key and no Luma context', async () => {
      const customConfig = { ...mockConfig, lumaApiKey: undefined };
      const customService = new EventService(customConfig);
      const meetupPlatform = customService.getPlatform('meetup');
      const meetupSpy = vi.spyOn(meetupPlatform!, 'createEvent').mockResolvedValueOnce({
        success: true,
        eventId: 'meetup-456',
        eventUrl: 'https://meetup.com/test-event',
        draft: true
      });

      const result = await customService.createEvents(validEvent, { platforms: ['meetup'] });

      expect(result.status).toBe('succeeded');
      expect(result.outcomes).toHaveLength(1);
      expect(result.outcomes[0]).toMatchObject({
        platform: 'meetup',
        status: 'succeeded'
      });
      expect(meetupSpy).toHaveBeenCalledWith(validEvent, undefined);
    });

    it('should create events on both platforms with primary first and pass Luma URL', async () => {
      const lumaPlatform = eventService.getPlatform('luma');
      const meetupPlatform = eventService.getPlatform('meetup');

      vi.spyOn(lumaPlatform!, 'createEvent').mockResolvedValueOnce({
        success: true,
        eventId: 'luma-123',
        eventUrl: 'https://luma.com/test-event'
      });

      const meetupSpy = vi.spyOn(meetupPlatform!, 'createEvent').mockResolvedValueOnce({
        success: true,
        eventId: 'meetup-456',
        eventUrl: 'https://meetup.com/test-event',
        draft: true
      });

      const result = await eventService.createEvents(validEvent);

      expect(result.status).toBe('succeeded');
      expect(result.outcomes).toHaveLength(2);
      expect(meetupSpy).toHaveBeenCalledWith(validEvent, { lumaEventUrl: 'https://luma.com/test-event' });
    });
  });

  describe('createEvents failure and partial flows', () => {
    it('should mark later platforms skipped dependency-failed when primary fails', async () => {
      const lumaPlatform = eventService.getPlatform('luma');
      const meetupPlatform = eventService.getPlatform('meetup');

      vi.spyOn(lumaPlatform!, 'createEvent').mockResolvedValueOnce({
        success: false,
        error: 'Luma API error'
      });
      const meetupSpy = vi.spyOn(meetupPlatform!, 'createEvent');

      const result = await eventService.createEvents(validEvent);

      expect(result.status).toBe('failed');
      expect(result.outcomes).toHaveLength(2);
      expect(result.outcomes[0]).toMatchObject({
        platform: 'luma',
        status: 'failed',
        error: { kind: 'platform-error', message: 'Luma API error' }
      });
      expect(result.outcomes[1]).toMatchObject({
        platform: 'meetup',
        status: 'skipped',
        reason: 'dependency-failed'
      });
      expect(result.warnings.some(w => w.platform === 'meetup' && w.reason === 'dependency-failed')).toBe(true);
      expect(meetupSpy).not.toHaveBeenCalled();
    });

    it('should return partially-succeeded when secondary fails after primary succeeds', async () => {
      const lumaPlatform = eventService.getPlatform('luma');
      const meetupPlatform = eventService.getPlatform('meetup');

      vi.spyOn(lumaPlatform!, 'createEvent').mockResolvedValueOnce({
        success: true,
        eventId: 'luma-123',
        eventUrl: 'https://luma.com/test-event'
      });

      vi.spyOn(meetupPlatform!, 'createEvent').mockResolvedValueOnce({
        success: false,
        error: 'Meetup API error'
      });

      const result = await eventService.createEvents(validEvent);

      expect(result.status).toBe('partially-succeeded');
      expect(result.outcomes).toHaveLength(2);
      expect(result.outcomes[0]).toMatchObject({ platform: 'luma', status: 'succeeded' });
      expect(result.outcomes[1]).toMatchObject({
        platform: 'meetup',
        status: 'failed',
        error: { kind: 'platform-error', message: 'Meetup API error' }
      });
    });

    it('should convert adapter failed result to typed platform-error outcome', async () => {
      const lumaPlatform = eventService.getPlatform('luma');
      vi.spyOn(lumaPlatform!, 'createEvent').mockResolvedValueOnce({
        success: false,
        error: 'Auth failed'
      });

      const result = await eventService.createEvents(validEvent, { platforms: ['luma'] });

      expect(result.status).toBe('failed');
      expect(result.outcomes[0].status).toBe('failed');
      expect(result.outcomes[0]).toMatchObject({
        error: {
          kind: 'platform-error',
          code: 'platform-error',
          message: 'Auth failed',
          retryable: false
        }
      });
    });
  });

  describe('createEvents dry run', () => {
    it('should emit success outcomes for each selection and call no adapters', async () => {
      const lumaPlatform = eventService.getPlatform('luma');
      const meetupPlatform = eventService.getPlatform('meetup');
      const lumaSpy = vi.spyOn(lumaPlatform!, 'createEvent');
      const meetupSpy = vi.spyOn(meetupPlatform!, 'createEvent');

      const result = await eventService.createEvents(validEvent, { dryRun: true });

      expect(result.status).toBe('succeeded');
      expect(result.dryRun).toBe(true);
      expect(result.outcomes).toHaveLength(2);
      expect(result.outcomes.every(o => o.status === 'succeeded')).toBe(true);
      expect(lumaSpy).not.toHaveBeenCalled();
      expect(meetupSpy).not.toHaveBeenCalled();
    });

    it('should order dry-run outcomes by primary first', async () => {
      const result = await eventService.createEvents(validEvent, { dryRun: true, platforms: ['meetup', 'luma'] });
      expect(result.outcomes.map(o => o.platform)).toEqual(['luma', 'meetup']);
    });
  });

  describe('getPlatform', () => {
    it('should return Luma platform', () => {
      const platform = eventService.getPlatform('luma');
      expect(platform?.name).toBe('luma');
      expect(platform?.displayName).toBe('Luma');
    });

    it('should return Meetup platform', () => {
      const platform = eventService.getPlatform('meetup');
      expect(platform?.name).toBe('meetup');
      expect(platform?.displayName).toBe('Meetup.com');
    });

    it('should return undefined for non-existent platform', () => {
      const platform = eventService.getPlatform('nonexistent');
      expect(platform).toBeUndefined();
    });
  });

  describe('getEnabledPlatforms', () => {
    it('should return enabled platforms from config', () => {
      const platforms = eventService.getEnabledPlatforms();
      expect(platforms).toEqual(['luma', 'meetup']);
    });

    it('should return custom enabled platforms', () => {
      const customConfig = { ...mockConfig, enabledPlatforms: ['luma'] };
      const customService = new EventService(customConfig);

      const platforms = customService.getEnabledPlatforms();
      expect(platforms).toEqual(['luma']);
    });
  });
});
