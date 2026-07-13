import { afterEach, describe, it, expect, vi } from 'vitest';
import { loadConfig, validateConfig } from '@/utils/config';

describe('Config Validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should validate valid config', () => {
    const validConfig = {
      lumaApiKey: 'test-luma-key',
      meetupAccessToken: 'test-meetup-token',
      meetupGroupUrlname: 'test-group',
      defaultDuration: 180,
      defaultStartTime: '18:00',
      defaultTimezone: 'America/New_York',
      logLevel: 'info' as const,
      enabledPlatforms: ['luma', 'meetup']
    };

    const result = validateConfig(validConfig);
    expect(result.lumaApiKey).toBe('test-luma-key');
    expect(result.defaultDuration).toBe(180);
  });

  it('should apply defaults for optional fields', () => {
    const minimalConfig = {
      lumaApiKey: 'test-key',
      meetupAccessToken: 'test-token',
      meetupGroupUrlname: 'test-group',
      defaultDuration: 180,
      defaultStartTime: '18:00',
      defaultTimezone: 'America/New_York',
      logLevel: 'info' as const,
      enabledPlatforms: ['luma', 'meetup']
    };

    const result = validateConfig(minimalConfig);
    expect(result.defaultDuration).toBe(180);
    expect(result.defaultStartTime).toBe('18:00');
    expect(result.defaultTimezone).toBe('America/New_York');
  });

  it('should reject invalid time format', () => {
    const invalidConfig = {
      lumaApiKey: 'test-key',
      meetupAccessToken: 'test-token',
      meetupGroupUrlname: 'test-group',
      defaultDuration: 180,
      defaultStartTime: '25:00',
      defaultTimezone: 'America/New_York',
      logLevel: 'info' as const,
      enabledPlatforms: ['luma', 'meetup']
    };

    expect(() => validateConfig(invalidConfig)).toThrow();
  });

  it('should reject invalid log level', () => {
    const invalidConfig = {
      lumaApiKey: 'test-key',
      meetupAccessToken: 'test-token',
      meetupGroupUrlname: 'test-group',
      defaultDuration: 180,
      defaultStartTime: '18:00',
      defaultTimezone: 'America/New_York',
      logLevel: 'invalid',
      enabledPlatforms: ['luma', 'meetup']
    };

    expect(() => validateConfig(invalidConfig)).toThrow();
  });

  it('accepts a Luma-only configuration', () => {
    expect(
      validateConfig({ lumaApiKey: 'key', enabledPlatforms: ['luma'] }).primaryPlatform
    ).toBe('luma');
  });

  it('keeps unavailable platform credentials optional', () => {
    expect(
      validateConfig({
        meetupAccessToken: 'token',
        meetupGroupUrlname: 'group',
        enabledPlatforms: ['meetup']
      }).lumaApiKey
    ).toBeUndefined();
  });

  it('should accept missing platform credentials', () => {
    const incompleteConfig = {
      lumaApiKey: 'test-key',
      meetupGroupUrlname: 'test-group'
    };

    const result = validateConfig(incompleteConfig);
    expect(result.meetupAccessToken).toBeUndefined();
    expect(result.enabledPlatforms).toEqual([]);
  });

  it('parses platform selection and primary policy from the environment', () => {
    vi.stubEnv('ENABLED_PLATFORMS', ' luma, , meetup , ');
    vi.stubEnv('PRIMARY_PLATFORM', 'meetup');

    const result = loadConfig();

    expect(result.enabledPlatforms).toEqual(['luma', 'meetup']);
    expect(result.primaryPlatform).toBe('meetup');
  });

  it('uses an empty default platform selection when the environment is unset', () => {
    const originalPlatforms = process.env.ENABLED_PLATFORMS;
    delete process.env.ENABLED_PLATFORMS;

    expect(loadConfig().enabledPlatforms).toEqual([]);

    if (originalPlatforms !== undefined) {
      process.env.ENABLED_PLATFORMS = originalPlatforms;
    }
  });
});
