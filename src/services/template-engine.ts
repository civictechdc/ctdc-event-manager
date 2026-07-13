import { TemplateContext } from '../types/template-types';

export class TemplateEngine {
  render(template: string, context: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path: string) => {
      return this.getNestedValue(context, path);
    });
  }

  private getNestedValue(obj: unknown, path: string): string {
    const keys = path.split('.');
    let value: unknown = obj;

    for (const key of keys) {
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        value = (value as Record<string, unknown>)[key];
      } else {
        return '';
      }
    }

    if (value === null || value === undefined) {
      return '';
    }

    return String(value);
  }

  buildContext(params: {
    date?: string;
    startTime?: string;
    duration?: number;
    eventType?: string;
    venue?: TemplateContext['venue'];
    title?: string;
    description?: string;
    custom?: Record<string, unknown>;
  }): TemplateContext {
    return {
      date: params.date || '',
      startTime: params.startTime || '',
      duration: params.duration || 180,
      eventType: params.eventType || '',
      venue: params.venue || {
        name: '',
        address: '',
        city: '',
        state: '',
        zip: ''
      },
      title: params.title || '',
      description: params.description || '',
      custom: params.custom
    };
  }
}
