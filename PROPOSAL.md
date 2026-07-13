Using your skills and tools, create a plan on how to implement the following:

I would like to create an internal typescript-based tool that, can create and publish events on the Luma and Meetup.com platforms via their APIs. Each event should allow for configuration of certain variables and predefined templates:

The variables are:
- Event start time
- Event start date
- Event duration or end time (depending on API)
- Event location/address
- Event title/headline
- Event description text
- Event primary image/banner image
- Event type

We have a set of existing regular venues that we can select from. We can create pre-defined templates for that combination of venue name, location and event type.
Current templates are:
- Taoti Creative, 507 8th St SE, Washington, DC 20003, Project Night
- Virtru, 1801 Pennsylvania Ave NW 5th Floor, Washington, DC 20036, Project Night
- Prefect, 2112 Pennsylvania Ave NW, Washington, DC 20037, Project Night

Example upcoming Luma event: https://luma.com/12sf0fvk
Example upcoming meetup.com event: https://www.meetup.com/civic-tech-dc/events/313593314/

Allow for overrides of a given template for exceptional occations
Allow the user to create an event with all the variables customised if it's not a template event

If the API supports it, submit the event to 'draft' mode, where then the user can manually publish it after review.

Luma API guide: https://docs.luma.com/reference/examples
(you can convert Luma API pages into md, e.g. https://docs.luma.com/reference/post_v1-event-create.md)

Example luma repo: https://github.com/luma-team/examples

Meetup.com API guide: https://www.meetup.com/graphql/guide/
