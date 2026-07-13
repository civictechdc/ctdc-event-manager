import { describe, it, expect } from 'vitest';
import { PlatformRegistry } from '@/platforms/platform-registry';
import { EventPlatform } from '@/platforms/platform.interface';

describe('PlatformRegistry', () => {
  it('should register and retrieve platforms', () => {
    const registry = new PlatformRegistry();
    const mockPlatform: EventPlatform = {
      name: 'test',
      displayName: 'Test Platform',
      createEvent: async () => ({ success: true })
    };

    registry.register(mockPlatform);
    const retrieved = registry.get('test');

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('test');
  });

  it('should check if platform exists', () => {
    const registry = new PlatformRegistry();
    const mockPlatform: EventPlatform = {
      name: 'test',
      displayName: 'Test Platform',
      createEvent: async () => ({ success: true })
    };

    expect(registry.has('test')).toBe(false);
    registry.register(mockPlatform);
    expect(registry.has('test')).toBe(true);
  });

  it('should list all platform names', () => {
    const registry = new PlatformRegistry();
    
    registry.register({
      name: 'platform1',
      displayName: 'Platform 1',
      createEvent: async () => ({ success: true })
    });
    
    registry.register({
      name: 'platform2',
      displayName: 'Platform 2',
      createEvent: async () => ({ success: true })
    });

    const names = registry.getNames();
    expect(names).toHaveLength(2);
    expect(names).toContain('platform1');
    expect(names).toContain('platform2');
  });

  it('should unregister platforms', () => {
    const registry = new PlatformRegistry();
    const mockPlatform: EventPlatform = {
      name: 'test',
      displayName: 'Test Platform',
      createEvent: async () => ({ success: true })
    };

    registry.register(mockPlatform);
    expect(registry.has('test')).toBe(true);
    
    const removed = registry.unregister('test');
    expect(removed).toBe(true);
    expect(registry.has('test')).toBe(false);
  });

  it('should clear all platforms', () => {
    const registry = new PlatformRegistry();
    
    registry.register({
      name: 'platform1',
      displayName: 'Platform 1',
      createEvent: async () => ({ success: true })
    });
    
    registry.register({
      name: 'platform2',
      displayName: 'Platform 2',
      createEvent: async () => ({ success: true })
    });

    registry.clear();
    expect(registry.getNames()).toHaveLength(0);
  });
});
