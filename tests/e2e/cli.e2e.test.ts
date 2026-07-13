import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';

const cliPath = join(process.cwd(), 'src', 'index.ts');

function runCli(args: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`bun run tsx "${cliPath}" ${args}`, {
      encoding: 'utf-8',
      timeout: 10000,
      env: {
        ...process.env,
        LUMA_API_KEY: 'test-key',
        MEETUP_ACCESS_TOKEN: 'test-token',
        MEETUP_GROUP_URLNAME: 'test-group'
      }
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: string;
      stderr?: string;
      status?: number;
      message: string;
    };
    return {
      stdout: execError.stdout || '',
      stderr: execError.stderr || execError.message,
      exitCode: execError.status || 1
    };
  }
}

describe('CLI E2E Tests', () => {
  describe('Help Command', () => {
    it('should show help when --help flag is passed', () => {
      const result = runCli('--help');
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('event-publisher');
      expect(result.stdout).toContain('Create and publish events');
    });

    it('should list available commands', () => {
      const result = runCli('--help');
      
      expect(result.stdout).toContain('create');
      expect(result.stdout).toContain('templates');
      expect(result.stdout).toContain('auth');
    });
  });

  describe('Version Command', () => {
    it('should show version when --version flag is passed', () => {
      const result = runCli('--version');
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('1.0.0');
    });
  });

  describe('Templates Command', () => {
    it('should list all available templates', () => {
      const result = runCli('templates');
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Taoti Project Night');
      expect(result.stdout).toContain('Virtru Project Night');
      expect(result.stdout).toContain('Prefect Project Night');
    });

    it('should show template IDs', () => {
      const result = runCli('templates');
      
      expect(result.stdout).toContain('taoti-project-night');
      expect(result.stdout).toContain('virtru-project-night');
      expect(result.stdout).toContain('prefect-project-night');
    });

    it('should output JSON format with --json flag', () => {
      const result = runCli('templates --json --built-in-only');
      
      expect(result.exitCode).toBe(0);
      
      const templates = JSON.parse(result.stdout);
      expect(Array.isArray(templates)).toBe(true);
      expect(templates).toHaveLength(3);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
    });
  });

  describe('Create Command Help', () => {
    it('should show create command options', () => {
      const result = runCli('create --help');
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('--template');
      expect(result.stdout).toContain('--date');
      expect(result.stdout).toContain('--time');
      expect(result.stdout).toContain('--duration');
      expect(result.stdout).toContain('--dry-run');
      expect(result.stdout).toContain('--platforms');
    });

    it('should not show a default value for --platforms', () => {
      const result = runCli('create --help');
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('--platforms');
      expect(result.stdout).not.toContain('default: "luma,meetup"');
      expect(result.stdout).not.toContain("default: 'luma,meetup'");
      expect(result.stdout).not.toContain('(default: luma,meetup)');
    });
  });

  describe('Auth Command', () => {
    it('should show Luma authentication instructions', () => {
      const result = runCli('auth luma');
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('API key authentication');
      expect(result.stdout).toContain('LUMA_API_KEY');
    });

    it('should show Meetup authentication instructions', () => {
      const result = runCli('auth meetup');
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('OAuth');
    });

    it('should fail for unknown platform', () => {
      const result = runCli('auth unknown');
      
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Unknown platform');
    });
  });
});

describe('CLI Error Handling', () => {
  it('should show error for unknown command', () => {
    const result = runCli('unknown-command');
    
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('error');
  });

  it('should handle missing required arguments gracefully', () => {
    const result = runCli('auth');
    
    expect(result.exitCode).toBe(1);
  });
});
