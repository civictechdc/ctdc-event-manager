import { EventPlatform, PlatformResult, PlatformContext, VenueMatch } from '../platform.interface';
import { Event, EventFormat } from '../../models/event';
import { MeetupGraphQLClient } from './meetup-client';
import { MeetupAuth } from './meetup-auth';
import { CreateEventInput, MeetupEventType } from './meetup-types';
import { MeetupApiError, MeetupAuthError } from './meetup-errors';

export class MeetupPlatform implements EventPlatform {
  readonly name = 'meetup';
  readonly displayName = 'Meetup.com';
  
  private client: MeetupGraphQLClient;
  private groupUrlname: string;
  private auth?: MeetupAuth;

  constructor(accessToken: string, groupUrlname: string) {
    this.client = new MeetupGraphQLClient(accessToken);
    this.groupUrlname = groupUrlname;
  }

  async createEvent(event: Event, context?: PlatformContext): Promise<PlatformResult> {
    try {
      const description = context?.lumaEventUrl
        ? this.addLumaLinkToDescription(event.description, context.lumaEventUrl)
        : event.description;

      const venueId = event.format === 'online' ? undefined : await this.resolveVenueId(event);

      const input: CreateEventInput = {
        groupUrlname: this.groupUrlname,
        title: event.title,
        description,
        startDateTime: this.combineDateAndTime(event.startDate, event.startTime).toISOString(),
        duration: `PT${event.duration}M`,
        venueId,
        publishStatus: 'DRAFT',
        eventType: this.mapFormatToEventType(event.format)
      };

      const result = await this.client.createEvent(input);

      if (result.errors && result.errors.length > 0) {
        return {
          success: false,
          error: result.errors.map(e => e.message).join(', ')
        };
      }

      if (!result.event) {
        return {
          success: false,
          error: 'No event returned from Meetup API'
        };
      }

      return {
        success: true,
        eventId: result.event.id,
        eventUrl: result.event.eventUrl,
        draft: true
      };
    } catch (error) {
      if (error instanceof MeetupAuthError) {
        return {
          success: false,
          error: 'Authentication failed. Please check your Meetup access token.'
        };
      }

      if (error instanceof MeetupApiError) {
        return {
          success: false,
          error: `Meetup API error: ${error.message}`
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async searchVenues(query: string): Promise<VenueMatch[]> {
    return this.client.searchVenues(this.groupUrlname, query);
  }

  private async resolveVenueId(event: Event): Promise<string | undefined> {
    if (event.venue) {
      const searchQuery = `${event.venue.name} ${event.venue.address}`;
      const venues = await this.searchVenues(searchQuery);

      if (venues.length > 0 && venues[0].score > 0.8) {
        return venues[0].id;
      }
    }

    return undefined;
  }

  private addLumaLinkToDescription(description: string, lumaUrl: string): string {
    return `${description}

------
**[REGISTER FOR THE EVENT HERE (ON LU.MA)!](${lumaUrl})**
------`;
  }

  private combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

  private mapFormatToEventType(format: EventFormat): MeetupEventType {
    const mapping: Record<EventFormat, MeetupEventType> = {
      'in-person': 'inPerson',
      'online': 'online',
      'hybrid': 'hybrid'
    };
    return mapping[format] || 'inPerson';
  }
}
