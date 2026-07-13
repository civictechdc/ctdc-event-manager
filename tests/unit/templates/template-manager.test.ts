import { describe, it, expect } from 'vitest';
import { getTemplate, listTemplates, templateExists, getTemplateIds } from '@/templates/template-manager';

describe('Template Manager', () => {
  it('should list all templates', () => {
    const templates = listTemplates();
    expect(templates.length).toBe(3);
    expect(templates.map(t => t.id)).toContain('taoti-project-night');
  });

  it('should get template by id', () => {
    const template = getTemplate('taoti-project-night');
    expect(template).toBeDefined();
    expect(template?.name).toBe('Taoti Project Night');
    expect(template?.venue.name).toBe('Taoti Creative');
  });

  it('should return undefined for invalid template id', () => {
    const template = getTemplate('invalid-id');
    expect(template).toBeUndefined();
  });

  it('should check if template exists', () => {
    expect(templateExists('taoti-project-night')).toBe(true);
    expect(templateExists('invalid-id')).toBe(false);
  });

  it('should get all template ids', () => {
    const ids = getTemplateIds();
    expect(ids).toHaveLength(3);
    expect(ids).toContain('taoti-project-night');
    expect(ids).toContain('virtru-project-night');
    expect(ids).toContain('prefect-project-night');
  });

  it('should have valid venue data in templates', () => {
    const templates = listTemplates();
    templates.forEach(template => {
      expect(template.venue.name).toBeTruthy();
      expect(template.venue.address).toBeTruthy();
      expect(template.venue.city).toBeTruthy();
      expect(template.venue.state).toBeTruthy();
      expect(template.venue.zip).toBeTruthy();
    });
  });

  it('should have default values in templates', () => {
    const templates = listTemplates();
    templates.forEach(template => {
      expect(template.defaultDuration).toBeGreaterThan(0);
      expect(template.defaultStartTime).toMatch(/^\d{2}:\d{2}$/);
      expect(template.defaultTitle).toBeTruthy();
      expect(template.defaultDescription).toBeTruthy();
    });
  });
});
