# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the DC Tech Event Manager.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Configuration Issues](#configuration-issues)
- [Authentication Problems](#authentication-problems)
- [Event Creation Failures](#event-creation-failures)
- [Image Upload Issues](#image-upload-issues)
- [Venue Problems](#venue-problems)
- [Docker Issues](#docker-issues)
- [GitHub Actions Issues](#github-actions-issues)
- [Performance Issues](#performance-issues)
- [Error Messages Reference](#error-messages-reference)

## Quick Diagnostics

### Health Check

Run these commands to verify your setup:

```bash
# 1. Check Node.js version (must be 24.18.0)
node --version

# 2. Check dependencies are installed
bun --version
bun install

# 3. Verify environment file exists
ls -la .env

# 4. Run tests to verify setup
bun test

# 5. Try dry-run mode
bun run dev create --template taoti-project-night --date 2024-12-25 --dry-run
```

### Enable Debug Mode

Get detailed logging for troubleshooting:

```bash
# In .env file
LOG_LEVEL=debug

# Or inline
LOG_LEVEL=debug bun run dev create --help
```

## Configuration Issues

### Issue: "Configuration validation failed"

**Symptoms:**
- Error: "Invalid configuration"
- Application won't start

**Diagnosis:**

```bash
# Check .env file exists
cat .env

# Verify required variables
grep -E "LUMA_API_KEY|MEETUP_ACCESS_TOKEN|MEETUP_GROUP_URLNAME" .env
```

**Solutions:**

1. **Missing .env file:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

2. **Empty required fields:**
   ```bash
   # Make sure these are set
   LUMA_API_KEY=sk_live_abc123...
   MEETUP_ACCESS_TOKEN=eyJhbGc...
   MEETUP_GROUP_URLNAME=your-group-name
   ```

3. **Invalid format:**
   ```bash
   # Wrong - has quotes
   LUMA_API_KEY="sk_live_abc123"
   
   # Wrong - has spaces
   LUMA_API_KEY = sk_live_abc123
   
   # Correct
   LUMA_API_KEY=sk_live_abc123
   ```

### Issue: "Environment variables not loaded"

**Symptoms:**
- Config shows undefined values
- dotenv not working

**Diagnosis:**

```bash
# Check if dotenv is loading
bun run dev -e "console.log(process.env.LUMA_API_KEY)"
```

**Solutions:**

1. **File location:**
   ```bash
   # .env must be in project root
   ls -la .env
   ```

2. **File permissions:**
   ```bash
   # Make sure it's readable
   chmod 644 .env
   ```

3. **Explicit loading:**
   ```typescript
   // In code
   import dotenv from 'dotenv';
   dotenv.config({ path: '.env' });
   ```

## Authentication Problems

### Issue: "LUMA_API_KEY not found"

**Symptoms:**
- Error: "Luma API key is required"
- 401 Unauthorized from Luma

**Diagnosis:**

```bash
# Check if key is set
echo $LUMA_API_KEY

# Or from .env
grep LUMA_API_KEY .env
```

**Solutions:**

1. **Get API key:**
   - Log in to Luma
   - Go to Settings → API Keys
   - Generate new key

2. **Set in .env:**
   ```bash
   LUMA_API_KEY=your_actual_key_here
   ```

3. **Verify key format:**
   - Should start with `sk_live_` or `sk_test_`
   - Should be a long alphanumeric string
   - No spaces or special characters

### Issue: "Meetup authentication failed"

**Symptoms:**
- OAuth flow doesn't complete
- Error: "Invalid grant"
- Token expired

**Diagnosis:**

```bash
# Try auth command
bun run dev auth meetup
```

**Solutions:**

1. **OAuth flow issues:**
   ```bash
   # Clear any cached tokens
   rm -rf .meetup-tokens
   
   # Re-run auth
   bun run dev auth meetup
   ```

2. **Redirect URI mismatch:**
   - Check Meetup OAuth app settings
   - Redirect URI must be: `http://localhost:3000/callback`
   - No trailing slash

3. **Expired token:**
   ```bash
   # Refresh token
   bun run dev auth meetup
   ```

4. **Invalid credentials:**
   ```bash
   # Verify in .env
   MEETUP_CLIENT_ID=your_client_id
   MEETUP_CLIENT_SECRET=your_client_secret
   ```

### Issue: "Access token expired"

**Symptoms:**
- Error: "Token expired"
- 401 from Meetup API

**Solutions:**

1. **Refresh token:**
   ```bash
   bun run dev auth meetup
   ```

2. **Check token expiration:**
   ```typescript
   // Tokens expire after 1 hour
   // Refresh tokens are valid for 30 days
   ```

3. **Automate refresh:**
   ```bash
   # Add to crontab for auto-refresh
   0 * * * * cd /path/to/project && bun run dev auth meetup
   ```

## Event Creation Failures

### Issue: "Event date must be in the future"

**Symptoms:**
- Validation error on date
- Can't create events

**Diagnosis:**

```bash
# Check date format
date "+%Y-%m-%d"
```

**Solutions:**

1. **Use future date:**
   ```bash
   # Wrong - past date
   --date 2023-01-01
   
   # Correct - future date
   --date 2024-12-25
   ```

2. **Date format:**
   ```bash
   # Must be YYYY-MM-DD
   --date 2024-01-15
   ```

3. **Timezone issues:**
   ```bash
   # Set correct timezone in .env
   DEFAULT_TIMEZONE=America/New_York
   ```

### Issue: "Invalid event duration"

**Symptoms:**
- Error: "Duration must be 15-1440 minutes"

**Solutions:**

```bash
# Valid durations
--duration 30   # 30 minutes
--duration 60   # 1 hour
--duration 180  # 3 hours (default)
--duration 1440 # 24 hours (max)

# Invalid durations
--duration 10   # Too short
--duration 1500 # Too long
```

### Issue: "Venue validation failed"

**Symptoms:**
- Error: "Venue must include name, address, city, state, and zip"

**Solutions:**

1. **Provide all fields:**
   ```bash
   --venue-name "Community Center" \
   --venue-address "123 Main St" \
   --venue-city "Washington" \
   --venue-state "DC" \
   --venue-zip "20001"
   ```

2. **Use template:**
   ```bash
   # Templates have venue pre-configured
   --template taoti-project-night
   ```

### Issue: "Luma creation failed"

**Symptoms:**
- Error from Luma API
- No event created

**Diagnosis:**

```bash
# Enable debug logging
LOG_LEVEL=debug bun run dev create --template taoti-project-night --date 2024-12-25
```

**Solutions:**

1. **API key invalid:**
   ```bash
   # Verify key is correct
   # Test with curl
   curl -H "x-luma-api-key: YOUR_KEY" https://public-api.luma.com/v1/user/self
   ```

2. **Rate limited:**
   - Wait 1 minute
   - Reduce request frequency

3. **Invalid data:**
   - Check all required fields
   - Validate date format
   - Check timezone is IANA format

4. **Network error:**
   ```bash
   # Check connectivity
   curl -I https://public-api.luma.com
   ```

### Issue: "Meetup creation failed"

**Symptoms:**
- Error from Meetup GraphQL
- Luma created but not Meetup

**Diagnosis:**

```bash
# Enable debug logging
LOG_LEVEL=debug bun run dev create --template taoti-project-night --date 2024-12-25
```

**Solutions:**

1. **Token expired:**
   ```bash
   bun run dev auth meetup
   ```

2. **Group not found:**
   ```bash
   # Check group URL name
   grep MEETUP_GROUP_URLNAME .env
   
   # Must match your group's URL
   # meetup.com/YOUR-GROUP-NAME
   ```

3. **Venue not found:**
   - Create venue manually in Meetup
   - Use exact venue name
   - See [Venue Problems](#venue-problems)

4. **GraphQL error:**
   - Check error message details
   - Validate all field formats
   - Try with minimal data first

## Image Upload Issues

### Issue: "Image file not found"

**Symptoms:**
- Error: "ENOENT: no such file or directory"
- Upload fails

**Solutions:**

1. **Check file path:**
   ```bash
   # Use absolute or relative path
   --banner-image ./flyer.jpg
   --banner-image /Users/you/images/flyer.jpg
   ```

2. **Verify file exists:**
   ```bash
   ls -la ./flyer.jpg
   ```

3. **Check permissions:**
   ```bash
   chmod 644 ./flyer.jpg
   ```

### Issue: "Invalid image format"

**Symptoms:**
- Error: "Unsupported image format"
- Upload rejected

**Solutions:**

1. **Supported formats:**
   - JPEG (.jpg, .jpeg)
   - PNG (.png)
   - GIF (.gif)
   - WebP (.webp)
   - AVIF (.avif)

2. **Convert image:**
   ```bash
   # Using ImageMagick
   convert flyer.bmp flyer.jpg
   
   # Using sips (macOS)
   sips -s format jpeg flyer.png --out flyer.jpg
   ```

### Issue: "Image too large"

**Symptoms:**
- Error: "File size exceeds limit"
- Upload times out

**Solutions:**

1. **Check file size:**
   ```bash
   ls -lh flyer.jpg
   # Should be < 10MB
   ```

2. **Resize image:**
   ```bash
   # Using ImageMagick
   convert flyer.jpg -resize 1920x1080 flyer-resized.jpg
   
   # Using sips (macOS)
   sips -Z 1920 flyer.jpg
   ```

3. **Compress image:**
   ```bash
   # Reduce quality
   convert flyer.jpg -quality 85 flyer-compressed.jpg
   ```

4. **Use URL instead:**
   ```bash
   --banner-url https://example.com/flyer.jpg
   ```

### Issue: "Image upload timeout"

**Symptoms:**
- Upload hangs
- Connection timeout

**Solutions:**

1. **Check network:**
   ```bash
   curl -I https://public-api.luma.com
   ```

2. **Use smaller image:**
   ```bash
   # Reduce dimensions
   convert flyer.jpg -resize 1280x720 flyer-small.jpg
   ```

3. **Use URL:**
   ```bash
   --banner-url https://example.com/flyer.jpg
   ```

## Venue Problems

### Issue: "No matching venue found"

**Symptoms:**
- Error: "Venue not found on Meetup"
- Fuzzy matching fails

**Diagnosis:**

```bash
# Check venue search
LOG_LEVEL=debug bun run dev create --template taoti-project-night --date 2024-12-25
```

**Solutions:**

1. **Create venue manually:**
   - Go to Meetup group settings
   - Create new venue
   - Use exact name and address

2. **Use exact venue name:**
   ```bash
   # Match Meetup's venue name exactly
   --venue-name "Taoti Creative"  # Not "Taoti" or "Taoti Inc"
   ```

3. **Check address format:**
   ```bash
   # Use complete address
   --venue-address "1500 Massachusetts Ave NW"
   ```

4. **Lower match threshold:**
   - Default: 0.8 (80% match)
   - Consider manual venue creation if < 0.8

### Issue: "Multiple venues match"

**Symptoms:**
- Wrong venue selected
- Confusion between similar venues

**Solutions:**

1. **Use exact name:**
   ```bash
   --venue-name "Taoti Creative - DC Office"
   ```

2. **Include address:**
   ```bash
   --venue-address "1500 Massachusetts Ave NW, Suite 500"
   ```

3. **Use Meetup venue ID:**
   ```typescript
   // In template
   meetupVenueId: '12345678'
   ```

## Docker Issues

### Issue: "Container exits immediately"

**Symptoms:**
- Docker container stops
- No output

**Diagnosis:**

```bash
# Check logs
docker logs <container-id>

# Run interactively
docker run -it --env-file .env event-publisher --help
```

**Solutions:**

1. **Missing .env file:**
   ```bash
   # Mount .env file
   docker run --env-file .env event-publisher --help
   ```

2. **Invalid command:**
   ```bash
   # Check command syntax
   docker run --env-file .env event-publisher create --help
   ```

3. **Permission issues:**
   ```bash
   # Check .env permissions
   chmod 644 .env
   ```

### Issue: "Environment variables not loaded in Docker"

**Symptoms:**
- Config shows undefined
- Missing credentials

**Solutions:**

1. **Use --env-file:**
   ```bash
   docker run --env-file .env event-publisher create --help
   ```

2. **Pass individually:**
   ```bash
   docker run \
     -e LUMA_API_KEY=sk_live_abc123 \
     -e MEETUP_ACCESS_TOKEN=eyJhbGc... \
     event-publisher create --help
   ```

3. **Use Docker Compose:**
   ```yaml
   # docker-compose.yml
   services:
     event-publisher:
       env_file: .env
   ```

### Issue: "Docker build fails"

**Symptoms:**
- Build error
- Missing dependencies

**Solutions:**

1. **Clear Docker cache:**
   ```bash
   docker builder prune
   docker build --no-cache -f docker/Dockerfile -t event-publisher .
   ```

2. **Check Dockerfile syntax:**
   ```bash
   # Validate Dockerfile
   docker build -f docker/Dockerfile -t event-publisher . 2>&1 | head -20
   ```

3. **Update base image:**
   ```dockerfile
   # Use specific version
   FROM node:24.18.0-alpine
   ```

## GitHub Actions Issues

### Issue: "Workflow fails with authentication error"

**Symptoms:**
- GitHub Actions fails
- Error: "Invalid credentials"

**Diagnosis:**

Check GitHub Secrets are configured:
- Go to Settings → Secrets and variables → Actions
- Verify all required secrets exist

**Solutions:**

1. **Add missing secrets:**
   - `LUMA_API_KEY`
   - `MEETUP_ACCESS_TOKEN`
   - `MEETUP_GROUP_URLNAME`

2. **Update expired token:**
   ```bash
   # Generate new token locally
   bun run dev auth meetup
   
   # Update secret in GitHub
   ```

3. **Check secret names:**
   - Must match exactly (case-sensitive)
   - No extra spaces

### Issue: "Event creation workflow times out"

**Symptoms:**
- Workflow runs for > 30 minutes
- Eventually fails

**Solutions:**

1. **Check API status:**
   - Luma: https://status.luma.com
   - Meetup: https://status.meetup.com

2. **Reduce timeout:**
   ```yaml
   # In workflow
   timeout-minutes: 10
   ```

3. **Add retry logic:**
   - Already implemented in HTTP client
   - Check logs for retry attempts

### Issue: "Docker image push fails"

**Symptoms:**
- Error: "denied: permission_denied"
- Can't push to ghcr.io

**Solutions:**

1. **Check permissions:**
   - Enable GitHub Packages for repository
   - Grant write permissions to GITHUB_TOKEN

2. **Authenticate:**
   ```yaml
   - name: Log in to Container Registry
     uses: docker/login-action@v3
     with:
       registry: ghcr.io
       username: ${{ github.actor }}
       password: ${{ secrets.GITHUB_TOKEN }}
   ```

## Performance Issues

### Issue: "Slow event creation"

**Symptoms:**
- Takes > 30 seconds
- Timeouts

**Diagnosis:**

```bash
# Time the operation
time bun run dev create --template taoti-project-night --date 2024-12-25
```

**Solutions:**

1. **Network latency:**
   - Check internet connection
   - Try different DNS (1.1.1.1, 8.8.8.8)

2. **Large images:**
   - Use smaller images
   - Compress before upload

3. **API rate limits:**
   - Wait between requests
   - Use dry-run for testing

4. **System resources:**
   ```bash
   # Check available resources
   df -h      # Disk space
   free -h    # Memory
   top        # CPU
   ```

### Issue: "High memory usage"

**Symptoms:**
- Node process uses > 500MB
- System slows down

**Solutions:**

1. **Increase Node memory:**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" bun run dev create
   ```

2. **Reduce image size:**
   - Compress images
   - Use URLs instead of uploads

3. **Clear caches:**
   ```bash
   rm -rf node_modules/.cache
   rm -rf .vitest
   ```

## Error Messages Reference

### Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `INVALID_CONFIG` | Configuration validation failed | Check .env file |
| `AUTH_FAILED` | Authentication failed | Refresh credentials |
| `TOKEN_EXPIRED` | Access token expired | Run `auth meetup` |
| `RATE_LIMIT` | Too many requests | Wait and retry |
| `VENUE_NOT_FOUND` | No matching venue | Create venue manually |
| `INVALID_DATE` | Date validation failed | Use future date |
| `INVALID_IMAGE` | Image validation failed | Check format/size |
| `API_ERROR` | Platform API error | Check API status |
| `NETWORK_ERROR` | Connection failed | Check network |

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Configuration error |
| 3 | Authentication error |
| 4 | Validation error |
| 5 | API error |

### Debug Commands

```bash
# Verbose logging
LOG_LEVEL=debug bun run dev create --help

# Test configuration
bun run typecheck

# Run tests
bun test

# Dry-run mode
bun run dev create --template taoti-project-night --date 2024-12-25 --dry-run

# Check API connectivity
curl -I https://public-api.luma.com
curl -I https://api.meetup.com/gql-ext
```

## Getting Help

### Before Asking for Help

1. **Check this guide** - Most issues are covered here
2. **Enable debug mode** - `LOG_LEVEL=debug`
3. **Try dry-run** - `--dry-run`
4. **Run tests** - `bun test`
5. **Check logs** - Look for specific error messages

### Information to Provide

When reporting issues, include:

1. **Environment:**
   ```bash
   node --version
   bun --version
   uname -a
   ```

2. **Command that failed:**
   ```bash
   bun run dev create --template taoti-project-night --date 2024-12-25
   ```

3. **Error message:**
   - Full error output
   - Stack trace

4. **Debug output:**
   ```bash
   LOG_LEVEL=debug bun run dev create --template taoti-project-night --date 2024-12-25 2>&1 | tee debug.log
   ```

5. **Configuration** (sanitized):
   ```bash
   # Remove sensitive values
   grep -E "^[A-Z_]+=" .env | sed 's/=.*/=***/'
   ```

### Support Channels

1. **GitHub Issues**: Report bugs and request features
2. **Documentation**: README.md, API.md, this guide
3. **Community**: DC Tech Slack/Discord

## Prevention Tips

### Best Practices

1. **Use dry-run first:**
   ```bash
   bun run dev create --template taoti-project-night --date 2024-12-25 --dry-run
   ```

2. **Keep credentials fresh:**
   ```bash
   # Refresh Meetup token weekly
   bun run dev auth meetup
   ```

3. **Validate inputs:**
   - Check date format
   - Verify file paths
   - Test image uploads

4. **Monitor logs:**
   ```bash
   # Watch for errors
   LOG_LEVEL=info bun run dev create
   ```

5. **Test regularly:**
   ```bash
   # Run tests before changes
   bun test
   ```

### Maintenance

```bash
# Update dependencies
bun update

# Clear caches
rm -rf node_modules/.cache
rm -rf .vitest

# Rebuild
bun run build

# Verify
bun test
```

---

**Still stuck?** Open a GitHub issue with debug output and we'll help you troubleshoot.
