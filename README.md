# DC Tech Event Manager

A TypeScript CLI tool for creating and publishing events to Luma and Meetup.com platforms with template support, draft mode, and Docker containerization.

## Features

- **Multi-platform support**: Create events on both Luma and Meetup.com simultaneously
- **Template-based events**: 3 predefined venue templates (Taoti, Virtru, Prefect)
- **Custom events**: Full control over all event details
- **Template overrides**: Customize template defaults
- **Draft mode**: Meetup events created as drafts for review
- **Image support**: Upload images or use URLs (Luma)
- **Smart venue resolution**: Fuzzy matching for Meetup venues
- **Dry-run mode**: Preview events before creation
- **Date validation**: Prevents past events
- **OAuth authentication**: Secure Meetup integration
- **Docker support**: Production-ready containers
- **GitHub Actions**: Automated event creation via workflows
- **Extensible architecture**: Easy to add new platforms

## Installation

### Prerequisites

- Node.js 18.x or higher
- Bun (recommended) or npm/pnpm
- Docker (optional, for containerized usage)

### Local Installation

```bash
# Clone the repository
git clone https://github.com/your-org/dc-tech-event-manager.git
cd dc-tech-event-manager

# Install dependencies (bun recommended)
bun install

# Or with npm
npm install

# Build the project
bun run build

# Run CLI
bun run dev --help
```

### Docker Installation

```bash
# Build Docker image
docker build -f docker/Dockerfile -t event-publisher .

# Run with environment file
docker run --env-file .env event-publisher --help
```

## Configuration

### Environment Variables

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Configure your credentials:

```bash
# Luma Configuration
LUMA_API_KEY=your_luma_api_key_here

# Meetup Configuration
MEETUP_ACCESS_TOKEN=your_access_token_here
MEETUP_GROUP_URLNAME=civic-tech-dc
MEETUP_CLIENT_ID=your_oauth_client_id        # Optional: for OAuth flow
MEETUP_CLIENT_SECRET=your_oauth_client_secret # Optional: for OAuth flow

# Optional Defaults
DEFAULT_EVENT_DURATION=180
DEFAULT_START_TIME=18:00
DEFAULT_TIMEZONE=America/New_York

# Logging
LOG_LEVEL=info

# Platform Selection (comma-separated)
ENABLED_PLATFORMS=luma,meetup

# Primary platform executed first in multi-platform runs (defaults to luma)
PRIMARY_PLATFORM=luma
```

### Obtaining API Credentials

#### Luma API Key

1. Log in to your Luma account
2. Navigate to Settings → API Keys
3. Generate a new API key
4. Copy the key to your `.env` file

#### Meetup Access Token

**Option 1: OAuth Flow (Recommended)**

```bash
# Run the auth command
bun run dev auth meetup
```

This will:
- Open your browser to the Meetup authorization page
- Prompt you to authorize the application
- Automatically save tokens to your environment

**Option 2: Manual Token Generation**

1. Create a Meetup OAuth application at https://www.meetup.com/api/oauth/
2. Set redirect URI to `http://localhost:3000/callback`
3. Run the auth command or manually obtain tokens

## Usage

### Interactive Mode

Create events with interactive prompts:

```bash
bun run dev create
```

This will guide you through:
- Choosing template or custom event
- Setting date, time, and duration
- Configuring event details
- Previewing before creation

### Template-Based Events

Create events using predefined templates:

```bash
# Interactive template selection
bun run dev create

# Specific template with date
bun run dev create --template taoti-project-night --date 2024-01-15

# Override defaults
bun run dev create \
  --template virtru-project-night \
  --date 2024-01-15 \
  --time 19:00 \
  --duration 120
```

**Available Templates:**

1. **taoti-project-night** - Taoti Project Night at Taoti Creative
2. **virtru-project-night** - Virtru Project Night at Virtru DC Office
3. **prefect-project-night** - Prefect Project Night at Prefect Technologies

### Custom Events

Create fully customized events:

