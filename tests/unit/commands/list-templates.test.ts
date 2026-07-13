import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listTemplatesCommand } from '../../../src/commands/list-templates';

describe('ListTemplatesCommand', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleLogSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('listTemplatesCommand', () => {
    it('should list all available templates', async () => {
      await listTemplatesCommand({});
      
      const output = consoleLogSpy.mock.calls.map(c => c.join(' ')).join('\n');
      
      expect(output).toContain('Taoti Project Night');
      expect(output).toContain('Virtru Project Night');
      expect(output).toContain('Prefect Project Night');
    });

    it('should show template IDs', async () => {
      await listTemplatesCommand({});
      
      const output = consoleLogSpy.mock.calls.map(c => c.join(' ')).join('\n');
      
      expect(output).toContain('taoti-project-night');
      expect(output).toContain('virtru-project-night');
      expect(output).toContain('prefect-project-night');
    });

    it('should show venue information', async () => {
      await listTemplatesCommand({});
      
      const output = consoleLogSpy.mock.calls.map(c => c.join(' ')).join('\n');
      
      expect(output).toContain('Taoti Creative');
      expect(output).toContain('Virtru');
      expect(output).toContain('Prefect');
    });

    it('should show usage example', async () => {
      await listTemplatesCommand({});
      
      const output = consoleLogSpy.mock.calls.map(c => c.join(' ')).join('\n');
      
      expect(output).toContain('event-publisher create --template');
    });

    it('should output JSON format when --json flag is set', async () => {
      await listTemplatesCommand({ json: true, builtInOnly: true });
      
      const output = consoleLogSpy.mock.calls.map(c => c.join(' ')).join('\n');
      
      expect(() => JSON.parse(output)).not.toThrow();
      
      const templates = JSON.parse(output);
      expect(templates).toHaveLength(3);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('venue');
    });
  });
});
