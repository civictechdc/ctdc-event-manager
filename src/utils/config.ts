import { z } from 'zod';

const configSchema = z.object({
  lumaApiKey: z.string().min(1).optional(),
  meetupAccessToken: z.string().min(1).optional(),
  meetupGroupUrlname: z.string().min(1).optional(),
  meetupClientId: z.string().optional(),
  meetupClientSecret: z.string().optional(),
  defaultDuration: z.number().int().positive().default(180),
  defaultStartTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('18:00'),
  defaultTimezone: z.string().default('America/New_York'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  enabledPlatforms: z.array(z.string()).default([]),
  primaryPlatform: z.string().default('luma')
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  const rawConfig = {
    lumaApiKey: process.env.LUMA_API_KEY,
    meetupAccessToken: process.env.MEETUP_ACCESS_TOKEN,
    meetupGroupUrlname: process.env.MEETUP_GROUP_URLNAME,
    meetupClientId: process.env.MEETUP_CLIENT_ID,
    meetupClientSecret: process.env.MEETUP_CLIENT_SECRET,
    defaultDuration: parseInt(process.env.DEFAULT_EVENT_DURATION || '180', 10),
    defaultStartTime: process.env.DEFAULT_START_TIME || '18:00',
    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'America/New_York',
    logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info',
    enabledPlatforms: process.env.ENABLED_PLATFORMS?.split(',').map(p => p.trim()).filter(p => p.length > 0) || [],
    primaryPlatform: process.env.PRIMARY_PLATFORM || 'luma'
  };

  return configSchema.parse(rawConfig);
}

export function validateConfig(config: unknown): Config {
  return configSchema.parse(config);
}
