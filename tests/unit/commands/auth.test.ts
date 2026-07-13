import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authCommand } from '../../../src/commands/auth';

describe('AuthCommand', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleLogSpy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleErrorSpy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let processExitSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('authCommand', () => {
    it('should show instructions for Luma authentication', async () => {
      await authCommand({ platform: 'luma' });
      
      const output = consoleLogSpy.mock.calls.map(c => c.join(' ')).join('\n');
      
      expect(output).toContain('API key authentication');
      expect(output).toContain('LUMA_API_KEY');
    });

    it('should show instructions for Meetup when OAuth not configured', async () => {
      const originalClientId = process.env.MEETUP_CLIENT_ID;
      const originalClientSecret = process.env.MEETUP_CLIENT_SECRET;
      
      delete process.env.MEETUP_CLIENT_ID;
      delete process.env.MEETUP_CLIENT_SECRET;
      
      await authCommand({ platform: 'meetup' });
      
      const output = consoleLogSpy.mock.calls.map(c => c.join(' ')).join('\n');
      
      expect(output).toContain('OAuth credentials not configured');
      expect(output).toContain('MEETUP_CLIENT_ID');
      
      if (originalClientId) process.env.MEETUP_CLIENT_ID = originalClientId;
      if (originalClientSecret) process.env.MEETUP_CLIENT_SECRET = originalClientSecret;
    });

    it('should exit with error for unknown platform', async () => {
      await expect(authCommand({ platform: 'unknown' })).rejects.toThrow('process.exit');
      
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should show supported platforms for unknown platform', async () => {
      try {
        await authCommand({ platform: 'unknown' });
      } catch {
        // Expected
      }
      
      const output = consoleLogSpy.mock.calls.map(c => c.join(' ')).join('\n');
      
      expect(output).toContain('Supported platforms');
      expect(output).toContain('luma');
      expect(output).toContain('meetup');
    });

    it('should handle case-insensitive platform names', async () => {
      await authCommand({ platform: 'LUMA' });
      
      const output = consoleLogSpy.mock.calls.map(c => c.join(' ')).join('\n');
      
      expect(output).toContain('Luma Authentication');
    });
  });
});
