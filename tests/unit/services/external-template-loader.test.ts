import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import { ExternalTemplateLoader } from '../../../src/services/external-template-loader';
import { clearTemplateCache } from '../../../src/templates/template-manager';

describe('ExternalTemplateLoader', () => {
  const fixturesDir = path.join(__dirname, '../../fixtures/templates');

  beforeEach(() => {
    clearTemplateCache();
  });

  afterEach(() => {
    clearTemplateCache();
  });

  describe('loadTemplates', () => {
    it('should load templates from valid directory', async () => {
      const loader = new ExternalTemplateLoader(fixturesDir);
      const templates = await loader.loadTemplates();

      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
    });

    it('should return empty array if directory not found', async () => {
      const loader = new ExternalTemplateLoader('/nonexistent/path');
      const templates = await loader.loadTemplates();

      expect(templates).toEqual([]);
    });

    it('should skip disabled templates', async () => {
      const loader = new ExternalTemplateLoader(fixturesDir);
      const templates = await loader.loadTemplates();

      const disabled = templates.find(t => t.id === 'disabled-template');
      expect(disabled).toBeUndefined();
    });

    it('should load enabled templates', async () => {
      const loader = new ExternalTemplateLoader(fixturesDir);
      const templates = await loader.loadTemplates();

      const validTemplate = templates.find(t => t.id === 'valid-template');
      expect(validTemplate).toBeDefined();
      expect(validTemplate?.name).toBe('Valid Template');
    });
  });

  describe('template content', () => {
    it('should parse venue information correctly', async () => {
      const loader = new ExternalTemplateLoader(fixturesDir);
      const templates = await loader.loadTemplates();

      const template = templates.find(t => t.id === 'valid-template');
      expect(template?.venue.name).toBe('Test Venue');
      expect(template?.venue.address).toBe('123 Test St');
      expect(template?.venue.city).toBe('Test City');
    });

    it('should parse event settings correctly', async () => {
      const loader = new ExternalTemplateLoader(fixturesDir);
      const templates = await loader.loadTemplates();

      const template = templates.find(t => t.id === 'valid-template');
      expect(template?.eventType).toBe('test');
      expect(template?.defaultDuration).toBe(60);
      expect(template?.defaultStartTime).toBe('12:00');
    });

    it('should parse template strings with variables', async () => {
      const loader = new ExternalTemplateLoader(fixturesDir);
      const templates = await loader.loadTemplates();

      const template = templates.find(t => t.id === 'valid-template');
      expect(template?.defaultTitle).toBe('Test {{eventType}}');
      expect(template?.defaultDescription).toBe('Event at {{venue.name}}');
    });
  });
});
