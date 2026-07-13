import { describe, it, expect } from 'vitest';
import {
  validateDateFormat,
  validateTimeFormat,
  validateFutureDate,
  validateDuration,
  createCommand,
  formatPublishResult
} from '../../../src/commands/create-event';
import { EventCreationResult } from '../../../src/platforms/platform.interface';

describe('CreateEvent Validation Functions', () => {
  describe('validateDateFormat', () => {
    it('should accept valid date format', () => {
      expect(validateDateFormat('2024-03-15')).toBe(true);
    });

    it('should reject invalid date format', () => {
      expect(validateDateFormat('03/15/2024')).toBe('Please enter a valid date in YYYY-MM-DD format');
      expect(validateDateFormat('invalid')).toBe('Please enter a valid date in YYYY-MM-DD format');
      expect(validateDateFormat('2024/03/15')).toBe('Please enter a valid date in YYYY-MM-DD format');
    });
  });

  describe('validateTimeFormat', () => {
    it('should accept valid 24-hour time format', () => {
      expect(validateTimeFormat('00:00')).toBe(true);
      expect(validateTimeFormat('12:00')).toBe(true);
      expect(validateTimeFormat('23:59')).toBe(true);
      expect(validateTimeFormat('18:30')).toBe(true);
    });

    it('should reject invalid time format', () => {
      expect(validateTimeFormat('24:00')).toBe('Please enter a valid time in HH:mm format (24-hour)');
      expect(validateTimeFormat('25:00')).toBe('Please enter a valid time in HH:mm format (24-hour)');
      expect(validateTimeFormat('12:60')).toBe('Please enter a valid time in HH:mm format (24-hour)');
      expect(validateTimeFormat('6pm')).toBe('Please enter a valid time in HH:mm format (24-hour)');
    });
  });

  describe('validateFutureDate', () => {
    it('should accept future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateStr = futureDate.toISOString().split('T')[0];
      
      expect(validateFutureDate(dateStr)).toBe(true);
    });

    it('should reject past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const dateStr = pastDate.toISOString().split('T')[0];
      
      expect(validateFutureDate(dateStr)).toBe('Event date must be in the future');
    });

    it('should reject invalid date format', () => {
      expect(validateFutureDate('invalid')).toBe('Please enter a valid date in YYYY-MM-DD format');
    });
  });

  describe('validateDuration', () => {
    it('should accept valid duration', () => {
      expect(validateDuration('60')).toBe(true);
      expect(validateDuration('180')).toBe(true);
      expect(validateDuration('1440')).toBe(true);
    });

    it('should reject duration below minimum', () => {
      expect(validateDuration('10')).toBe('Duration must be at least 15 minutes');
      expect(validateDuration('0')).toBe('Duration must be at least 15 minutes');
    });

    it('should reject duration above maximum', () => {
      expect(validateDuration('1500')).toBe('Duration cannot exceed 24 hours (1440 minutes)');
    });
  });
});

describe('CreateEvent CLI', () => {
  it('does not give --platforms a default', () => {
    const option = createCommand.options.find((o) => o.long === '--platforms');
    expect(option).toBeDefined();
    expect(option?.defaultValue).toBeUndefined();
  });

  describe('formatPublishResult', () => {
    it('prints successful URLs', () => {
      const result: EventCreationResult = {
        status: 'succeeded',
        outcomes: [
          { platform: 'luma', status: 'succeeded', eventUrl: 'https://lu.ma/test' },
          { platform: 'meetup', status: 'succeeded', eventUrl: 'https://meetup.com/test', draft: true }
        ],
        warnings: []
      };
      const output = formatPublishResult(result);
      expect(output).toContain('https://lu.ma/test');
      expect(output).toContain('https://meetup.com/test');
    });

    it('prints an ERROR line with retryability for failed platforms', () => {
      const result: EventCreationResult = {
        status: 'failed',
        outcomes: [
          {
            platform: 'meetup',
            status: 'failed',
            error: { kind: 'platform-error', code: 'platform-error', message: 'Timed out', retryable: true }
          }
        ],
        warnings: []
      };
      const output = formatPublishResult(result);
      expect(output).toContain('ERROR    meetup');
      expect(output).toContain('Timed out');
      expect(output).toContain('retryable');
    });

    it('prints a WARNING line for skipped platforms', () => {
      const result: EventCreationResult = {
        status: 'failed',
        outcomes: [
          { platform: 'luma', status: 'failed', error: { kind: 'platform-error', code: 'platform-error', message: 'Luma API error', retryable: false } },
          { platform: 'meetup', status: 'skipped', reason: 'dependency-failed' }
        ],
        warnings: [{ platform: 'meetup', reason: 'dependency-failed' }],
        dryRun: false
      };
      const output = formatPublishResult(result);
      expect(output).toContain('WARNING  meetup skipped');
      expect(output).toContain('dependency-failed');
    });

    it('reports partial status without claiming full success', () => {
      const result: EventCreationResult = {
        status: 'partially-succeeded',
        outcomes: [
          { platform: 'luma', status: 'succeeded', eventUrl: 'https://lu.ma/test' },
          { platform: 'meetup', status: 'failed', error: { kind: 'platform-error', code: 'platform-error', message: 'Meetup API error', retryable: false } }
        ],
        warnings: []
      };
      const output = formatPublishResult(result);
      expect(output).toContain('partially-succeeded');
      expect(output).not.toContain('successfully');
      expect(output).toContain('https://lu.ma/test');
      expect(output).toContain('ERROR    meetup');
    });

    it('includes all outcomes in the report', () => {
      const result: EventCreationResult = {
        status: 'partially-succeeded',
        outcomes: [
          { platform: 'luma', status: 'succeeded', eventUrl: 'https://lu.ma/test' },
          { platform: 'meetup', status: 'failed', error: { kind: 'not-configured', code: 'not-configured', message: 'Not configured', retryable: false } }
        ],
        warnings: []
      };
      const output = formatPublishResult(result);
      expect(output).toContain('luma');
      expect(output).toContain('meetup');
    });
  });
});
