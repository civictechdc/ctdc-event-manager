import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventService } from '../../src/services/event-service';
import { ValidationService } from '../../src/services/validation-service';
import { LumaPlatform } from '../../src/platforms/luma/luma-platform';
import { MeetupPlatform } from '../../src/platforms/meetup/meetup-platform';
import { PlatformRegistry } from '../../src/platforms/platform-registry';
import { EventPlatform, PlatformContext } from '../../src/platforms/platform.interface';
import { Config } from '../../src/utils/config';
import { Venue } from '../../src/models/venue';
import { createMockEvent } from '../fixtures/events';

vi.mock('../../src/platforms/luma/luma-platform');
vi.mock('../../src/platforms/meetup/meetup-platform');

describe('EventService Integration', () => {
  let eventService: EventService;
  let mockConfig: Config;

  beforeEach(() => {
    mockConfig = {
      lumaApiKey: 'test-luma-key',
      meetupAccessToken: 'test-meetup-token',
      meetupGroupUrlname: 'test-group',
      defaultDuration: 180,
      defaultStartTime: '18:00',
      defaultTimezone: 'America/New_York',
      logLevel: 'info' as const,
      enabledPlatforms: ['luma', 'meetup'],
      primaryPlatform: 'luma'
    };
    
    vi.mocked(LumaPlatform).mockImplementation(() => ({
      name: 'luma',
      displayName: 'Luma',
      createEvent: vi.fn().mockResolvedValue({
        success: true,
        eventId: 'luma-event-123',
        eventUrl: 'https://luma.com/luma-event-123',
        draft: false
      }),
      uploadImage: vi.fn().mockResolvedValue('https://cdn.luma.com/image.jpg')
    }) as unknown as LumaPlatform);
    
    vi.mocked(MeetupPlatform).mockImplementation(() => ({
      name: 'meetup',
      displayName: 'Meetup.com',
      createEvent: vi.fn().mockResolvedValue({
        success: true,
        eventId: 'meetup-event-456',
        eventUrl: 'https://meetup.com/event-456',
        draft: true
      }),
      searchVenues: vi.fn().mockResolvedValue([])
    }) as unknown as MeetupPlatform);

    eventService = new EventService(mockConfig);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Full Event Creation Flow', () => {
    it('should create events on both platforms sequentially', async () => {
      const event = createMockEvent();

      const result = await eventService.createEvents(event);

      expect(result.status).toBe('succeeded');
      expect(result.outcomes).toHaveLength(2);

      const lumaOutcome = result.outcomes.find((o) => o.platform === 'luma');
      expect(lumaOutcome?.status).toBe('succeeded');
      expect((lumaOutcome as Extract<typeof lumaOutcome, { status: 'succeeded' }>).eventUrl).toBe(
        'https://luma.com/luma-event-123'
      );

      const meetupOutcome = result.outcomes.find((o) => o.platform === 'meetup');
      expect(meetupOutcome?.status).toBe('succeeded');
      expect((meetupOutcome as Extract<typeof meetupOutcome, { status: 'succeeded' }>).draft).toBe(true);
    });

    it('should pass Luma URL to Meetup platform', async () => {
      const event = createMockEvent();
      let receivedContext: PlatformContext | null = null;

      vi.mocked(MeetupPlatform).mockImplementation(() => ({
        name: 'meetup',
        displayName: 'Meetup.com',
        createEvent: vi.fn().mockImplementation(async (_event, context) => {
          receivedContext = context;
          return {
            success: true,
            eventId: 'meetup-event-456',
            eventUrl: 'https://meetup.com/event-456',
            draft: true
          };
        }),
        searchVenues: vi.fn().mockResolvedValue([])
      }) as unknown as MeetupPlatform);

      eventService = new EventService(mockConfig);
      await eventService.createEvents(event);

      expect(receivedContext).not.toBeNull();
      expect(receivedContext!.lumaEventUrl).toBe('https://luma.com/luma-event-123');
    });

    it('should fail fast when Luma creation fails', async () => {
      vi.mocked(LumaPlatform).mockImplementation(() => ({
        name: 'luma',
        displayName: 'Luma',
        createEvent: vi.fn().mockResolvedValue({
          success: false,
          error: 'API Error: Unauthorized'
        })
      }) as unknown as LumaPlatform);

      eventService = new EventService(mockConfig);
      const event = createMockEvent();

      const result = await eventService.createEvents(event);

      expect(result.status).toBe('failed');

      const lumaOutcome = result.outcomes.find((o) => o.platform === 'luma');
      expect(lumaOutcome?.status).toBe('failed');
      expect((lumaOutcome as Extract<typeof lumaOutcome, { status: 'failed' }>).error.message).toContain(
        'Unauthorized'
      );

      const meetupOutcome = result.outcomes.find((o) => o.platform === 'meetup');
      expect(meetupOutcome?.status).toBe('skipped');
    });

    it('should return partial success when Meetup fails', async () => {
      vi.mocked(MeetupPlatform).mockImplementation(() => ({
        name: 'meetup',
        displayName: 'Meetup.com',
        createEvent: vi.fn().mockResolvedValue({
          success: false,
          error: 'Venue not found'
        }),
        searchVenues: vi.fn().mockResolvedValue([])
      }) as unknown as MeetupPlatform);

      eventService = new EventService(mockConfig);
      const event = createMockEvent();

      const result = await eventService.createEvents(event);

      expect(result.status).toBe('partially-succeeded');

      const lumaOutcome = result.outcomes.find((o) => o.platform === 'luma');
      expect(lumaOutcome?.status).toBe('succeeded');

      const meetupOutcome = result.outcomes.find((o) => o.platform === 'meetup');
      expect(meetupOutcome?.status).toBe('failed');
      expect((meetupOutcome as Extract<typeof meetupOutcome, { status: 'failed' }>).error.message).toContain(
        'Venue not found'
      );
    });
  });

  describe('Dry Run Mode', () => {
    it('should not call platforms in dry-run mode', async () => {
      const lumaCreateEvent = vi.fn().mockResolvedValue({ success: true });
      const meetupCreateEvent = vi.fn().mockResolvedValue({ success: true });

      vi.mocked(LumaPlatform).mockImplementation(() => ({
        name: 'luma',
        displayName: 'Luma',
        createEvent: lumaCreateEvent
      }) as unknown as LumaPlatform);

      vi.mocked(MeetupPlatform).mockImplementation(() => ({
        name: 'meetup',
        displayName: 'Meetup.com',
        createEvent: meetupCreateEvent
      }) as unknown as MeetupPlatform);

      eventService = new EventService(mockConfig);
      const event = createMockEvent();

      const result = await eventService.createEvents(event, { dryRun: true });

      expect(result.status).toBe('succeeded');
      expect(result.dryRun).toBe(true);
      expect(result.outcomes).toHaveLength(2);
      expect(result.outcomes.every((o) => o.status === 'succeeded')).toBe(true);
      expect(lumaCreateEvent).not.toHaveBeenCalled();
      expect(meetupCreateEvent).not.toHaveBeenCalled();
    });
  });

  describe('Platform Selection', () => {
    it('should create event on Luma only when specified', async () => {
      const meetupCreateEvent = vi.fn();

      vi.mocked(MeetupPlatform).mockImplementation(() => ({
        name: 'meetup',
        displayName: 'Meetup.com',
        createEvent: meetupCreateEvent
      }) as unknown as MeetupPlatform);

      eventService = new EventService(mockConfig);
      const event = createMockEvent();

      const result = await eventService.createEvents(event, { platforms: ['luma'] });

      expect(result.status).toBe('succeeded');
      expect(result.outcomes).toHaveLength(1);
      expect(result.outcomes[0].platform).toBe('luma');
      expect(meetupCreateEvent).not.toHaveBeenCalled();
    });

    it('should create event on Meetup only when specified', async () => {
      const lumaCreateEvent = vi.fn();

      vi.mocked(LumaPlatform).mockImplementation(() => ({
        name: 'luma',
        displayName: 'Luma',
        createEvent: lumaCreateEvent
      }) as unknown as LumaPlatform);

      eventService = new EventService(mockConfig);
      const event = createMockEvent();

      const result = await eventService.createEvents(event, { platforms: ['meetup'] });

      expect(result.status).toBe('succeeded');
      expect(result.outcomes).toHaveLength(1);
      expect(result.outcomes[0].platform).toBe('meetup');
      expect(lumaCreateEvent).not.toHaveBeenCalled();
    });
  });

  describe('Validation Integration', () => {
    it('should validate event before creation', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const invalidEvent = createMockEvent({
        startDate: pastDate,
        startTime: '18:00'
      });

      const result = await eventService.createEvents(invalidEvent);

      expect(result.status).toBe('failed');
      expect(result.outcomes).toHaveLength(1);
      expect(result.outcomes[0]).toMatchObject({
        platform: 'event',
        status: 'failed',
        error: { kind: 'invalid-configuration' }
      });
      expect(result.outcomes[0]).toMatchObject({
        error: { message: expect.stringContaining('future') }
      });
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate required fields', async () => {
      const invalidEvent = createMockEvent({
        title: '',
        description: ''
      });

      const result = await eventService.createEvents(invalidEvent);

      expect(result.status).toBe('failed');
      expect(result.outcomes).toHaveLength(1);
      expect(result.outcomes[0].platform).toBe('event');
      expect(result.outcomes[0].status).toBe('failed');
      expect(result.warnings).toHaveLength(0);
    });
  });
});

