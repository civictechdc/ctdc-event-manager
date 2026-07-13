import { describe, it, expect } from 'vitest';
import { ImageConfig, isUploadImage, isUrlImage } from '@/models/image';

describe('Image Model', () => {
  it('should create upload image config', () => {
    const uploadImage: ImageConfig = {
      source: { type: 'upload', path: '/path/to/image.jpg' },
      alt: 'Event banner'
    };

    expect(uploadImage.source.type).toBe('upload');
    expect(isUploadImage(uploadImage)).toBe(true);
    expect(isUrlImage(uploadImage)).toBe(false);
  });

  it('should create URL image config', () => {
    const urlImage: ImageConfig = {
      source: { type: 'url', url: 'https://example.com/image.jpg' }
    };

    expect(urlImage.source.type).toBe('url');
    expect(isUrlImage(urlImage)).toBe(true);
    expect(isUploadImage(urlImage)).toBe(false);
  });

  it('should handle image without alt text', () => {
    const image: ImageConfig = {
      source: { type: 'url', url: 'https://example.com/image.png' }
    };

    expect(image.alt).toBeUndefined();
  });
});
