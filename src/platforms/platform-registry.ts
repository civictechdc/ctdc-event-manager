import { EventPlatform } from './platform.interface';

export class PlatformRegistry {
  private platforms: Map<string, EventPlatform> = new Map();
  
  register(platform: EventPlatform): void {
    this.platforms.set(platform.name, platform);
  }
  
  get(name: string): EventPlatform | undefined {
    return this.platforms.get(name);
  }
  
  has(name: string): boolean {
    return this.platforms.has(name);
  }
  
  getAll(): EventPlatform[] {
    return Array.from(this.platforms.values());
  }
  
  getNames(): string[] {
    return Array.from(this.platforms.keys());
  }
  
  unregister(name: string): boolean {
    return this.platforms.delete(name);
  }
  
  clear(): void {
    this.platforms.clear();
  }
}
