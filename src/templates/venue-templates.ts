import { EventTemplate } from '../models/template';

export const VENUE_TEMPLATES: EventTemplate[] = [
  {
    id: 'taoti-project-night',
    name: 'Taoti Project Night',
    description: 'Monthly project night at Taoti Creative',
    venue: {
      name: 'Taoti Creative',
      address: '1333 H St NW',
      city: 'Washington',
      state: 'DC',
      zip: '20005',
      coordinates: {
        latitude: 38.8997,
        longitude: -77.0303
      }
    },
    eventType: 'project-night',
    defaultDuration: 180,
    defaultStartTime: '18:00',
    defaultTitle: 'Civic Tech DC Project Night',
    defaultDescription: `Join us for our monthly project night!

## What to Expect

- Work on civic tech projects
- Collaborate with fellow technologists
- Learn new skills
- Make a difference in our community

## Agenda

- 6:00 PM - Arrivals & networking
- 6:15 PM - Project introductions
- 6:30 PM - Break into project teams
- 8:30 PM - Wrap up & share progress

## Getting There

Metro: Gallery Place-Chinatown (Red/Green/Yellow lines)
Parking: Street parking available after 6:30 PM

## What to Bring

- Laptop
- Ideas and enthusiasm
- Willingness to collaborate

All skill levels welcome!`,
    defaultTimezone: 'America/New_York'
  },
  {
    id: 'virtru-project-night',
    name: 'Virtru Project Night',
    description: 'Monthly project night at Virtru',
    venue: {
      name: 'Virtru',
      address: '1608 Village Market St SE',
      city: 'Washington',
      state: 'DC',
      zip: '20003',
      coordinates: {
        latitude: 38.8762,
        longitude: -76.9885
      }
    },
    eventType: 'project-night',
    defaultDuration: 180,
    defaultStartTime: '18:00',
    defaultTitle: 'Civic Tech DC Project Night',
    defaultDescription: `Join us for our monthly project night at Virtru!

## What to Expect

- Privacy-focused civic tech projects
- Collaborative coding sessions
- Data security workshops
- Networking with privacy advocates

## Agenda

- 6:00 PM - Arrivals & pizza
- 6:15 PM - Welcome & project pitches
- 6:30 PM - Break into teams
- 8:30 PM - Show & tell

## Location

Eastern Market area - easy access via Metro

## What to Bring

- Laptop
- Interest in privacy/security
- Collaborative spirit

All skill levels welcome!`,
    defaultTimezone: 'America/New_York'
  },
  {
    id: 'prefect-project-night',
    name: 'Prefect Project Night',
    description: 'Monthly project night at Prefect',
    venue: {
      name: 'Prefect',
      address: '1820 N Fort Myer Dr',
      city: 'Arlington',
      state: 'VA',
      zip: '22209',
      coordinates: {
        latitude: 38.8942,
        longitude: -77.0716
      }
    },
    eventType: 'project-night',
    defaultDuration: 180,
    defaultStartTime: '18:00',
    defaultTitle: 'Civic Tech DC Project Night',
    defaultDescription: `Join us for our monthly project night at Prefect!

## What to Expect

- Data pipeline and automation projects
- Workflow orchestration discussions
- Python and data engineering focus
- Collaborative learning

## Agenda

- 6:00 PM - Arrivals & refreshments
- 6:15 PM - Project announcements
- 6:30 PM - Team formation
- 8:30 PM - Progress demos

## Getting There

Rosslyn Metro (Blue/Orange/Silver lines)
Short walk from station

## What to Bring

- Laptop
- Interest in data engineering
- Open mind to learn

All skill levels welcome!`,
    defaultTimezone: 'America/New_York'
  }
];

export function getTemplate(id: string): EventTemplate | undefined {
  return VENUE_TEMPLATES.find(t => t.id === id);
}

export function listTemplates(): EventTemplate[] {
  return VENUE_TEMPLATES;
}