```bash
# Interactive custom event
bun run dev create --custom

# With all details specified
bun run dev create --custom \
  --title "Special Workshop" \
  --description "Join us for a special workshop on..." \
  --date 2024-01-20 \
  --time 14:00 \
  --duration 120 \
  --venue-name "Community Center" \
  --venue-address "123 Main St" \
  --venue-city "Washington" \
  --venue-state "DC" \
  --venue-zip "20001"
```

### With Images

Add banner images to your events:

```bash
# Upload local image
bun run dev create \
  --template taoti-project-night \
  --date 2024-01-15 \
  --banner-image ./flyer.jpg

# Use image URL
bun run dev create \
  --template taoti-project-night \
  --date 2024-01-15 \
  --banner-url https://example.com/event-banner.jpg
```

**Supported Image Formats (Luma):**
- JPEG, PNG, GIF, WebP, AVIF
- Recommended size: 1920x1080 pixels
- Max file size: 10MB

### Dry-Run Mode

Preview events without creating them:

```bash
bun run dev create \
  --template taoti-project-night \
  --date 2024-01-15 \
  --dry-run
```

This shows what would be created without making API calls.

### Platform Selection

Platforms are determined by `ENABLED_PLATFORMS` in your `.env` file. You only need credentials for the platforms you plan to use. Use `--platforms` to override the environment default for a single run:

```bash
# Luma only
bun run dev create --template taoti-project-night --date 2024-01-15 --platforms luma

# Meetup only
bun run dev create --template taoti-project-night --date 2024-01-15 --platforms meetup

# Both platforms
bun run dev create --template taoti-project-night --date 2024-01-15 --platforms luma,meetup
```

When `--platforms` is omitted, the command reads `ENABLED_PLATFORMS` and never falls back to a hard-coded default. In a multi-platform run, `PRIMARY_PLATFORM` is executed first (defaults to `luma`). If the primary platform fails, the remaining platforms are skipped. If a secondary platform fails after the primary succeeds, the run is reported as `partially-succeeded` with all outcomes listed.

### List Templates

View all available templates:

```bash
# Human-readable format
bun run dev templates

# JSON format for scripts
bun run dev templates --json
```

### Authentication

Set up platform authentication:

```bash
# Setup Meetup OAuth
bun run dev auth meetup

# View Luma instructions
bun run dev auth luma
```

## Event Creation Workflow

The tool follows a sequential workflow:

1. **Validation**: Validates all event data (date, time, venue, etc.)
2. **Preflight**: Checks that every selected platform is known and configured before making API calls
3. **Primary platform first**: Runs `PRIMARY_PLATFORM` (default `luma`) first in multi-platform runs
4. **Luma Creation**: Creates event on Luma platform
   - Uploads image if provided
   - Sets event details
   - Returns event URL
5. **Meetup Creation**: Creates event on Meetup with the successful Luma URL
   - Resolves venue (fuzzy matching)
   - Injects Luma registration link
   - Creates as **DRAFT** for review
6. **Summary**: Prints a status line and one line per platform outcome (success URL, error, or warning)

**Important**: Meetup events are created in DRAFT mode. You must manually review and publish them in the Meetup dashboard.

## Testing

### Run Tests

```bash
# Run all tests
bun test

# Watch mode
bun run test:watch

# Coverage report
bun run test:coverage

# UI mode
bun run test:ui
```

### Test Coverage

The project maintains >80% test coverage:

- **Unit Tests**: Models, services, platforms, commands
- **Integration Tests**: API clients, platform workflows
- **E2E Tests**: CLI commands end-to-end

Current coverage: 186 tests passing

## Docker

### Build and Run

```bash
# Build image
docker build -f docker/Dockerfile -t event-publisher:latest .

# Run with environment
docker run --rm \
  --env-file .env \
  event-publisher:latest \
  create --template taoti-project-night --date 2024-01-15

# Interactive mode
docker run --rm -it \
  --env-file .env \
  event-publisher:latest \
  create
```

### Development with Docker Compose

```bash
# Start development environment
docker-compose -f docker/docker-compose.yml up

# With cache service
docker-compose -f docker/docker-compose.yml --profile cache up
```

