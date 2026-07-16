import { Event } from '../models/event.js';
import { Config } from '../utils/config.js';
import { PlatformRegistry } from '../platforms/platform-registry.js';
import {
  EventCreationResult,
  EventPlatform,
  PlatformContext,
  PlatformError,
  PlatformResult,
  PublishOutcome,
  PublishOutcomeFailed,
  PublishWarning,
} from '../platforms/platform.interface.js';
import { ValidationService } from './validation-service.js';
import { LumaPlatform } from '../platforms/luma/luma-platform.js';
import { MeetupPlatform } from '../platforms/meetup/meetup-platform.js';

const KNOWN_PLATFORMS = ['luma', 'meetup'];

export class EventService {
  private registry: PlatformRegistry;
  private validator: ValidationService;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.registry = new PlatformRegistry();
    this.validator = new ValidationService();

    if (config.lumaApiKey) {
      this.registry.register(new LumaPlatform(config.lumaApiKey));
    }

    if (config.meetupAccessToken && config.meetupGroupUrlname) {
      this.registry.register(
        new MeetupPlatform(config.meetupAccessToken, config.meetupGroupUrlname)
      );
    }
  }

  async createEvents(
    event: Event,
    options: { dryRun?: boolean; platforms?: string[] } = {}
  ): Promise<EventCreationResult> {
    try {
      this.validator.validateEvent(event);
    } catch (error) {
      return {
        status: 'failed',
        outcomes: [
          this.createFailedOutcome('event', {
            kind: 'invalid-configuration',
            code: 'validation-error',
            message: error instanceof Error ? error.message : String(error),
            retryable: false,
          }),
        ],
        warnings: [],
      };
    }

    const rawSelection = options.platforms ?? this.config.enabledPlatforms;
    const selectedNames = [
      ...new Set(
        rawSelection.map((name) => name.trim().toLowerCase()).filter((name) => name.length > 0)
      ),
    ];

    const preflightResult = this.runPreflight(selectedNames);
    if (preflightResult) {
      return preflightResult;
    }

    const primary = (this.config.primaryPlatform ?? 'luma').toLowerCase();
    const orderedNames = this.orderSelection(selectedNames, primary);

    if (options.dryRun) {
      return {
        status: 'succeeded',
        outcomes: orderedNames.map((name) => this.createDryRunOutcome(name)),
        warnings: [],
        dryRun: true,
      };
    }

    const outcomes: PublishOutcome[] = [];
    let primaryFailed = false;
    let lumaSuccessUrl: string | undefined;

    for (const name of orderedNames) {
      if (primaryFailed) {
        outcomes.push({
          platform: name,
          status: 'skipped',
          reason: 'dependency-failed',
        });
        continue;
      }

      const platform = this.registry.get(name)!;

      const context =
        name === 'meetup' && lumaSuccessUrl ? { lumaEventUrl: lumaSuccessUrl } : undefined;

      const outcome = await this.executePlatform(platform, event, context);
      outcomes.push(outcome);

      if (outcome.status === 'succeeded') {
        if (name === 'luma') {
          lumaSuccessUrl = outcome.eventUrl;
        }
      } else if (name === primary) {
        primaryFailed = true;
      }
    }

    return {
      status: this.computeStatus(outcomes),
      outcomes,
      warnings: this.buildWarnings(outcomes, primary, orderedNames),
    };
  }

  getPlatform(name: string) {
    return this.registry.get(name);
  }

  getEnabledPlatforms(): string[] {
    return this.config.enabledPlatforms;
  }

  private runPreflight(selectedNames: string[]): EventCreationResult | null {
    if (selectedNames.length === 0) {
      return {
        status: 'failed',
        outcomes: [
          this.createFailedOutcome('event', {
            kind: 'invalid-configuration',
            code: 'no-platforms-selected',
            message: 'No platforms selected',
            retryable: false,
          }),
        ],
        warnings: [],
      };
    }

    const outcomes: PublishOutcome[] = [];

    for (const name of selectedNames) {
      if (!KNOWN_PLATFORMS.includes(name)) {
        outcomes.push(
          this.createFailedOutcome(name, {
            kind: 'invalid-configuration',
            code: 'unknown-platform',
            message: `Unknown platform: ${name}`,
            retryable: false,
          })
        );
      } else if (!this.registry.has(name)) {
        outcomes.push(
          this.createFailedOutcome(name, {
            kind: 'not-configured',
            code: 'not-configured',
            message: `${name} platform is not configured`,
            retryable: false,
          })
        );
      }
    }

    const primary = (this.config.primaryPlatform ?? 'luma').toLowerCase();
    if (selectedNames.length > 1 && !selectedNames.includes(primary)) {
      outcomes.push(
        this.createFailedOutcome(primary, {
          kind: 'invalid-configuration',
          code: 'primary-not-selected',
          message: `Primary platform ${primary} must be included in multi-selection`,
          retryable: false,
        })
      );
    }

    if (outcomes.length > 0) {
      return {
        status: 'failed',
        outcomes,
        warnings: [],
      };
    }

    return null;
  }

  private orderSelection(selectedNames: string[], primary: string): string[] {
    const ordered: string[] = [];
    if (selectedNames.includes(primary)) {
      ordered.push(primary);
    }
    for (const name of selectedNames) {
      if (name !== primary) {
        ordered.push(name);
      }
    }
    return ordered;
  }

  private async executePlatform(
    platform: EventPlatform,
    event: Event,
    context?: PlatformContext
  ): Promise<PublishOutcome> {
    try {
      const platformResult: PlatformResult = await platform.createEvent(event, context);

      if (platformResult.success) {
        return {
          platform: platform.name,
          status: 'succeeded',
          eventId: platformResult.eventId,
          eventUrl: platformResult.eventUrl,
          draft: platformResult.draft,
        };
      }

      return this.createFailedOutcome(platform.name, {
        kind: 'platform-error',
        code: 'platform-error',
        message: platformResult.error || 'Unknown platform error',
        retryable: false,
      });
    } catch (error) {
      return this.createFailedOutcome(platform.name, {
        kind: 'platform-error',
        code: 'platform-error',
        message: error instanceof Error ? error.message : String(error),
        retryable: false,
      });
    }
  }

  private createFailedOutcome(
    platform: string,
    error: PlatformError
  ): PublishOutcomeFailed {
    return {
      platform,
      status: 'failed',
      error,
    };
  }

  private createDryRunOutcome(name: string): PublishOutcome {
    return {
      platform: name,
      status: 'succeeded',
      eventId: `dry-run-${name}`,
      eventUrl: `https://${name}.com/dry-run`,
      draft: name !== 'luma',
    };
  }

  private computeStatus(outcomes: PublishOutcome[]): EventCreationResult['status'] {
    const total = outcomes.length;
    const succeeded = outcomes.filter((o) => o.status === 'succeeded').length;

    if (total > 0 && succeeded === total) {
      return 'succeeded';
    }
    if (succeeded === 0) {
      return 'failed';
    }
    return 'partially-succeeded';
  }

  private buildWarnings(
    outcomes: PublishOutcome[],
    primary: string,
    orderedNames: string[]
  ): PublishWarning[] {
    const warnings: PublishWarning[] = [];
    const primaryOutcome = outcomes.find((o) => o.platform === primary);

    if (primaryOutcome?.status === 'failed') {
      for (const name of orderedNames) {
        if (name !== primary) {
          warnings.push({
            platform: name,
            reason: 'dependency-failed',
          });
        }
      }
    }

    return warnings;
  }
}
