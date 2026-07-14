import chalk from 'chalk';
import { MeetupAuth } from '../platforms/meetup/meetup-auth.js';

export interface AuthOptions {
  platform: string;
}

export async function authCommand(options: AuthOptions): Promise<void> {
  const platform = options.platform.toLowerCase();
  
  console.log(chalk.bold.blue(`\n${platform.charAt(0).toUpperCase() + platform.slice(1)} Authentication\n`));
  
  if (platform === 'meetup') {
    await authMeetup();
  } else if (platform === 'luma') {
    console.log(chalk.yellow('Luma uses API key authentication.'));
    console.log(chalk.gray('\nTo authenticate with Luma:'));
    console.log(chalk.gray('1. Log in to your Luma account'));
    console.log(chalk.gray('2. Go to Settings > API Keys'));
    console.log(chalk.gray('3. Generate a new API key'));
    console.log(chalk.gray('4. Set the LUMA_API_KEY environment variable:'));
    console.log(chalk.white('\n   export LUMA_API_KEY=your_api_key_here'));
    console.log(chalk.gray('\nOr add it to your .env file:'));
    console.log(chalk.white('   LUMA_API_KEY=your_api_key_here\n'));
  } else {
    console.log(chalk.red(`Unknown platform: ${platform}`));
    console.log(chalk.gray('\nSupported platforms: luma, meetup\n'));
    process.exit(1);
  }
}

async function authMeetup(): Promise<void> {
  const clientId = process.env.MEETUP_CLIENT_ID;
  const clientSecret = process.env.MEETUP_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.log(chalk.yellow('OAuth credentials not configured.'));
    console.log(chalk.gray('\nTo use OAuth authentication:'));
    console.log(chalk.gray('1. Create a Meetup OAuth application at:'));
    console.log(chalk.white('   https://www.meetup.com/api/oauthConsumer/create/'));
    console.log(chalk.gray('\n2. Set the following environment variables:'));
    console.log(chalk.white('   MEETUP_CLIENT_ID=your_client_id'));
    console.log(chalk.white('   MEETUP_CLIENT_SECRET=your_client_secret'));
    console.log(chalk.gray('\n3. For the redirect URI, use:'));
    console.log(chalk.white('   http://localhost:3000/callback'));
    console.log(chalk.gray('\nAlternatively, you can manually obtain an access token and set:'));
    console.log(chalk.white('   MEETUP_ACCESS_TOKEN=your_access_token\n'));
    return;
  }
  
  try {
    const auth = new MeetupAuth({
      clientId,
      clientSecret,
      port: 3000
    });
    
    const authUrl = auth.getAuthorizationUrl();
    
    console.log(chalk.gray('Please open the following URL in your browser to authorize:'));
    console.log(chalk.cyan(`\n  ${authUrl}\n`));
    console.log(chalk.gray('After authorization, you will be redirected to localhost:3000/callback'));
    console.log(chalk.gray('Copy the "code" parameter from the URL and exchange it for tokens.\n'));
    
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`\nAuthentication failed: ${error.message}`));
    } else {
      console.error(chalk.red('\nAn unexpected error occurred during authentication'));
    }
    process.exit(1);
  }
}
