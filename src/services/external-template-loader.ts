import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { EventTemplate } from '../models/template';
import { TemplateIndex, isTemplateReference } from '../types/template-types';

export class ExternalTemplateLoader {
  private templatesPath: string;

  constructor(templatesPath: string = './templates') {
    this.templatesPath = path.resolve(templatesPath);
  }

  async loadTemplates(): Promise<EventTemplate[]> {
    if (!fs.existsSync(this.templatesPath)) {
      console.warn(`Templates directory not found: ${this.templatesPath}`);
      return [];
    }

    const index = this.loadIndex();
    const templates: EventTemplate[] = [];

    for (const templateRef of index.templates) {
      try {
        if (isTemplateReference(templateRef)) {
          if (templateRef.enabled !== false) {
            const template = await this.loadTemplateFromDir(templateRef.dir);
            if (template) {
              templates.push(template);
            }
          }
        } else {
          if (templateRef.enabled !== false) {
            templates.push(templateRef);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Failed to load template: ${message}`);
      }
    }

    return templates;
  }

  private loadIndex(): TemplateIndex {
    const indexPath = path.join(this.templatesPath, 'index.yaml');

    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf-8');
      return yaml.parse(content);
    }

    return this.autoDiscoverIndex();
  }

  private autoDiscoverIndex(): TemplateIndex {
    const entries = fs.readdirSync(this.templatesPath, { withFileTypes: true });

    const dirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    return {
      version: '1.0',
      templates: dirs.map(dir => ({ dir, enabled: true }))
    };
  }

  private async loadTemplateFromDir(dirName: string): Promise<EventTemplate | null> {
    const templatePath = path.join(this.templatesPath, dirName, 'template.yaml');

    if (!fs.existsSync(templatePath)) {
      console.warn(`No template.yaml found in ${dirName}`);
      return null;
    }

    const content = fs.readFileSync(templatePath, 'utf-8');
    const template = yaml.parse(content) as EventTemplate;

    this.validateTemplate(template, templatePath);

    if (template.defaultBannerImage?.source?.type === 'upload') {
      const templateDir = path.dirname(templatePath);
      const imagePath = template.defaultBannerImage.source.path;

      template.defaultBannerImage.source.path = this.safeResolvePath(
        templateDir,
        imagePath
      );

      if (!fs.existsSync(template.defaultBannerImage.source.path)) {
        throw new Error(
          `Banner image not found: ${template.defaultBannerImage.source.path}\n` +
          `Referenced in template: ${template.id}`
        );
      }
    }

    return template;
  }

  private validateTemplate(template: EventTemplate, filePath: string): void {
    const required = ['id', 'name', 'venue', 'eventType'] as const;
    const missing = required.filter(field => !template[field]);

    if (missing.length > 0) {
      throw new Error(
        `Template in ${filePath} missing required fields: ${missing.join(', ')}`
      );
    }
  }

  private safeResolvePath(basePath: string, relativePath: string): string {
    const resolved = path.resolve(basePath, relativePath);

    if (!resolved.startsWith(basePath)) {
      throw new Error(
        `Path traversal attempt detected: ${relativePath}`
      );
    }

    return resolved;
  }
}
