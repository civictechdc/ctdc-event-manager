# External Templates

This directory contains external event templates that can be customized without modifying the application code.

## Structure

```
templates/
├── index.yaml              # Registry of all templates
├── <template-id>/          # Directory for each template
│   ├── template.yaml       # Template definition
│   └── banner.jpg          # Optional banner image
```

## Creating a Custom Template

1. Create a new directory: `my-event/`
2. Add `template.yaml` with your template definition
3. Optionally add `banner.jpg` for the event banner
4. Update `index.yaml` to include your template

## Template Variables

You can use these variables in title and description:

- `{{venue.name}}` - Venue name
- `{{venue.address}}` - Street address
- `{{venue.city}}` - City
- `{{venue.state}}` - State
- `{{venue.zip}}` - ZIP code
- `{{date}}` - Event date
- `{{startTime}}` - Start time
- `{{duration}}` - Duration in minutes
- `{{eventType}}` - Event type

## Template Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique template identifier |
| `name` | Yes | Display name |
| `description` | Yes | Template description |
| `venue` | Yes | Venue object with name, address, city, state, zip |
| `eventType` | Yes | Event type (e.g., meetup, hackathon) |
| `format` | No | Event format: `in-person` (default), `online`, or `hybrid` |
| `onlineUrl` | No | Online meeting URL for online/hybrid events |
| `defaultDuration` | Yes | Default duration in minutes |
| `defaultStartTime` | Yes | Default start time (HH:mm) |
| `defaultTitle` | Yes | Default event title (supports variables) |
| `defaultDescription` | Yes | Default description (supports variables, Markdown) |
| `defaultBannerImage` | No | Banner image configuration |
| `defaultTimezone` | No | Event timezone (default: America/New_York) |

## Event Formats

The `format` field controls how events are created on each platform:

| Format | Luma | Meetup |
|--------|------|--------|
| `in-person` | Includes venue address | `eventType: inPerson`, venue resolved |
| `online` | Omits venue address, includes URL | `eventType: online`, no venue |
| `hybrid` | Includes both address and URL | `eventType: hybrid`, venue resolved |

## Example template.yaml

```yaml
id: my-custom-event
name: My Custom Event
description: A custom event template
venue:
  name: My Venue
  address: 123 Main St
  city: Washington
  state: DC
  zip: "20001"
eventType: meetup
format: in-person
defaultDuration: 120
defaultStartTime: "18:00"
defaultTitle: "{{venue.name}} Event"
defaultDescription: |
  Join us at {{venue.name}}!
  
  Location: {{venue.address}}, {{venue.city}}, {{venue.state}} {{venue.zip}}
  Time: {{startTime}}
```

## Example: Virtual Event Template

```yaml
id: virtual-hackathon
name: Virtual Hackathon
description: Online hackathon event
venue:
  name: Online
  address: ""
  city: ""
  state: ""
  zip: ""
eventType: hackathon
format: online
onlineUrl: https://zoom.us/j/123456789
defaultDuration: 480
defaultStartTime: "09:00"
defaultTitle: "Civic Tech DC Virtual Hackathon"
defaultDescription: |
  Join us online for our virtual hackathon!
  
  ## What to Expect
  - Collaborative coding
  - Community projects
  - All skill levels welcome
  
  ## Join Online
  Meeting Link: https://zoom.us/j/123456789
```

## Using External Templates

```bash
# List templates (includes external)
event-publisher templates

# Create event with external template
event-publisher create --template my-custom-event --date 2024-12-25

# Use custom templates path
event-publisher create --template my-event --templates-path ./my-templates

# Override format from CLI
event-publisher create --template my-custom-event --date 2024-12-25 --format online --online-url https://zoom.us/...
```

## CLI Format Options

```bash
# In-person event (default)
event-publisher create --template taoti-project-night --date 2024-01-15

# Online event
event-publisher create --template virtual-hackathon --date 2024-01-15

# Hybrid event with online URL
event-publisher create --template taoti-project-night --date 2024-01-15 --format hybrid --online-url https://zoom.us/...
```

## Configuration

Set the templates path via environment variable:

```bash
# In .env
TEMPLATES_PATH=./templates
```
