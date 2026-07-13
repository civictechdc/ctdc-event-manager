import { EventTemplate } from '../models/template';
import { getTemplate as getBuiltInTemplate, listTemplates as listBuiltInTemplates } from './venue-templates';
import { ExternalTemplateLoader } from '../services/external-template-loader';
import { TemplateEngine } from '../services/template-engine';
import { TemplateContext } from '../types/template-types';

export { getBuiltInTemplate as getTemplate, listBuiltInTemplates as listTemplates };

export function getTemplateIds(): string[] {
  return listBuiltInTemplates().map(t => t.id);
}

export function templateExists(id: string): boolean {
  return getBuiltInTemplate(id) !== undefined;
}

export function getTemplateByName(name: string): EventTemplate | undefined {
  return listBuiltInTemplates().find(t =>
    t.name.toLowerCase().includes(name.toLowerCase())
  );
}

let cachedTemplates: EventTemplate[] | null = null;
let cachedTemplatesUseExternal: boolean | null = null;
let templateEngine: TemplateEngine | null = null;

function getTemplateEngine(): TemplateEngine {
  if (!templateEngine) {
    templateEngine = new TemplateEngine();
  }
  return templateEngine;
}

export async function loadAllTemplates(templatesPath?: string, useExternal: boolean = true): Promise<EventTemplate[]> {
  if (cachedTemplates !== null && cachedTemplatesUseExternal === useExternal) {
    return cachedTemplates;
  }

  const builtIn = listBuiltInTemplates();
  
  if (!useExternal) {
    cachedTemplates = builtIn;
    cachedTemplatesUseExternal = false;
    return builtIn;
  }

  const effectivePath = templatesPath || process.env.TEMPLATES_PATH || './templates';
  const loader = new ExternalTemplateLoader(effectivePath);
  const external = await loader.loadTemplates();

  const merged = new Map<string, EventTemplate>();

  builtIn.forEach(template => {
    merged.set(template.id, template);
  });

  external.forEach(template => {
    if (template.enabled !== false) {
      merged.set(template.id, template);
    }
  });

  cachedTemplates = Array.from(merged.values());
  cachedTemplatesUseExternal = true;
  return cachedTemplates;
}

export async function getTemplateAsync(
  id: string,
  context?: TemplateContext,
  templatesPath?: string,
  useExternal: boolean = true
): Promise<EventTemplate | undefined> {
  const templates = await loadAllTemplates(templatesPath, useExternal);
  const template = templates.find(t => t.id === id);

  if (!template) {
    return undefined;
  }

  if (context) {
    return renderTemplate(template, context);
  }

  return template;
}

export async function listTemplatesAsync(templatesPath?: string, useExternal: boolean = true): Promise<EventTemplate[]> {
  return loadAllTemplates(templatesPath, useExternal);
}

export async function templateExistsAsync(id: string, templatesPath?: string, useExternal: boolean = true): Promise<boolean> {
  const templates = await loadAllTemplates(templatesPath, useExternal);
  return templates.some(t => t.id === id);
}

export async function getTemplateIdsAsync(templatesPath?: string, useExternal: boolean = true): Promise<string[]> {
  const templates = await loadAllTemplates(templatesPath, useExternal);
  return templates.map(t => t.id);
}

export async function getTemplateByNameAsync(name: string, templatesPath?: string, useExternal: boolean = true): Promise<EventTemplate | undefined> {
  const templates = await loadAllTemplates(templatesPath, useExternal);
  return templates.find(t =>
    t.name.toLowerCase().includes(name.toLowerCase())
  );
}

function renderTemplate(template: EventTemplate, context: TemplateContext): EventTemplate {
  const engine = getTemplateEngine();
  const contextObj = context as unknown as Record<string, unknown>;

  return {
    ...template,
    defaultTitle: engine.render(template.defaultTitle, contextObj),
    defaultDescription: engine.render(template.defaultDescription, contextObj)
  };
}

export function clearTemplateCache(): void {
  cachedTemplates = null;
  cachedTemplatesUseExternal = null;
}
