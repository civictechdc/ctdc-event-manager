import chalk from 'chalk';
import { listTemplatesAsync } from '../templates/template-manager';

export interface ListTemplatesOptions {
  json?: boolean;
  templatesPath?: string;
  builtInOnly?: boolean;
}

export async function listTemplatesCommand(options: ListTemplatesOptions): Promise<void> {
  const useExternal = !options.builtInOnly;
  const templates = await listTemplatesAsync(options.templatesPath, useExternal);
  
  if (options.json) {
    console.log(JSON.stringify(templates, null, 2));
    return;
  }
  
  console.log(chalk.bold.blue('\nAvailable Event Templates\n'));
  
  if (templates.length === 0) {
    console.log(chalk.yellow('No templates available.'));
    return;
  }
  
  templates.forEach((template, index) => {
    console.log(chalk.bold.white(`${index + 1}. ${template.name}`));
    console.log(chalk.gray(`   ID: ${template.id}`));
    console.log(chalk.gray(`   ${template.description}`));
    console.log(chalk.gray(`   Venue: ${template.venue.name}`));
    console.log(chalk.gray(`   Address: ${template.venue.address}, ${template.venue.city}, ${template.venue.state} ${template.venue.zip}`));
    console.log(chalk.gray(`   Default: ${template.defaultStartTime} for ${template.defaultDuration} minutes`));
    console.log('');
  });
  
  console.log(chalk.gray(`Use with: event-publisher create --template <id>`));
  console.log(chalk.gray(`Example: event-publisher create --template ${templates[0].id} --date 2024-01-15\n`));
}
