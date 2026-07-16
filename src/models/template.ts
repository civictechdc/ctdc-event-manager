import { Venue } from './venue.js';
import { ImageConfig } from './image.js';
import { EventFormat } from './event.js';

export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  venue: Venue;
  eventType: string;
  format?: EventFormat;
  onlineUrl?: string;
  defaultDuration: number;
  defaultStartTime: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultBannerImage?: ImageConfig;
  defaultTimezone?: string;
  meetupVenueId?: string;
  enabled?: boolean;
}

export interface TemplateList {
  templates: EventTemplate[];
  total: number;
}