For comprehensive Docker documentation, see [docker/DOCKER.md](docker/DOCKER.md).

## GitHub Actions

### Automated Event Creation

Create events directly from GitHub:

1. Go to **Actions** tab in your repository
2. Select **"Create Event"** workflow
3. Click **"Run workflow"**
4. Fill in the form:
   - Template: Select from dropdown
   - Date: Event date (YYYY-MM-DD)
   - Time: Start time (optional)
   - Duration: Duration in minutes (optional)
5. Click **"Run workflow"**

### Required Secrets

Configure these secrets in your repository settings:

- `LUMA_API_KEY`: Luma API key
- `MEETUP_ACCESS_TOKEN`: Meetup OAuth access token
- `MEETUP_GROUP_URLNAME`: Your Meetup group URL name

### Workflow Features

- Automated testing on push/PR
- Manual event creation with form inputs
- Docker image publishing to GitHub Container Registry
- Automated releases with artifacts
- Failure notifications via GitHub Issues

For comprehensive GitHub Actions documentation, see [.github/workflows/README.md](.github/workflows/README.md).

## Architecture

### Platform Abstraction Layer

The tool uses a platform abstraction pattern for extensibility:

```typescript
interface EventPlatform {
  name: string;
  createEvent(event: Event, context?: PlatformContext): Promise<PlatformResult>;
  uploadImage?(image: ImageConfig): Promise<string>;
  searchVenues?(query: string): Promise<VenueMatch[]>;
  authenticate?(credentials: AuthCredentials): Promise<void>;
}
```

### Project Structure

```
dc-tech-event-manager/
├── src/
│   ├── index.ts                    # CLI entry point
│   ├── commands/                   # CLI commands
│   │   ├── create-event.ts         # Event creation
│   │   ├── list-templates.ts       # Template listing
│   │   └── auth.ts                 # Authentication
│   ├── platforms/                  # Platform implementations
│   │   ├── platform.interface.ts   # Platform abstraction
│   │   ├── platform-registry.ts    # Platform registry
│   │   ├── luma/                   # Luma platform
│   │   └── meetup/                 # Meetup platform
│   ├── services/                   # Business logic
│   │   ├── event-service.ts        # Event orchestration
│   │   └── validation-service.ts   # Input validation
│   ├── models/                     # Data models
│   │   ├── event.ts                # Event model
│   │   ├── venue.ts                # Venue model
│   │   ├── template.ts             # Template model
│   │   └── image.ts                # Image model
│   ├── templates/                  # Event templates
│   │   ├── venue-templates.ts      # Predefined templates
│   │   └── template-manager.ts     # Template loader
│   └── utils/                      # Utilities
│       ├── config.ts               # Configuration
│       ├── http-client.ts          # HTTP client
│       └── logger.ts               # Logging
├── tests/                          # Test files
│   ├── unit/                       # Unit tests
│   ├── integration/                # Integration tests
│   └── mocks/                      # Test mocks
├── docker/                         # Docker configuration
├── .github/workflows/              # GitHub Actions
└── package.json                    # Dependencies
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Language | TypeScript | Type safety, better DX |
| CLI Framework | Commander.js | Command-line interface |
| Interactive Prompts | Inquirer.js | User input |
| HTTP Client | Axios | API requests |
| Validation | Zod | Runtime validation |
| Date Handling | date-fns | Date operations |
| Testing | Vitest | Unit/integration tests |
| Package Manager | Bun | Fast dependency management |

## Adding New Platforms

To add support for a new platform (e.g., Eventbrite):

1. **Implement the EventPlatform interface**:

```typescript
// src/platforms/eventbrite/eventbrite-platform.ts
export class EventbritePlatform implements EventPlatform {
  readonly name = 'eventbrite';
  readonly displayName = 'Eventbrite';
  
  async createEvent(event: Event, context?: PlatformContext): Promise<PlatformResult> {
    // Implementation
  }
  
