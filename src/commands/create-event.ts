import { Command } from 'commander';
import inquirer, { DistinctQuestion } from 'inquirer';
import chalk from 'chalk';
import { Event, EventFormat } from '../models/event.js';
import { EventService } from '../services/event-service.js';
import { loadConfig } from '../utils/config.js';
import { getTemplateAsync, listTemplatesAsync, templateExistsAsync } from '../templates/template-manager.js';
import { EventTemplate } from '../models/template.js';
import { Venue } from '../models/venue.js';
import { ImageConfig } from '../models/image.js';
import { format, parse, isFuture, isValid } from 'date-fns';
import { EventCreationResult, PublishOutcome } from '../platforms/platform.interface.js';

export interface CreateEventOptions {
  template?: string;
  date?: string;
  time?: string;
  duration?: string;
  custom?: boolean;
  bannerImage?: string;
  bannerUrl?: string;
  platforms?: string;
  dryRun?: boolean;
  title?: string;
  description?: string;
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  venueState?: string;
  venueZip?: string;
  format?: string;
  onlineUrl?: string;
  templatesPath?: string;
  builtInOnly?: boolean;
}

export function validateFormat(input: string): boolean | string {
  const validFormats: EventFormat[] = ['in-person', 'online', 'hybrid'];
  if (!validFormats.includes(input as EventFormat)) {
    return `Format must be one of: ${validFormats.join(', ')}`;
  }
  return true;
}

export function validateDateFormat(input: string): boolean | string {
  const parsed = parse(input, 'yyyy-MM-dd', new Date());
  if (!isValid(parsed)) {
    return 'Please enter a valid date in YYYY-MM-DD format';
  }
  return true;
}

export function validateTimeFormat(input: string): boolean | string {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(input)) {
    return 'Please enter a valid time in HH:mm format (24-hour)';
  }
  return true;
}

export function validateFutureDate(input: string): boolean | string {
  const parsed = parse(input, 'yyyy-MM-dd', new Date());
  if (!isValid(parsed)) {
    return 'Please enter a valid date in YYYY-MM-DD format';
  }
  if (!isFuture(parsed)) {
    return 'Event date must be in the future';
  }
  return true;
}

export function validateDuration(input: string): boolean | string {
  const duration = parseInt(input, 10);
  if (isNaN(duration) || duration < 15) {
    return 'Duration must be at least 15 minutes';
  }
  if (duration > 1440) {
    return 'Duration cannot exceed 24 hours (1440 minutes)';
  }
  return true;
}

async function promptForTemplate(templatesPath?: string, useExternal: boolean = true): Promise<EventTemplate> {
  const templates = await listTemplatesAsync(templatesPath, useExternal);
  
  const { templateId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'templateId',
      message: 'Select a template:',
      choices: templates.map(t => ({
        name: `${t.name} - ${t.description}`,
        value: t.id,
        short: t.name
      }))
    }
  ]);
  
  const template = await getTemplateAsync(templateId, undefined, templatesPath, useExternal);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  
  return template;
}

async function promptForBasicDetails(
  template?: EventTemplate,
  options?: CreateEventOptions
): Promise<{ date: Date; time: string; duration: number }> {
  const prompts: DistinctQuestion[] = [];
  
  if (!options?.date) {
    prompts.push({
      type: 'input',
      name: 'date',
      message: 'Event date (YYYY-MM-DD):',
      validate: validateFutureDate
    });
  }
  
  if (!options?.time) {
    prompts.push({
      type: 'input',
      name: 'time',
      message: 'Start time (HH:mm):',
      default: template?.defaultStartTime || '18:00',
      validate: validateTimeFormat
    });
  }
  
  if (!options?.duration) {
    prompts.push({
      type: 'input',
      name: 'duration',
      message: 'Duration (minutes):',
      default: String(template?.defaultDuration || 180),
      validate: validateDuration
    });
  }
  
  if (prompts.length === 0) {
    return {
      date: parse(options!.date!, 'yyyy-MM-dd', new Date()),
      time: options!.time!,
      duration: parseInt(options!.duration!, 10)
    };
  }
  
  const answers = await inquirer.prompt(prompts);
  
  return {
    date: parse(options?.date || answers.date, 'yyyy-MM-dd', new Date()),
    time: options?.time || answers.time,
    duration: parseInt(options?.duration || answers.duration, 10)
  };
}

