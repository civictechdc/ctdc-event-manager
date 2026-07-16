# Docker Usage Guide

This guide explains how to use the DC Tech Event Manager with Docker.

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose 2.0+ (optional, for development)
- Environment variables configured in `.env` file

## Quick Start

### Production Build

```bash
# Build the production image
docker build -f docker/Dockerfile -t event-publisher:latest .

# Run with environment file
docker run --rm --env-file .env event-publisher:latest --help

# Create event interactively
docker run --rm -it --env-file .env event-publisher:latest create

# Create event from template
docker run --rm --env-file .env event-publisher:latest \
  create --template taoti-project-night --date 2024-01-15
```

### Development Mode

```bash
# Start development environment with test watcher
docker-compose -f docker/docker-compose.yml up

# Run CLI in development mode
docker-compose -f docker/docker-compose.yml --profile cli up event-publisher-cli

# With Redis cache (optional)
docker-compose -f docker/docker-compose.yml --profile cache up
```

## Container Details

### Production Container (Dockerfile)

**Multi-stage build** for optimized image size:

1. **Builder stage**: Compiles TypeScript with bun
2. **Production stage**: Minimal Node.js Alpine image

**Features:**
- Node.js 24.18.0 Alpine (minimal footprint)
- Non-root user (eventuser:1001)
- Compiled JavaScript only (no source code)
- Production dependencies only

**Size:** ~150MB (compressed)

### Development Container (Dockerfile.dev)

**Full development environment** with hot reload:

- Bun runtime for fast builds
- All dependencies installed
- Source code mounted as volumes
- Test watcher enabled by default

## Environment Variables

Mount your `.env` file or pass variables directly:

```bash
# Using env file
docker run --env-file .env event-publisher:latest create

# Passing variables directly
docker run -e LUMA_API_KEY=xxx \
           -e MEETUP_ACCESS_TOKEN=xxx \
           -e MEETUP_GROUP_URLNAME=my-group \
           event-publisher:latest create
```

**Required variables:**
- `LUMA_API_KEY`
- `MEETUP_ACCESS_TOKEN`
- `MEETUP_GROUP_URLNAME`

## Volume Mounts

### Development Mode

The following directories are mounted read-only:

```yaml
volumes:
  - ../src:/app/src:ro           # Source code
  - ../tests:/app/tests:ro       # Test files
  - ../package.json:ro           # Dependencies
  - ../tsconfig.json:ro          # TypeScript config
  - ../vitest.config.ts:ro       # Test config
```

### Persistent Data (Optional)

Redis cache for venue data:

```yaml
volumes:
  - redis-data:/data
```

## Common Commands

### Build

```bash
# Build production image
docker build -f docker/Dockerfile -t event-publisher:latest .

# Build with specific tag
docker build -f docker/Dockerfile -t event-publisher:v1.0.0 .

# Build development image
docker build -f docker/Dockerfile.dev -t event-publisher:dev .
```

### Run

```bash
# Show help
docker run --rm event-publisher:latest --help

# List templates
docker run --rm --env-file .env event-publisher:latest templates

# Create event (interactive)
docker run --rm -it --env-file .env event-publisher:latest create

# Create event (non-interactive)
docker run --rm --env-file .env event-publisher:latest \
  create --template taoti-project-night \
         --date 2024-01-15 \
         --time 18:00

# Dry run (preview without creating)
docker run --rm --env-file .env event-publisher:latest \
  create --template taoti-project-night \
         --date 2024-01-15 \
         --dry-run
```

### Development

```bash
# Start test watcher
docker-compose -f docker/docker-compose.yml up

# Run tests once
docker-compose -f docker/docker-compose.yml run --rm event-publisher-dev bun test

# Start CLI
docker-compose -f docker/docker-compose.yml --profile cli run --rm event-publisher-cli

# Attach to running container
docker attach event-publisher-dev

# View logs
docker-compose -f docker/docker-compose.yml logs -f
```