  async uploadImage(image: ImageConfig): Promise<string> {
    // Implementation
  }
}
```

2. **Create platform client**:

```typescript
// src/platforms/eventbrite/eventbrite-client.ts
export class EventbriteClient {
  // API client implementation
}
```

3. **Register in EventService**:

```typescript
// src/services/event-service.ts
import { EventbritePlatform } from '../platforms/eventbrite/eventbrite-platform';

// In constructor:
this.registry.register(new EventbritePlatform(config.eventbriteApiKey));
```

4. **Add configuration**:

```bash
# .env.example
EVENTBRITE_API_KEY=your_api_key_here
```

5. **Update CLI**:

Add platform-specific options to the create command if needed.

## Troubleshooting

### Common Issues

#### "LUMA_API_KEY not found"

**Problem**: Missing or invalid Luma API key.

**Solution**:
1. Verify `.env` file exists
2. Check `LUMA_API_KEY` is set correctly
3. Ensure no extra spaces or quotes around the key

```bash
# Correct
LUMA_API_KEY=sk_live_abc123

# Incorrect
LUMA_API_KEY="sk_live_abc123"
LUMA_API_KEY = sk_live_abc123
```

#### "Meetup authentication failed"

**Problem**: OAuth flow failed or token expired.

**Solution**:
1. Run `bun run dev auth meetup` to refresh tokens
2. Check `MEETUP_CLIENT_ID` and `MEETUP_CLIENT_SECRET` are correct
3. Verify redirect URI matches in Meetup OAuth settings

#### "Event date must be in the future"

**Problem**: Trying to create an event in the past.

**Solution**:
- Use a future date: `--date 2024-12-25`
- Check date format is YYYY-MM-DD

#### "Venue not found on Meetup"

**Problem**: Meetup venue search returned no matches.

**Solution**:
1. Create the venue manually in Meetup dashboard first
2. Use the exact venue name from Meetup
3. Check venue address matches Meetup's format

#### "Image upload failed"

**Problem**: Image could not be uploaded to Luma.

**Solution**:
1. Check image format is supported (JPEG, PNG, GIF, WebP, AVIF)
2. Ensure file size is under 10MB
3. Try using `--banner-url` instead of `--banner-image`
4. Verify file path is correct

#### "Docker container fails to start"

**Problem**: Docker container exits immediately.

**Solution**:
1. Check `.env` file exists and is readable
2. Verify environment variables are set
3. Check Docker logs: `docker logs <container-id>`

```bash
# Run with debug logging
docker run --env-file .env -e LOG_LEVEL=debug event-publisher create --help
```

### Debug Mode

Enable verbose logging:

```bash
# In .env file
LOG_LEVEL=debug

# Or via command line (if supported)
LOG_LEVEL=debug bun run dev create --template taoti-project-night --date 2024-01-15
```

### Getting Help

1. **Check documentation**: Review this README and linked docs
2. **Run tests**: `bun test` to verify setup
3. **Dry-run mode**: Use `--dry-run` to test without creating events
4. **GitHub Issues**: Report bugs or request features
5. **Verbose output**: Enable debug logging

### Validation Errors

The tool validates all inputs before creating events:

- **Date**: Must be in YYYY-MM-DD format and in the future
- **Time**: Must be in HH:mm format (24-hour)
- **Duration**: Must be 15-1440 minutes (15 min - 24 hours)
- **Venue**: Must have name, address, city, state, and zip
- **Timezone**: Must be valid IANA timezone (e.g., America/New_York)
- **Coordinates**: If provided, must be valid lat/long

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `bun test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Setup

```bash
# Install dependencies
bun install

# Run in development
bun run dev --help

# Run tests in watch mode
bun run test:watch

# Build
bun run build

# Type check
bun run typecheck

# Lint
bun run lint
```

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with [Commander.js](https://github.com/tj/commander.js)
- Interactive prompts by [Inquirer.js](https://github.com/SBoudrias/Inquirer.js)
- Testing with [Vitest](https://vitest.dev/)
- Fast package management with [Bun](https://bun.sh/)

## Support

For support, please open a GitHub issue or contact the maintainers.

---

**Version**: 1.0.0  
**Last Updated**: March 2026  
**Maintained by**: DC Tech Community
