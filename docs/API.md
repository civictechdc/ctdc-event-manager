# API Documentation

This document provides detailed API reference for developers extending or contributing to the DC Tech Event Manager.

## Table of Contents

- [Core Interfaces](#core-interfaces)
- [Models](#models)
- [Services](#services)
- [Platform API](#platform-api)
- [CLI Commands](#cli-commands)

## Core Interfaces

### EventPlatform

The main interface for implementing new event platforms.

```typescript
interface EventPlatform {
  readonly name: string;
  readonly displayName: string;
  
  createEvent(event: Event, context?: PlatformContext): Promise<PlatformResult>;
  uploadImage?(image: ImageConfig): Promise<string>;
  searchVenues?(query: string): Promise<VenueMatch[]>;
  createVenue?(venue: Venue): Promise<string>;
  authenticate?(credentials: AuthCredentials): Promise<void>;
  refreshAuth?(): Promise<void>;
}
```

**Properties:**

- `name` (string): Unique platform identifier (e.g., 'luma', 'meetup')
- `displayName` (string): Human-readable platform name (e.g., 'Luma', 'Meetup.com')

**Methods:**

#### createEvent

Creates an event on the platform.

**Parameters:**
- `event` (Event): Event data to create
- `context` (PlatformContext, optional): Additional context (e.g., Luma event URL for Meetup)

**Returns:** `Promise<PlatformResult>`

**Example:**

```typescript
const result = await platform.createEvent(event, { lumaEventUrl: 'https://luma.com/abc123' });

if (result.success) {
  console.log(`Event created: ${result.eventUrl}`);
} else {
  console.error(`Failed: ${result.error}`);
}
```

#### uploadImage (optional)

Uploads an image to the platform.

**Parameters:**
- `image` (ImageConfig): Image configuration (file path or URL)

**Returns:** `Promise<string>` - URL of uploaded image

**Example:**

```typescript
const imageUrl = await platform.uploadImage({
  source: { type: 'upload', path: './banner.jpg' },
  alt: 'Event banner'
});
```

#### searchVenues (optional)

Searches for existing venues on the platform.

**Parameters:**
- `query` (string): Search query (venue name or address)

**Returns:** `Promise<VenueMatch[]>` - Array of matching venues with confidence scores

**Example:**

```typescript
const venues = await platform.searchVenues('123 Main St');
const bestMatch = venues.find(v => v.score > 0.8);
```

### PlatformContext

Additional context passed to platform methods.

```typescript
interface PlatformContext {
  lumaEventUrl?: string;
}
```

**Properties:**

- `lumaEventUrl` (string, optional): URL of corresponding Luma event (used by Meetup to link back)

### PlatformResult

Result of event creation operation.

```typescript
interface PlatformResult {
  success: boolean;
  eventId?: string;
  eventUrl?: string;
  error?: string;
  draft?: boolean;
}
```

**Properties:**

- `success` (boolean): Whether operation succeeded
- `eventId` (string, optional): Platform-specific event ID
- `eventUrl` (string, optional): Public URL of created event
- `error` (string, optional): Error message if failed
- `draft` (boolean, optional): Whether event was created as draft

## Models

### Event

Core event data model.

```typescript
type EventFormat = 'in-person' | 'online' | 'hybrid';

interface Event {
  title: string;
  description: string;
  startDate: Date;
  startTime: string;              // "HH:mm" format
  duration: number;               // minutes
  venue: Venue;
  eventType: string;
  format: EventFormat;            // in-person, online, or hybrid
  onlineUrl?: string;             // meeting URL for online/hybrid
  bannerImage?: ImageConfig;
  timezone: string;               // IANA format
}
```

**Event Format:**

| Format | Luma | Meetup |
|--------|------|--------|
| `in-person` | Includes venue address | `eventType: inPerson`, venue resolved |
| `online` | Omits venue address, includes URL | `eventType: online`, no venue |
| `hybrid` | Includes both address and URL | `eventType: hybrid`, venue resolved |

**Example:**

```typescript
const event: Event = {
  title: 'Project Night',
  description: 'Join us for our monthly project night!',
  startDate: new Date('2024-01-15'),
  startTime: '18:00',
  duration: 180,
  venue: {
    name: 'Taoti Creative',
    address: '1500 Massachusetts Ave NW',
    city: 'Washington',
    state: 'DC',
    zip: '20005'
  },
  eventType: 'project-night',
  format: 'in-person',
  timezone: 'America/New_York'
};
```

**Online Event Example:**

```typescript
const onlineEvent: Event = {
  title: 'Virtual Hackathon',
  description: 'Join us online for our virtual hackathon!',
  startDate: new Date('2024-01-15'),
  startTime: '09:00',
  duration: 480,
  venue: {
    name: 'Online',
    address: '',
    city: '',
    state: '',
    zip: ''
  },
  eventType: 'hackathon',
  format: 'online',
  onlineUrl: 'https://zoom.us/j/123456789',
  timezone: 'America/New_York'
};
```

### Venue

Venue information.

```typescript
interface Venue {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  coordinates?: Coordinates;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}
```

### ImageConfig

Image configuration supporting upload or URL.

```typescript
type ImageSource = 
  | { type: 'upload'; path: string }
  | { type: 'url'; url: string };

interface ImageConfig {
  source: ImageSource;
  alt?: string;
}
```

**Examples:**

```typescript
// Upload local file
const uploadImage: ImageConfig = {
  source: { type: 'upload', path: './banner.jpg' },
  alt: 'Event banner'
};

// Use URL
const urlImage: ImageConfig = {
  source: { type: 'url', url: 'https://example.com/banner.jpg' }
};
```

### EventTemplate

Predefined event template.

```typescript
interface EventTemplate {
  id: string;
  name: string;
  description: string;
  venue: Venue;
  eventType: string;
  format?: EventFormat;           // in-person (default), online, or hybrid
  onlineUrl?: string;             // meeting URL for online/hybrid
  defaultDuration: number;
  defaultStartTime: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultBannerImage?: ImageConfig;
  defaultTimezone?: string;
  meetupVenueId?: string;
  enabled?: boolean;
}
```

**Template Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique template identifier |
| `name` | Yes | Display name |
| `description` | Yes | Template description |
| `venue` | Yes | Venue object |
| `eventType` | Yes | Event type (e.g., meetup, hackathon) |
| `format` | No | Event format (default: `in-person`) |
| `onlineUrl` | No | Online meeting URL for online/hybrid events |
| `defaultDuration` | Yes | Default duration in minutes |
| `defaultStartTime` | Yes | Default start time (HH:mm) |
| `defaultTitle` | Yes | Default event title (supports variables) |
| `defaultDescription` | Yes | Default description (supports variables, Markdown) |
| `defaultBannerImage` | No | Banner image configuration |
| `defaultTimezone` | No | Event timezone (default: America/New_York) |
| `meetupVenueId` | No | Meetup venue ID to bypass search |
| `enabled` | No | Whether template is active (default: true) |

## Services

### EventService

Orchestrates event creation across platforms.

```typescript
class EventService {
  constructor(config: Config);
  
  async createEvents(event: Event, options?: CreateEventOptions): Promise<EventCreationResult>;
}
```

**Methods:**

#### createEvents

Creates events on specified platforms with sequential workflow.

**Parameters:**
- `event` (Event): Event data
- `options` (CreateEventOptions, optional): Creation options

**Returns:** `Promise<EventCreationResult>`

**Example:**

```typescript
const service = new EventService(config);
const result = await service.createEvents(event, { 
  platforms: ['luma', 'meetup'],
  dryRun: false 
});

console.log('Luma:', result.luma.eventUrl);
console.log('Meetup:', result.meetup.eventUrl);
```

**Workflow:**

1. Validates event data
2. Creates Luma event (fail-fast)
3. Creates Meetup event with Luma link
4. Returns results for both platforms

### ValidationService

Validates event data before creation.

```typescript
class ValidationService {
  validateEvent(event: Event): void;
  validateDate(date: Date, time: string): void;
  validateDuration(duration: number): void;
  validateVenue(venue: Venue): void;
  validateTimezone(timezone: string): void;
}
```

**Methods:**

#### validateEvent

Validates complete event object.

**Parameters:**
- `event` (Event): Event to validate

**Throws:** Error if validation fails

**Example:**

```typescript
const validator = new ValidationService();

try {
  validator.validateEvent(event);
  console.log('Event is valid');
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

**Validations:**

- Title and description are not empty
- Date is in the future
- Time is in HH:mm format
- Duration is 15-1440 minutes
- Venue has all required fields
- Timezone is valid IANA format
- Coordinates (if provided) are valid

## Platform API

### LumaPlatform

Luma platform implementation.

```typescript
class LumaPlatform implements EventPlatform {
  constructor(apiKey: string);
  
  async createEvent(event: Event, context?: PlatformContext): Promise<PlatformResult>;
  async uploadImage(image: ImageConfig): Promise<string>;
}
```

**Features:**

- REST API client
- Image upload (files & URLs)
- Automatic retry with exponential backoff
- Signed URL handling

**API Endpoints:**

- `POST /v1/event/create` - Create event
- `POST /v1/images/create-upload-url` - Get upload URL
- `PUT <upload-url>` - Upload image

**Example:**

```typescript
const luma = new LumaPlatform(process.env.LUMA_API_KEY);

// Create event
const result = await luma.createEvent(event);

// Upload image
const imageUrl = await luma.uploadImage({
  source: { type: 'upload', path: './banner.jpg' }
});
```

### MeetupPlatform

Meetup platform implementation.

```typescript
class MeetupPlatform implements EventPlatform {
  constructor(accessToken: string, groupUrlname: string);
  
  async createEvent(event: Event, context?: PlatformContext): Promise<PlatformResult>;
  async searchVenues(query: string): Promise<VenueMatch[]>;
}
```

**Features:**

- GraphQL client
- OAuth authentication
- Draft mode support
- Venue fuzzy matching (0.8 threshold)
- Luma link injection

**GraphQL Mutations:**

- `createEvent` - Create event with draft support
- `searchVenues` - Search existing venues

**Example:**

```typescript
const meetup = new MeetupPlatform(
  process.env.MEETUP_ACCESS_TOKEN,
  process.env.MEETUP_GROUP_URLNAME
);

// Create event with Luma link
const result = await meetup.createEvent(event, {
  lumaEventUrl: 'https://luma.com/abc123'
});

// Search venues
const venues = await meetup.searchVenues('Taoti Creative');
```

### PlatformRegistry

Registry for managing multiple platforms.

```typescript
class PlatformRegistry {
  register(platform: EventPlatform): void;
  get(name: string): EventPlatform;
  getAll(): EventPlatform[];
  has(name: string): boolean;
}
```

**Example:**

```typescript
const registry = new PlatformRegistry();

// Register platforms
registry.register(new LumaPlatform(apiKey));
registry.register(new MeetupPlatform(accessToken, groupUrlname));

// Get platform
const luma = registry.get('luma');

// Check existence
if (registry.has('meetup')) {
  // ...
}
```

## CLI Commands

### create

Creates events on Luma and Meetup.

**Usage:**

```bash
event-publisher create [options]
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `-t, --template <id>` | string | - | Template ID |
| `-d, --date <date>` | string | - | Event date (YYYY-MM-DD) |
| `--time <time>` | string | - | Start time (HH:mm) |
| `--duration <minutes>` | number | - | Duration in minutes |
| `--custom` | boolean | false | Create custom event |
| `--title <title>` | string | - | Override title |
| `--description <desc>` | string | - | Override description |
| `--banner-image <path>` | string | - | Image file path |
| `--banner-url <url>` | string | - | Image URL |
| `--venue-name <name>` | string | - | Venue name |
| `--venue-address <addr>` | string | - | Venue address |
| `--venue-city <city>` | string | - | Venue city |
| `--venue-state <state>` | string | - | Venue state |
| `--venue-zip <zip>` | string | - | Venue ZIP |
| `--platforms <list>` | string | luma,meetup | Platforms to use |
| `--dry-run` | boolean | false | Preview without creating |

**Programmatic Usage:**

```typescript
import { createEventCommand } from './commands/create-event';

await createEventCommand({
  template: 'taoti-project-night',
  date: '2024-01-15',
  time: '18:00',
  platforms: 'luma,meetup',
  dryRun: false
});
```

### templates

Lists available event templates.

**Usage:**

```bash
event-publisher templates [options]
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--json` | boolean | false | Output as JSON |

**Programmatic Usage:**

```typescript
import { listTemplatesCommand } from './commands/list-templates';

await listTemplatesCommand({ json: false });
```

### auth

Authenticates with platforms.

**Usage:**

```bash
event-publisher auth <platform>
```

**Arguments:**

- `platform` (string): Platform name (luma, meetup)

**Programmatic Usage:**

```typescript
import { authCommand } from './commands/auth';

await authCommand({ platform: 'meetup' });
```

## Error Handling

### Custom Errors

The library provides custom error classes:

```typescript
// Base error
class EventPublisherError extends Error {
  constructor(message: string, public readonly code: string);
}

// API errors
class ApiError extends EventPublisherError {
  constructor(message: string, public readonly statusCode: number);
}

// Authentication errors
class AuthenticationError extends EventPublisherError {
  constructor(message: string);
}

// Rate limit errors
class RateLimitError extends EventPublisherError {
  constructor(message: string, public readonly retryAfter?: number);
}

// Network errors
class NetworkError extends EventPublisherError {
  constructor(message: string, public readonly cause?: Error);
}
```

**Example:**

```typescript
try {
  await platform.createEvent(event);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid credentials');
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof ApiError) {
    console.error(`API error (${error.statusCode}): ${error.message}`);
  } else {
    throw error;
  }
}
```

## Configuration

### Config Interface

```typescript
interface Config {
  lumaApiKey: string;
  meetupAccessToken: string;
  meetupGroupUrlname: string;
  meetupClientId?: string;
  meetupClientSecret?: string;
  defaultDuration: number;
  defaultStartTime: string;
  defaultTimezone: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enabledPlatforms: string[];
}
```

### Loading Configuration

```typescript
import { loadConfig } from './utils/config';

const config = loadConfig();
```

**Environment Variables:**

- `LUMA_API_KEY` (required)
- `MEETUP_ACCESS_TOKEN` (required)
- `MEETUP_GROUP_URLNAME` (required)
- `MEETUP_CLIENT_ID` (optional)
- `MEETUP_CLIENT_SECRET` (optional)
- `DEFAULT_EVENT_DURATION` (default: 180)
- `DEFAULT_START_TIME` (default: '18:00')
- `DEFAULT_TIMEZONE` (default: 'America/New_York')
- `LOG_LEVEL` (default: 'info')
- `ENABLED_PLATFORMS` (default: 'luma,meetup')

## Testing

### Test Utilities

```typescript
// Create mock event
import { createMockEvent } from '../tests/fixtures/events';

const event = createMockEvent({
  title: 'Test Event',
  startDate: new Date('2024-12-25')
});

// Create mock platform
import { createMockPlatform } from '../tests/mocks/platform-mock';

const platform = createMockPlatform({
  name: 'test',
  shouldFail: false
});
```

### Running Tests

```bash
# Unit tests
bun test

# Integration tests
bun test tests/integration

# E2E tests
bun test tests/e2e

# Coverage
bun run test:coverage
```

## Best Practices

### Error Handling

Always handle errors appropriately:

```typescript
try {
  const result = await service.createEvents(event);
  
  if (!result.luma.success) {
    console.error('Luma failed:', result.luma.error);
    // Don't continue to Meetup if Luma fails
    return;
  }
  
  if (!result.meetup.success) {
    console.error('Meetup failed:', result.meetup.error);
    // Handle partial success
  }
} catch (error) {
  // Handle unexpected errors
  console.error('Unexpected error:', error);
}
```

### Validation

Always validate before creation:

```typescript
const validator = new ValidationService();

try {
  validator.validateEvent(event);
  await service.createEvents(event);
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

### Dry-Run Mode

Use dry-run for testing:

```typescript
const result = await service.createEvents(event, { dryRun: true });
console.log('Would create:', result);
```

### Image Handling

Check image configuration:

```typescript
if (event.bannerImage) {
  if (event.bannerImage.source.type === 'upload') {
    // Verify file exists
    if (!fs.existsSync(event.bannerImage.source.path)) {
      throw new Error('Image file not found');
    }
  } else {
    // Verify URL is valid
    try {
      new URL(event.bannerImage.source.url);
    } catch {
      throw new Error('Invalid image URL');
    }
  }
}
```

## Extending the Platform

### Adding a New Platform

1. Implement `EventPlatform` interface
2. Create platform-specific client
3. Register in `EventService`
4. Add configuration
5. Update CLI if needed

See [README.md](README.md#adding-new-platforms) for detailed guide.

## Type Safety

All models use TypeScript for type safety:

```typescript
// Type-safe event creation
const event: Event = {
  title: 'Event',
  description: 'Description',
  startDate: new Date(),
  startTime: '18:00',
  duration: 180,
  venue: venue, // Type-checked
  eventType: 'workshop',
  timezone: 'America/New_York'
};

// Type-safe platform result
const result: PlatformResult = await platform.createEvent(event);
```

## Further Reading

- [Architecture Guide](.agent-workspace/planning/ARCHITECTURE.md)
- [Implementation Plan](.agent-workspace/planning/FINAL_IMPLEMENTATION_PLAN.md)
- [Docker Documentation](docker/DOCKER.md)
- [GitHub Actions Documentation](.github/workflows/README.md)