async function promptForCustomEvent(options?: CreateEventOptions): Promise<Partial<Event>> {
  const prompts: DistinctQuestion[] = [];
  
  if (!options?.title) {
    prompts.push({
      type: 'input',
      name: 'title',
      message: 'Event title:',
      validate: (input: string) => input.length > 0 || 'Title is required'
    });
  }
  
  if (!options?.description) {
    prompts.push({
      type: 'editor',
      name: 'description',
      message: 'Event description (Markdown):',
      validate: (input: string) => input.length > 0 || 'Description is required'
    });
  }
  
  if (!options?.venueName) {
    prompts.push({
      type: 'input',
      name: 'venueName',
      message: 'Venue name:',
      validate: (input: string) => input.length > 0 || 'Venue name is required'
    });
  }
  
  if (!options?.venueAddress) {
    prompts.push({
      type: 'input',
      name: 'venueAddress',
      message: 'Venue address:',
      validate: (input: string) => input.length > 0 || 'Address is required'
    });
  }
  
  if (!options?.venueCity) {
    prompts.push({
      type: 'input',
      name: 'venueCity',
      message: 'City:',
      default: 'Washington',
      validate: (input: string) => input.length > 0 || 'City is required'
    });
  }
  
  if (!options?.venueState) {
    prompts.push({
      type: 'input',
      name: 'venueState',
      message: 'State:',
      default: 'DC',
      validate: (input: string) => input.length > 0 || 'State is required'
    });
  }
  
  if (!options?.venueZip) {
    prompts.push({
      type: 'input',
      name: 'venueZip',
      message: 'ZIP code:',
      validate: (input: string) => /^\d{5}(-\d{4})?$/.test(input) || 'Valid ZIP code required'
    });
  }
  
  const answers = await inquirer.prompt(prompts);
  
  const basicDetails = await promptForBasicDetails(undefined, options);
  
  const venue: Venue = {
    name: options?.venueName || answers.venueName,
    address: options?.venueAddress || answers.venueAddress,
    city: options?.venueCity || answers.venueCity,
    state: options?.venueState || answers.venueState,
    zip: options?.venueZip || answers.venueZip
  };
  
  let bannerImage: ImageConfig | undefined;
  if (options?.bannerImage) {
    bannerImage = { source: { type: 'upload', path: options.bannerImage } };
  } else if (options?.bannerUrl) {
    bannerImage = { source: { type: 'url', url: options.bannerUrl } };
  }
  
  return {
    title: options?.title || answers.title,
    description: options?.description || answers.description,
    startDate: basicDetails.date,
    startTime: basicDetails.time,
    duration: basicDetails.duration,
    venue,
    eventType: 'custom',
    format: (options?.format as EventFormat) || 'in-person',
    onlineUrl: options?.onlineUrl,
    bannerImage,
    timezone: 'America/New_York'
  };
}

async function promptForTemplateEvent(
  template: EventTemplate,
  options?: CreateEventOptions
): Promise<Partial<Event>> {
  const basicDetails = await promptForBasicDetails(template, options);

  const overrides: { title?: boolean; description?: boolean } = {};
  
  if (!options?.title && !options?.description) {
    const { customizeContent } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'customizeContent',
        message: 'Customize title or description?',
        default: false
      }
    ]);
    
    if (customizeContent) {
      const { fields } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'fields',
          message: 'What would you like to customize?',
          choices: [
            { name: 'Title', value: 'title' },
            { name: 'Description', value: 'description' }
          ]
        }
      ]);
      
      overrides.title = fields.includes('title');
      overrides.description = fields.includes('description');
    }
  }
  
  const promptOverrides: DistinctQuestion[] = [];
  
  if ((overrides.title || options?.title === undefined) && !options?.title) {
    if (overrides.title) {
      promptOverrides.push({
        type: 'input',
        name: 'title',
        message: 'Event title:',
        default: template.defaultTitle
      });
    }
  }
  
  if ((overrides.description || options?.description === undefined) && !options?.description) {
    if (overrides.description) {
      promptOverrides.push({
        type: 'editor',
        name: 'description',
        message: 'Event description (Markdown):',
        default: template.defaultDescription
      });
    }
  }
  
  const overrideAnswers = promptOverrides.length > 0 
    ? await inquirer.prompt(promptOverrides)
    : {};
  
  let bannerImage: ImageConfig | undefined = template.defaultBannerImage;
  if (options?.bannerImage) {
    bannerImage = { source: { type: 'upload', path: options.bannerImage } };
  } else if (options?.bannerUrl) {
    bannerImage = { source: { type: 'url', url: options.bannerUrl } };
  }
  
  return {
    title: options?.title || overrideAnswers.title || template.defaultTitle,
    description: options?.description || overrideAnswers.description || template.defaultDescription,
    startDate: basicDetails.date,
    startTime: basicDetails.time,
    duration: basicDetails.duration,
    venue: template.venue,
    eventType: template.eventType,
    format: (options?.format as EventFormat) || template.format || 'in-person',
    onlineUrl: options?.onlineUrl || template.onlineUrl,
    bannerImage,
    timezone: template.defaultTimezone
  };
}