### Debugging

```bash
# Run container with shell access
docker run --rm -it --entrypoint /bin/sh event-publisher:latest

# Development container with shell
docker run --rm -it --entrypoint /bin/sh \
  -v $(pwd)/src:/app/src \
  --env-file .env \
  event-publisher:dev

# Check container size
docker images event-publisher

# Inspect container layers
docker history event-publisher:latest
```

## Docker Compose Profiles

### Default Profile (Test Watcher)

```bash
docker-compose -f docker/docker-compose.yml up
```

Runs test watcher with hot reload.

### CLI Profile

```bash
docker-compose -f docker/docker-compose.yml --profile cli up event-publisher-cli
```

Runs CLI in development mode.

### Cache Profile

```bash
docker-compose -f docker/docker-compose.yml --profile cache up
```

Includes Redis for caching venue data.

### All Profiles

```bash
docker-compose -f docker/docker-compose.yml --profile cli --profile cache up
```

## Production Deployment

### Option 1: Docker Run

```bash
# Build
docker build -f docker/Dockerfile -t event-publisher:latest .

# Run
docker run -d \
  --name event-publisher \
  --restart unless-stopped \
  --env-file .env \
  event-publisher:latest \
  create --template taoti-project-night --date 2024-01-15
```

### Option 2: Portainer

1. **Push to registry:**
   ```bash
   docker tag event-publisher:latest your-registry.com/event-publisher:latest
   docker push your-registry.com/event-publisher:latest
   ```

2. **In Portainer:**
   - Image: `your-registry.com/event-publisher:latest`
   - Env vars: Add all required secrets
   - Command: `create --template taoti-project-night --date 2024-01-15`

### Option 3: Kubernetes

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: event-publisher
spec:
  template:
    spec:
      containers:
      - name: event-publisher
        image: event-publisher:latest
        command: ["node", "dist/index.js"]
        args: ["create", "--template", "taoti-project-night", "--date", "2024-01-15"]
        envFrom:
        - secretRef:
            name: event-publisher-secrets
      restartPolicy: Never
```

## Security Best Practices

### 1. Non-Root User

Production container runs as `eventuser` (UID 1001):

```dockerfile
USER eventuser
```

### 2. Minimal Base Image

Alpine Linux reduces attack surface:

```dockerfile
FROM node:24.18.0-alpine
```

### 3. No Secrets in Image

Environment variables passed at runtime:

```bash
docker run --env-file .env event-publisher:latest
```

### 4. Read-Only Mounts

Development volumes are read-only:

```yaml
volumes:
  - ../src:/app/src:ro
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs event-publisher

# Check environment variables
docker inspect event-publisher | jq '.[0].Config.Env'

# Run with debug output
docker run --rm -it --env-file .env event-publisher:latest --help
```

### Build Failures

```bash
# Clear Docker cache
docker builder prune -a

# Build with no cache
docker build --no-cache -f docker/Dockerfile -t event-publisher:latest .

# Check disk space
docker system df
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R $(whoami):$(id -gn) .

# Run as root (not recommended for production)
docker run --user root --env-file .env event-publisher:latest
```

### Network Issues

```bash
# Test connectivity
docker run --rm event-publisher:latest ping -c 3 google.com

# Use host network
docker run --network host --env-file .env event-publisher:latest
```

## Advanced Usage

### Multi-Platform Builds

```bash
# Build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 \
  -f docker/Dockerfile \
  -t event-publisher:latest \
  .
```

### Health Checks

Add to Dockerfile if needed:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1
```

### Resource Limits

```bash
# Limit memory and CPU
docker run --memory=512m --cpus=1.0 \
  --env-file .env \
  event-publisher:latest
```

## CI/CD Integration

See `.github/workflows/test.yml` for automated testing and `.github/workflows/create-event.yml` for automated event creation.

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Security Best Practices](https://snyk.io/blog/10-docker-image-security-best-practices/)
