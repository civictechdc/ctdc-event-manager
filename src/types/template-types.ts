import { EventTemplate } from '../models/template';

export interface TemplateIndex {
  version: string;
  settings?: {
    cacheTemplates?: boolean;
    maxTemplateSize?: number;
    maxImageSize?: number;
  };
  templates: Array<TemplateReference | EventTemplate>;
}

export type TemplateReference = {
  dir: string;
  enabled?: boolean;
};

export function isTemplateReference(ref: unknown): ref is TemplateReference {
  return typeof ref === 'object' && ref !== null && 'dir' in ref && typeof (ref as TemplateReference).dir === 'string';
}

export interface TemplateContext {
  date: string;
  startTime: string;
  duration: number;
  eventType: string;
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    [key: string]: unknown;
  };
  title: string;
  description: string;
  custom?: Record<string, unknown>;
}