export function formatPublishResult(result: EventCreationResult): string {
  const lines: string[] = [];

  const statusColor =
    result.status === 'succeeded'
      ? chalk.green
      : result.status === 'partially-succeeded'
        ? chalk.yellow
        : chalk.red;
  lines.push(statusColor(`\nStatus: ${result.status}`));

  if (result.outcomes.length === 0) {
    lines.push(chalk.gray('No platform outcomes to report.'));
    return lines.join('\n');
  }

  for (const outcome of result.outcomes) {
    lines.push(formatOutcome(outcome));
  }

  if (result.dryRun) {
    lines.push(chalk.yellow('\nThis was a dry run. No events were actually created.'));
  }

  return lines.join('\n');
}

function formatOutcome(outcome: PublishOutcome): string {
  if (outcome.status === 'succeeded') {
    const url = outcome.eventUrl ?? 'created';
    const draftTag = outcome.draft ? chalk.yellow(' [DRAFT]') : '';
    return chalk.green(`  \u2713 ${outcome.platform}: ${url}${draftTag}`);
  }

  if (outcome.status === 'failed') {
    const retryable = outcome.error.retryable ? 'retryable' : 'not retryable';
    return chalk.red(`ERROR    ${outcome.platform}: ${outcome.error.message} (${retryable})`);
  }

  return chalk.yellow(`WARNING  ${outcome.platform} skipped: ${outcome.reason}`);
}

