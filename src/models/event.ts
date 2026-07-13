import { Venue } from './venue';
import { ImageConfig } from './image';

export type EventFormat = 'in-person' | 'online' | 'hybrid';

export interface Event {
  title: string;
  description: string;
  startDate: Date;
  startTime: string;
  duration: number;
  venue: Venue;
  eventType: string;
  format: EventFormat;
  onlineUrl?: string;
  bannerImage?: ImageConfig;
  timezone: string;
}

export interface EventInput {
  title?: string;
  description?: string;
  startDate?: Date | string;
  startTime?: string;
  duration?: number;
  venue?: Partial<Venue>;
  eventType?: string;
  format?: EventFormat;
  onlineUrl?: string;
  bannerImage?: ImageConfig;
  timezone?: string;
}
