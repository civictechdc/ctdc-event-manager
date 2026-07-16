import { Event } from '../models/event.js';
import { Venue } from '../models/venue.js';
import { ImageConfig } from '../models/image.js';

export interface PlatformContext {
  lumaEventUrl?: string;
}

export interface PlatformResult {
  success: boolean;
  eventId?: string;
  eventUrl?: string;
  error?: string;
  draft?: boolean;
}

export interface VenueMatch {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  score: number;
}

export interface AuthCredentials {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
}

export type PlatformErrorKind =
  | 'not-configured'
  | 'invalid-configuration'
  | 'platform-error';

export interface PlatformError {
  kind: PlatformErrorKind;
  code: string;
  message: string;
  retryable: boolean;
}

export type PublishStatus = 'succeeded' | 'failed' | 'skipped';

export interface PublishOutcomeSucceeded {
  platform: string;
  status: 'succeeded';
  eventId?: string;
  eventUrl?: string;
  draft?: boolean;
}

export interface PublishOutcomeFailed {
  platform: string;
  status: 'failed';
  error: PlatformError;
}

export interface PublishOutcomeSkipped {
  platform: string;
  status: 'skipped';
  reason: string;
}

export type PublishOutcome =
  | PublishOutcomeSucceeded
  | PublishOutcomeFailed
  | PublishOutcomeSkipped;

export interface PublishWarning {
  platform: string;
  reason: string;
}

export interface EventCreationResult {
  status: 'succeeded' | 'failed' | 'partially-succeeded';
  outcomes: PublishOutcome[];
  warnings: PublishWarning[];
  dryRun?: boolean;
}

export interface EventPlatform {
  readonly name: string;
  readonly displayName: string;
  
  createEvent(event: Event, context?: PlatformContext): Promise<PlatformResult>;
  uploadImage?(image: ImageConfig): Promise<string>;
  searchVenues?(query: string): Promise<VenueMatch[]>;
  createVenue?(venue: Venue): Promise<string>;
  authenticate?(credentials: AuthCredentials): Promise<void>;
  refreshAuth?(): Promise<void>;
}
