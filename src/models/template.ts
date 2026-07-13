import { Venue } from './venue';
import { ImageConfig } from './image';
import { EventFormat } from './event';

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