export async function createEventCommand(options: CreateEventOptions): Promise<void> {
  console.log(chalk.bold.blue('\nEvent Publisher - Create Event\n'));
  
  try {
    const config = loadConfig();
    const eventService = new EventService(config);
    
    const useExternal = !options.builtInOnly;
    
    let eventData: Partial<Event>;
    
    if (options.custom) {
      console.log(chalk.gray('Creating custom event...\n'));
      eventData = await promptForCustomEvent(options);
    } else if (options.template) {
      const exists = await templateExistsAsync(options.template, options.templatesPath, useExternal);
      if (!exists) {
        console.error(chalk.red(`Error: Template "${options.template}" not found`));
        console.log(chalk.gray('\nAvailable templates:'));
        const templates = await listTemplatesAsync(options.templatesPath, useExternal);
        templates.forEach(t => {
          console.log(chalk.gray(`  - ${t.id}: ${t.name}`));
        });
        process.exit(1);
      }
      
      const template = await getTemplateAsync(options.template, undefined, options.templatesPath, useExternal)!;
      console.log(chalk.gray(`Using template: ${template!.name}\n`));
      eventData = await promptForTemplateEvent(template!, options);
    } else {
      const { mode } = await inquirer.prompt([
        {
          type: 'list',
          name: 'mode',
          message: 'How would you like to create the event?',
          choices: [
            { name: 'Use a template', value: 'template' },
            { name: 'Create custom event', value: 'custom' }
          ]
        }
      ]);
      
      if (mode === 'template') {
        const template = await promptForTemplate(options.templatesPath, useExternal);
        eventData = await promptForTemplateEvent(template, options);
      } else {
        eventData = await promptForCustomEvent(options);
      }
    }
    
    const platforms = options.platforms
      ? options.platforms.split(',').map(p => p.trim()).filter(Boolean)
      : undefined;
    const displayPlatforms = platforms ?? config.enabledPlatforms;
    
    console.log(chalk.gray('\n--- Event Preview ---'));
    console.log(chalk.white(`Title: ${eventData.title}`));
    console.log(chalk.white(`Date: ${format(eventData.startDate!, 'EEEE, MMMM d, yyyy')}`));
    console.log(chalk.white(`Time: ${eventData.startTime} (${eventData.duration} minutes)`));
    console.log(chalk.white(`Format: ${eventData.format}`));
    if (eventData.format === 'online' || eventData.format === 'hybrid') {
      console.log(chalk.white(`Online URL: ${eventData.onlineUrl || 'Not provided'}`));
    }
    if (eventData.format !== 'online') {
      console.log(chalk.white(`Venue: ${eventData.venue?.name}`));
      console.log(chalk.white(`Address: ${eventData.venue?.address}, ${eventData.venue?.city}, ${eventData.venue?.state} ${eventData.venue?.zip}`));
    }
    console.log(chalk.white(`Platforms: ${displayPlatforms.join(', ')}`));
    if (options.dryRun) {
      console.log(chalk.yellow('\n🔍 DRY RUN MODE - No events will be created'));
    }
    console.log(chalk.gray('---------------------\n'));
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: options.dryRun ? 'Preview complete. Continue?' : 'Create this event?',
        default: true
      }
    ]);
    
    if (!confirm) {
      console.log(chalk.yellow('Event creation cancelled.'));
      return;
    }
    
    console.log(chalk.gray('\nCreating events...\n'));
    
    const result = await eventService.createEvents(eventData as Event, {
      dryRun: options.dryRun,
      platforms
    });

    console.log(formatPublishResult(result));

    if (result.status === 'failed') {
      process.exit(1);
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('LUMA_API_KEY') || error.message.includes('MEETUP_ACCESS_TOKEN')) {
        console.error(chalk.red('\nError: Missing API credentials'));
        console.log(chalk.gray('\nPlease set the following environment variables:'));
        console.log(chalk.gray('  LUMA_API_KEY - Your Luma API key'));
        console.log(chalk.gray('  MEETUP_ACCESS_TOKEN - Your Meetup OAuth access token'));
        console.log(chalk.gray('  MEETUP_GROUP_URLNAME - Your Meetup group URL name'));
        console.log(chalk.gray('\nOr create a .env file with these values.'));
      } else {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
    } else {
      console.error(chalk.red('\nAn unexpected error occurred'));
    }
    process.exit(1);
  }
}

export const createCommand = new Command('create')
  .description('Create a new event on Luma and Meetup.com')
  .option('-t, --template <id>', 'Use a predefined template (taoti-project-night, virtru-project-night, prefect-project-night)')
  .option('-d, --date <date>', 'Event date (YYYY-MM-DD)')
  .option('--time <time>', 'Start time (HH:mm, 24-hour format)')
  .option('--duration <minutes>', 'Duration in minutes')
  .option('--custom', 'Create a custom event without template')
  .option('--title <title>', 'Event title (overrides template default)')
  .option('--description <description>', 'Event description (overrides template default)')
  .option('--banner-image <path>', 'Path to banner image file')
  .option('--banner-url <url>', 'URL to banner image')
  .option('--venue-name <name>', 'Venue name (for custom events)')
  .option('--venue-address <address>', 'Venue address (for custom events)')
  .option('--venue-city <city>', 'Venue city (for custom events)')
  .option('--venue-state <state>', 'Venue state (for custom events)')
  .option('--venue-zip <zip>', 'Venue ZIP code (for custom events)')
  .option('--format <format>', 'Event format (in-person, online, hybrid)')
  .option('--online-url <url>', 'Online meeting URL for online/hybrid events')
  .option('--platforms <platforms>', 'Comma-separated platforms (luma,meetup)')
  .option('--dry-run', 'Preview event without creating', false)
  .option('--templates-path <path>', 'Path to external templates directory')
  .option('--built-in-only', 'Use built-in templates only (no external)', false)
  .action(async (options: CreateEventOptions) => {
    await createEventCommand(options);
  });