describe('ValidationService Integration', () => {
  let validator: ValidationService;

  beforeEach(() => {
    validator = new ValidationService();
  });

  describe('Complete Event Validation', () => {
    it('should pass valid event', () => {
      const event = createMockEvent();
      
      expect(() => validator.validateEvent(event)).not.toThrow();
    });

    it('should reject event with missing venue', () => {
      const event = createMockEvent({
        venue: {} as unknown as Venue
      });
      
      expect(() => validator.validateEvent(event)).toThrow();
    });

    it('should reject event with invalid timezone', () => {
      const event = createMockEvent({
        timezone: 'Invalid/Timezone'
      });
      
      expect(() => validator.validateEvent(event)).toThrow('IANA timezone');
    });

    it('should reject event with invalid duration', () => {
      const event = createMockEvent({
        duration: 5
      });
      
      expect(() => validator.validateEvent(event)).toThrow('15 minutes');
    });
  });
});

describe('PlatformRegistry Integration', () => {
  let registry: PlatformRegistry;

  beforeEach(() => {
    registry = new PlatformRegistry();
  });

  it('should register and retrieve platforms', () => {
    const lumaPlatform = { name: 'luma', displayName: 'Luma' } as unknown as EventPlatform;
    const meetupPlatform = { name: 'meetup', displayName: 'Meetup.com' } as unknown as EventPlatform;
    
    registry.register(lumaPlatform);
    registry.register(meetupPlatform);
    
    expect(registry.get('luma')).toBe(lumaPlatform);
    expect(registry.get('meetup')).toBe(meetupPlatform);
  });

  it('should return undefined for unregistered platform', () => {
    expect(registry.get('unknown')).toBeUndefined();
  });

  it('should overwrite platform on re-registration', () => {
    const platform1 = { name: 'test', displayName: 'Test 1' } as unknown as EventPlatform;
    const platform2 = { name: 'test', displayName: 'Test 2' } as unknown as EventPlatform;
    
    registry.register(platform1);
    registry.register(platform2);
    
    expect(registry.get('test')?.displayName).toBe('Test 2');
  });
});
