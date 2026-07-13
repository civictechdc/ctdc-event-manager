import { describe, it, expect } from 'vitest';
import { TemplateEngine } from '../../../src/services/template-engine';

describe('TemplateEngine', () => {
  const engine = new TemplateEngine();

  describe('render', () => {
    it('should substitute simple variables', () => {
      const template = 'Hello {{name}}!';
      const result = engine.render(template, { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should substitute nested variables', () => {
      const template = 'Event at {{venue.name}}';
      const result = engine.render(template, {
        venue: { name: 'Taoti' }
      });
      expect(result).toBe('Event at Taoti');
    });

    it('should handle missing variables', () => {
      const template = 'Hello {{unknown}}!';
      const result = engine.render(template, {});
      expect(result).toBe('Hello !');
    });

    it('should handle multiple variables', () => {
      const template = '{{venue.name}} - {{date}} at {{startTime}}';
      const result = engine.render(template, {
        venue: { name: 'Taoti' },
        date: 'Jan 15',
        startTime: '6 PM'
      });
      expect(result).toBe('Taoti - Jan 15 at 6 PM');
    });

    it('should handle deeply nested variables', () => {
      const template = 'Lat: {{venue.coordinates.latitude}}, Lng: {{venue.coordinates.longitude}}';
      const result = engine.render(template, {
        venue: {
          coordinates: {
            latitude: 38.8997,
            longitude: -77.0303
          }
        }
      });
      expect(result).toBe('Lat: 38.8997, Lng: -77.0303');
    });

    it('should handle null values gracefully', () => {
      const template = 'Value: {{value}}';
      const result = engine.render(template, { value: null });
      expect(result).toBe('Value: ');
    });

    it('should handle undefined values gracefully', () => {
      const template = 'Value: {{value}}';
      const result = engine.render(template, { value: undefined });
      expect(result).toBe('Value: ');
    });

    it('should convert numbers to strings', () => {
      const template = 'Duration: {{duration}} minutes';
      const result = engine.render(template, { duration: 180 });
      expect(result).toBe('Duration: 180 minutes');
    });
  });

  describe('buildContext', () => {
    it('should build context with all parameters', () => {
      const context = engine.buildContext({
        date: 'January 15, 2024',
        startTime: '6:00 PM',
        duration: 180,
        eventType: 'project-night',
        venue: {
          name: 'Taoti Creative',
          address: '1333 H St NW',
          city: 'Washington',
          state: 'DC',
          zip: '20005'
        },
        title: 'Test Event',
        description: 'Test Description',
        custom: { sponsor: 'Taoti' }
      });

      expect(context.date).toBe('January 15, 2024');
      expect(context.startTime).toBe('6:00 PM');
      expect(context.duration).toBe(180);
      expect(context.eventType).toBe('project-night');
      expect(context.venue.name).toBe('Taoti Creative');
      expect(context.title).toBe('Test Event');
      expect(context.description).toBe('Test Description');
      expect(context.custom?.sponsor).toBe('Taoti');
    });

    it('should use defaults for missing parameters', () => {
      const context = engine.buildContext({});

      expect(context.date).toBe('');
      expect(context.startTime).toBe('');
      expect(context.duration).toBe(180);
      expect(context.eventType).toBe('');
      expect(context.venue.name).toBe('');
    });
  });
});
