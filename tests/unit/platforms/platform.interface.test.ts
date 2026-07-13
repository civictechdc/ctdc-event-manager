import { describe, it, expect, expectTypeOf } from 'vitest';
import type { PublishOutcome, EventCreationResult } from '@/platforms/platform.interface';

describe('Platform Result Model', () => {
  it('typed failed outcomes carry an error and no event data', () => {
    const failed: PublishOutcome = {
      platform: 'luma',
      status: 'failed',
      error: {
        kind: 'platform-error',
        code: 'platform-error',
        message: 'Timed out',
        retryable: true
      }
    };

    expect(failed).not.toHaveProperty('eventUrl');
    expect(failed).toHaveProperty('error');
  });

  it('typed succeeded outcomes carry event data and no error', () => {
    const succeeded: PublishOutcome = {
      platform: 'luma',
      status: 'succeeded',
      eventId: 'evt-123',
      eventUrl: 'https://lu.ma/e/evt-123'
    };

    expect(succeeded).toHaveProperty('eventUrl');
    expect(succeeded).not.toHaveProperty('error');
  });

  it('result model supports status, outcomes, warnings, and dryRun', () => {
    const result: EventCreationResult = {
      status: 'succeeded',
      outcomes: [
        {
          platform: 'luma',
          status: 'succeeded',
          eventUrl: 'https://lu.ma/e/evt-123'
        }
      ],
      warnings: [],
      dryRun: true
    };

    expect(result.status).toBe('succeeded');
    expect(result.outcomes).toHaveLength(1);
    expect(result.warnings).toEqual([]);
    expect(result.dryRun).toBe(true);
  });

  it('does not allow skipped as a run status', () => {
    expectTypeOf<EventCreationResult['status']>().toEqualTypeOf<
      'succeeded' | 'failed' | 'partially-succeeded'
    >();
  });
});
