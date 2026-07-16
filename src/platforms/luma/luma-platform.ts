import { EventPlatform, PlatformResult, PlatformContext } from '../platform.interface.js';
import { Event } from '../../models/event.js';
import { ImageConfig, isUploadImage, isUrlImage } from '../../models/image.js';
import { LumaClient } from './luma-client.js';
import { LumaEventRequest } from './luma-types.js';
import { formatVenueAddress } from '../../models/venue.js';
import { LumaApiError, LumaAuthError } from './luma-errors.js';

export class LumaPlatform implements EventPlatform {
  readonly name = 'luma';
  readonly displayName = 'Luma';
  
  private client: LumaClient;
  
  constructor(apiKey: string) {
    this.client = new LumaClient(apiKey);
  }

  async createEvent(event: Event, _context?: PlatformContext): Promise<PlatformResult> {
    try {
      let coverUrl: string | undefined;
      
      if (event.bannerImage) {
        coverUrl = await this.uploadImage(event.bannerImage);
      }

      const lumaEvent = this.mapEventToLumaFormat(event, coverUrl);
      const response = await this.client.createEvent(lumaEvent);
      
      return {
        success: true,
        eventId: response.api_id,
        eventUrl: response.event?.url || `https://lu.ma/${response.api_id}`,
        draft: false
      };
    } catch (error) {
      if (error instanceof LumaAuthError) {
        return {
          success: false,
          error: 'Authentication failed. Please check your Luma API key.'
        };
      }
      
      if (error instanceof LumaApiError) {
        return {
          success: false,
          error: `Luma API error: ${error.message}`
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async uploadImage(image: ImageConfig): Promise<string> {
    if (isUploadImage(image)) {
      return this.client.uploadImageFromPath(image.source.path);
    }
    
    if (isUrlImage(image)) {
      return image.source.url;
    }

    throw new Error('Invalid image configuration');
  }

  private mapEventToLumaFormat(event: Event, coverUrl?: string): LumaEventRequest {
    const startAt = this.combineDateAndTime(event.startDate, event.startTime);
    const endAt = new Date(startAt.getTime() + event.duration * 60000);
    
    const lumaEvent: LumaEventRequest = {
      name: event.title,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      timezone: event.timezone,
      description_md: event.description,
      visibility: 'public'
    };

    if (coverUrl) {
      lumaEvent.cover_url = coverUrl;
    }

    // Include venue address for in-person or hybrid events
    if (event.format !== 'online' && event.venue) {
      lumaEvent.geo_address_json = {
        type: 'manual',
        address: formatVenueAddress(event.venue),
        description: event.venue.name
      };
    }

    // Include online URL for online or hybrid events
    if (event.onlineUrl && event.format !== 'in-person') {
      lumaEvent.url = event.onlineUrl;
    }

    return lumaEvent;
  }

  private combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }
}
