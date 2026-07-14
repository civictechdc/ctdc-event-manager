#!/usr/bin/env node
import { Command } from 'commander';
import { createCommand } from './commands/create-event.js';
import { listTemplatesCommand, ListTemplatesOptions } from './commands/list-templates.js';
import { authCommand } from './commands/auth.js';

const program = new Command();

program
  .name('event-publisher')
  .description('Create and publish events to Luma and Meetup.com')
  .version('1.0.0');

program.addCommand(createCommand);

program
  .command('templates')
  .description('List available event templates')
  .option('--json', 'Output as JSON', false)
  .option('--templates-path <path>', 'Path to external templates directory')
  .option('--built-in-only', 'Use built-in templates only (no external)', false)
  .action(async (options: ListTemplatesOptions) => {
    await listTemplatesCommand(options);
  });

program
  .command('auth <platform>')
  .description('Authenticate with a platform (luma, meetup)')
  .action(async (platform: string) => {
    await authCommand({ platform });
  });

program.parse();
